package matcher

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"sort"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
	"github.com/shopspring/decimal"
)

type OrderAddPayload struct {
	OrderID   string `json:"orderId"`
	UserID    string `json:"userId"`
	Symbol    string `json:"symbol"`
	Side      string `json:"side"`
	Price     string `json:"price"`
	Remaining string `json:"remaining"`
}

type OrderRemovePayload struct {
	OrderID string `json:"orderId"`
	Symbol  string `json:"symbol"`
}

type TradePayload struct {
	Symbol       string `json:"symbol"`
	MakerOrderID string `json:"makerOrderId"`
	TakerOrderID string `json:"takerOrderId"`
	MakerSide    string `json:"makerSide"`
	Price        string `json:"price"`
	Quantity     string `json:"quantity"`
}

type RestingOrder struct {
	ID        string
	UserID    string
	Symbol    string
	Side      string
	Price     decimal.Decimal
	Remaining decimal.Decimal
	CreatedAt time.Time
}

type PriceLevel struct {
	Price  decimal.Decimal
	Orders []*RestingOrder
}

type Book struct {
	Bids []*PriceLevel
	Asks []*PriceLevel
	ByID map[string]*RestingOrder
}

type Engine struct {
	pool *pgxpool.Pool
	rdb  *redis.Client
	books map[string]*Book
}

func New(ctx context.Context) (*Engine, error) {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		return nil, fmt.Errorf("DATABASE_URL required")
	}
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		return nil, err
	}
	ru := os.Getenv("REDIS_URL")
	if ru == "" {
		ru = "redis://127.0.0.1:6379"
	}
	opt, err := redis.ParseURL(ru)
	if err != nil {
		return nil, err
	}
	rdb := redis.NewClient(opt)

	e := &Engine{pool: pool, rdb: rdb, books: map[string]*Book{}}
	if err := e.replay(ctx); err != nil {
		return nil, err
	}
	return e, nil
}

func (e *Engine) Close() {
	e.pool.Close()
	_ = e.rdb.Close()
}

func (e *Engine) book(sym string) *Book {
	b := e.books[sym]
	if b == nil {
		b = &Book{ByID: map[string]*RestingOrder{}}
		e.books[sym] = b
	}
	return b
}

func (e *Engine) replay(ctx context.Context) error {
	rows, err := e.pool.Query(ctx, `SELECT event, payload::text FROM "MatchLog" ORDER BY seq ASC`)
	if err != nil {
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var ev string
		var payload string
		if err := rows.Scan(&ev, &payload); err != nil {
			return err
		}
		if err := e.applyEvent(ev, []byte(payload)); err != nil {
			return fmt.Errorf("replay %s: %w", ev, err)
		}
	}
	log.Printf("replay complete, symbols=%d", len(e.books))
	return nil
}

func (e *Engine) applyEvent(ev string, raw []byte) error {
	switch ev {
	case "ORDER_ADD":
		var p OrderAddPayload
		if err := json.Unmarshal(raw, &p); err != nil {
			return err
		}
		rem, err := decimal.NewFromString(p.Remaining)
		if err != nil {
			return err
		}
		price, err := decimal.NewFromString(p.Price)
		if err != nil {
			return err
		}
		e.addResting(&RestingOrder{
			ID: p.OrderID, UserID: p.UserID, Symbol: strings.ToUpper(p.Symbol), Side: p.Side,
			Price: price, Remaining: rem, CreatedAt: time.Now().UTC(),
		})
	case "ORDER_REMOVE":
		var p OrderRemovePayload
		if err := json.Unmarshal(raw, &p); err != nil {
			return err
		}
		e.removeFromBook(strings.ToUpper(p.Symbol), p.OrderID)
	case "TRADE":
		var p TradePayload
		if err := json.Unmarshal(raw, &p); err != nil {
			return err
		}
		symU := strings.ToUpper(p.Symbol)
		qty, err := decimal.NewFromString(p.Quantity)
		if err != nil {
			return err
		}
		if o := e.book(symU).ByID[p.MakerOrderID]; o != nil {
			o.Remaining = o.Remaining.Sub(qty)
			if o.Remaining.LessThanOrEqual(decimal.Zero) {
				e.removeFromBook(symU, p.MakerOrderID)
			}
		}
		if o := e.book(symU).ByID[p.TakerOrderID]; o != nil {
			o.Remaining = o.Remaining.Sub(qty)
			if o.Remaining.LessThanOrEqual(decimal.Zero) {
				e.removeFromBook(symU, p.TakerOrderID)
			}
		}
	default:
		// ignore unknown
	}
	return nil
}

func (e *Engine) addResting(o *RestingOrder) {
	b := e.book(strings.ToUpper(o.Symbol))
	b.ByID[o.ID] = o
	if o.Side == "BUY" {
		b.Bids = insertLevel(b.Bids, o, true)
	} else {
		b.Asks = insertLevel(b.Asks, o, false)
	}
}

func insertLevel(levels []*PriceLevel, o *RestingOrder, bid bool) []*PriceLevel {
	for i, lv := range levels {
		if o.Price.Equal(lv.Price) {
			lv.Orders = append(lv.Orders, o)
			return levels
		}
		if bid && o.Price.GreaterThan(lv.Price) {
			pl := &PriceLevel{Price: o.Price, Orders: []*RestingOrder{o}}
			return append(levels[:i], append([]*PriceLevel{pl}, levels[i:]...)...)
		}
		if !bid && o.Price.LessThan(lv.Price) {
			pl := &PriceLevel{Price: o.Price, Orders: []*RestingOrder{o}}
			return append(levels[:i], append([]*PriceLevel{pl}, levels[i:]...)...)
		}
	}
	pl := &PriceLevel{Price: o.Price, Orders: []*RestingOrder{o}}
	return append(levels, pl)
}

func (e *Engine) removeFromBook(symbol, id string) {
	sym := strings.ToUpper(symbol)
	b := e.book(sym)
	if _, ok := b.ByID[id]; !ok {
		return
	}
	delete(b.ByID, id)
	b.Bids = removeFromLevels(b.Bids, id)
	b.Asks = removeFromLevels(b.Asks, id)
}

func removeFromLevels(levels []*PriceLevel, id string) []*PriceLevel {
	out := levels[:0]
	for _, lv := range levels {
		orders := lv.Orders[:0]
		for _, o := range lv.Orders {
			if o.ID != id {
				orders = append(orders, o)
			}
		}
		if len(orders) > 0 {
			lv.Orders = orders
			out = append(out, lv)
		}
	}
	return out
}

func (e *Engine) Run(ctx context.Context) {
	t := time.NewTicker(75 * time.Millisecond)
	defer t.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-t.C:
			if err := e.poll(ctx); err != nil {
				log.Println("poll:", err)
			}
		}
	}
}

func (e *Engine) poll(ctx context.Context) error {
	if err := e.ingestNewOrders(ctx); err != nil {
		return err
	}
	if err := e.removeCanceled(ctx); err != nil {
		return err
	}
	return nil
}

func (e *Engine) ingestNewOrders(ctx context.Context) error {
	rows, err := e.pool.Query(ctx, `
SELECT id, "userId", symbol, side, price::text, amount::text, "filledAmount"::text, "quoteReserved"::text, "baseReserved"::text
FROM "Order"
WHERE "ingestedAt" IS NULL AND status = 'OPEN'
ORDER BY "createdAt" ASC
LIMIT 100`)
	if err != nil {
		return err
	}
	defer rows.Close()

	type row struct {
		id, userID, symbol, side, price, amount, filled, qRes, bRes string
	}
	var batch []row
	for rows.Next() {
		var r row
		if err := rows.Scan(&r.id, &r.userID, &r.symbol, &r.side, &r.price, &r.amount, &r.filled, &r.qRes, &r.bRes); err != nil {
			return err
		}
		batch = append(batch, r)
	}

	for _, r := range batch {
		if err := e.ingestOne(ctx, r.id, r.userID, r.symbol, r.side, r.price, r.amount, r.filled); err != nil {
			log.Println("ingest", r.id, err)
		}
	}
	return nil
}

func (e *Engine) ingestOne(ctx context.Context, id, userID, symbol, side, priceS, amountS, filledS string) error {
	tx, err := e.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	var ingested *time.Time
	err = tx.QueryRow(ctx, `
UPDATE "Order" SET "ingestedAt" = NOW()
WHERE id = $1 AND "ingestedAt" IS NULL AND status = 'OPEN'
RETURNING "ingestedAt"`, id).Scan(&ingested)
	if err == pgx.ErrNoRows {
		return nil
	}
	if err != nil {
		return err
	}
	if ingested == nil {
		return nil
	}

	amount, _ := decimal.NewFromString(amountS)
	filled, _ := decimal.NewFromString(filledS)
	rem := amount.Sub(filled)
	payload, _ := json.Marshal(OrderAddPayload{
		OrderID: id, UserID: userID, Symbol: strings.ToUpper(symbol), Side: side,
		Price: priceS, Remaining: rem.StringFixedBank(18),
	})
	if _, err := tx.Exec(ctx, `INSERT INTO "MatchLog" (event, payload) VALUES ('ORDER_ADD', $1::jsonb)`, string(payload)); err != nil {
		return err
	}
	if err := tx.Commit(ctx); err != nil {
		return err
	}

	price, _ := decimal.NewFromString(priceS)
	e.addResting(&RestingOrder{
		ID: id, UserID: userID, Symbol: strings.ToUpper(symbol), Side: side,
		Price: price, Remaining: rem, CreatedAt: time.Now().UTC(),
	})
	e.matchAsTaker(ctx, id)
	e.publishBook(ctx, strings.ToUpper(symbol))
	return nil
}

func (e *Engine) removeCanceled(ctx context.Context) error {
	rows, err := e.pool.Query(ctx, `
SELECT id, symbol FROM "Order" WHERE status = 'CANCELED' AND "ingestedAt" IS NOT NULL`)
	if err != nil {
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var id, sym string
		if err := rows.Scan(&id, &sym); err != nil {
			return err
		}
		sym = strings.ToUpper(sym)
		if _, ok := e.book(sym).ByID[id]; !ok {
			continue
		}
		if err := e.logRemove(ctx, sym, id); err != nil {
			return err
		}
		e.removeFromBook(sym, id)
		e.publishBook(ctx, sym)
	}
	return nil
}

func (e *Engine) logRemove(ctx context.Context, symbol, id string) error {
	payload, _ := json.Marshal(OrderRemovePayload{OrderID: id, Symbol: symbol})
	_, err := e.pool.Exec(ctx, `INSERT INTO "MatchLog" (event, payload) VALUES ('ORDER_REMOVE', $1::jsonb)`, string(payload))
	return err
}

func (e *Engine) matchAsTaker(ctx context.Context, takerID string) {
	taker := e.findOrder(takerID)
	if taker == nil {
		return
	}
	sym := taker.Symbol
	b := e.book(sym)

	for taker.Remaining.GreaterThan(decimal.Zero) {
		var maker *RestingOrder
		var tradePrice decimal.Decimal
		if taker.Side == "BUY" {
			if len(b.Asks) == 0 || taker.Price.LessThan(b.Asks[0].Price) {
				break
			}
			lv := b.Asks[0]
			maker = lv.Orders[0]
			tradePrice = maker.Price
		} else {
			if len(b.Bids) == 0 || taker.Price.GreaterThan(b.Bids[0].Price) {
				break
			}
			lv := b.Bids[0]
			maker = lv.Orders[0]
			tradePrice = maker.Price
		}

		qty := decimal.Min(taker.Remaining, maker.Remaining)
		if err := e.executeTrade(ctx, sym, maker, taker, tradePrice, qty); err != nil {
			log.Println("trade", err)
			return
		}
	}
	e.publishBook(ctx, sym)
}

func (e *Engine) findOrder(id string) *RestingOrder {
	for _, b := range e.books {
		if o, ok := b.ByID[id]; ok {
			return o
		}
	}
	return nil
}

func (e *Engine) executeTrade(ctx context.Context, sym string, maker, taker *RestingOrder, price, qty decimal.Decimal) error {
	tx, err := e.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	fillID := uuid.NewString()
	_, err = tx.Exec(ctx, `
INSERT INTO "Fill" (id, symbol, "makerOrderId", "takerOrderId", price, quantity)
VALUES ($1, $2, $3, $4, $5, $6)`,
		fillID, sym, maker.ID, taker.ID, price.StringFixedBank(18), qty.StringFixedBank(18))
	if err != nil {
		return err
	}

	if err := e.applyOrderFill(ctx, tx, maker.ID, price, qty, maker.Side); err != nil {
		return err
	}
	if err := e.applyOrderFill(ctx, tx, taker.ID, price, qty, taker.Side); err != nil {
		return err
	}

	tp, _ := json.Marshal(TradePayload{
		Symbol: sym, MakerOrderID: maker.ID, TakerOrderID: taker.ID,
		MakerSide: maker.Side, Price: price.StringFixedBank(18), Quantity: qty.StringFixedBank(18),
	})
	if _, err := tx.Exec(ctx, `INSERT INTO "MatchLog" (event, payload) VALUES ('TRADE', $1::jsonb)`, string(tp)); err != nil {
		return err
	}

	if err := tx.Commit(ctx); err != nil {
		return err
	}

	maker.Remaining = maker.Remaining.Sub(qty)
	taker.Remaining = taker.Remaining.Sub(qty)
	if maker.Remaining.LessThanOrEqual(decimal.Zero) {
		e.removeFromBook(sym, maker.ID)
	} else {
		e.refreshLevelOrder(maker)
	}
	if taker.Remaining.LessThanOrEqual(decimal.Zero) {
		e.removeFromBook(sym, taker.ID)
	} else {
		e.refreshLevelOrder(taker)
	}

	_ = e.rdb.Publish(ctx, "user:"+maker.UserID, fmt.Sprintf(`{"type":"fill","fillId":"%s","symbol":"%s","side":"%s","price":"%s","qty":"%s"}`, fillID, sym, maker.Side, price.String(), qty.String())).Err()
	_ = e.rdb.Publish(ctx, "user:"+taker.UserID, fmt.Sprintf(`{"type":"fill","fillId":"%s","symbol":"%s","side":"%s","price":"%s","qty":"%s"}`, fillID, sym, taker.Side, price.String(), qty.String())).Err()

	return nil
}

func (e *Engine) refreshLevelOrder(o *RestingOrder) {
	// FIFO levels keep pointer to same struct; remaining already updated in memory.
}

func (e *Engine) applyOrderFill(ctx context.Context, tx pgx.Tx, orderID string, price, qty decimal.Decimal, side string) error {
	var amountStr, filledStr, qResStr, bResStr string
	err := tx.QueryRow(ctx, `
SELECT amount::text, "filledAmount"::text, "quoteReserved"::text, "baseReserved"::text
FROM "Order" WHERE id = $1 FOR UPDATE`, orderID).Scan(&amountStr, &filledStr, &qResStr, &bResStr)
	if err != nil {
		return err
	}
	amount, _ := decimal.NewFromString(amountStr)
	filled, _ := decimal.NewFromString(filledStr)
	qRes, _ := decimal.NewFromString(qResStr)
	bRes, _ := decimal.NewFromString(bResStr)

	newFilled := filled.Add(qty)
	notional := price.Mul(qty)
	if side == "BUY" {
		qRes = qRes.Sub(notional)
	} else {
		bRes = bRes.Sub(qty)
	}
	status := "PARTIALLY_FILLED"
	if newFilled.GreaterThanOrEqual(amount) {
		status = "FILLED"
		newFilled = amount
		qRes = decimal.Zero
		bRes = decimal.Zero
	}
	_, err = tx.Exec(ctx, `
UPDATE "Order" SET
 "filledAmount" = $2::decimal,
 "quoteReserved" = $3::decimal,
 "baseReserved" = $4::decimal,
 status = $5,
 "updatedAt" = NOW()
WHERE id = $1`,
		orderID, newFilled.StringFixedBank(18), qRes.StringFixedBank(18), bRes.StringFixedBank(18), status)
	return err
}

func (e *Engine) publishBook(ctx context.Context, sym string) {
	b := e.book(sym)
	type lvl struct {
		P string `json:"p"`
		Q string `json:"q"`
	}
	var bids []lvl
	for _, pl := range b.Bids {
		sum := decimal.Zero
		for _, o := range pl.Orders {
			sum = sum.Add(o.Remaining)
		}
		bids = append(bids, lvl{P: pl.Price.String(), Q: sum.StringFixedBank(8)})
	}
	var asks []lvl
	for _, pl := range b.Asks {
		sum := decimal.Zero
		for _, o := range pl.Orders {
			sum = sum.Add(o.Remaining)
		}
		asks = append(asks, lvl{P: pl.Price.String(), Q: sum.StringFixedBank(8)})
	}
	sort.Slice(bids, func(i, j int) bool {
		pi, _ := decimal.NewFromString(bids[i].P)
		pj, _ := decimal.NewFromString(bids[j].P)
		return pi.GreaterThan(pj)
	})
	sort.Slice(asks, func(i, j int) bool {
		pi, _ := decimal.NewFromString(asks[i].P)
		pj, _ := decimal.NewFromString(asks[j].P)
		return pi.LessThan(pj)
	})
	msg, _ := json.Marshal(map[string]any{"symbol": sym, "bids": bids, "asks": asks, "ts": time.Now().UTC().UnixMilli()})
	_ = e.rdb.Set(ctx, "book:"+sym, msg, 0).Err()
	_ = e.rdb.Publish(ctx, "book:"+sym, string(msg)).Err()
}
