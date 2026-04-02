import type { FastifyInstance } from "fastify";
import websocket from "@fastify/websocket";
import type { Redis } from "ioredis";

export async function registerWs(app: FastifyInstance, redisPub: Redis) {
  await app.register(websocket);

  app.get("/ws", { websocket: true }, (socket, req) => {
    const q = req.query as Record<string, string | undefined>;
    const symbol = (q.symbol ?? "BTCUSDT").toUpperCase();
    const userId = q.userId;
    const channels = [`book:${symbol}`];
    if (userId) channels.push(`user:${userId}`);

    const sub = redisPub.duplicate();

    const onMessage = (channel: string, message: string) => {
      if (!channels.includes(channel)) return;
      try {
        const data = JSON.parse(message) as unknown;
        socket.send(JSON.stringify({ channel, data }));
      } catch {
        socket.send(JSON.stringify({ channel, data: message }));
      }
    };

    sub.on("message", onMessage);

    void sub
      .subscribe(...channels)
      .then(() => {
        socket.send(
          JSON.stringify({
            channel: "system",
            data: { subscribed: channels },
          }),
        );
      })
      .catch(() => socket.close());

    socket.on("close", () => {
      sub.off("message", onMessage);
      void sub.unsubscribe(...channels).catch(() => undefined);
      sub.disconnect();
    });
  });
}
