/** Single-page admin UI served at GET /admin (no secret on HTML; all data via /admin/api/* + x-admin-secret). */
export const ADMIN_DASHBOARD_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Etebaar Admin</title>
<style>
:root { --bg:#0f1a33; --panel:#1a3054; --text:#e8edf4; --muted:#9db0d0; --gold:#ffc323; --border:rgba(255,255,255,.12); }
*{box-sizing:border-box}
body{margin:0;font-family:system-ui,-apple-system,sans-serif;background:var(--bg);color:var(--text)}
header{padding:1rem 1.25rem;border-bottom:1px solid var(--border);display:flex;flex-wrap:wrap;gap:.75rem;align-items:center;justify-content:space-between}
h1{margin:0;font-size:1.1rem}
.tabs{display:flex;flex-wrap:wrap;gap:.35rem;padding:.75rem 1rem;border-bottom:1px solid var(--border)}
.tabs button{background:var(--panel);color:var(--muted);border:1px solid var(--border);padding:.45rem .85rem;border-radius:8px;cursor:pointer}
.tabs button.on{color:#16274a;background:var(--gold);border-color:var(--gold);font-weight:600}
main{padding:1rem 1.25rem;max-width:1400px;margin:0 auto}
.panel{background:var(--panel);border:1px solid var(--border);border-radius:12px;padding:1rem;margin-bottom:1rem}
input,select,textarea{background:#152447;color:var(--text);border:1px solid var(--border);padding:.4rem .6rem;border-radius:6px}
table{width:100%;border-collapse:collapse;font-size:12px}
th,td{text-align:left;padding:.35rem .5rem;border-bottom:1px solid var(--border);vertical-align:top;word-break:break-word}
.err{color:#ff6b7a}
pre{white-space:pre-wrap;font-size:11px;margin:0}
button.primary{background:var(--gold);color:#16274a;border:none;padding:.5rem 1rem;border-radius:8px;font-weight:600;cursor:pointer}
</style>
</head>
<body>
<header>
  <h1>Etebaar admin</h1>
  <div style="display:flex;flex-wrap:wrap;gap:.5rem;align-items:center">
    <label>Secret <input type="password" id="sec" placeholder="ADMIN_API_SECRET" style="width:min(260px,50vw)"/></label>
    <button type="button" class="primary" id="saveSec">Save in browser</button>
    <span id="hint" style="font-size:12px;color:var(--muted)"></span>
  </div>
</header>
<div class="tabs" id="tabs"></div>
<main id="main"></main>
<script>
(function(){
  var tabs = ['stats','users','orders','deposits','withdrawals','fills','matchLogs','signupCodes','fx'];
  var labels = {stats:'Stats',users:'Users',orders:'Orders',deposits:'Deposits',withdrawals:'Withdrawals',fills:'Fills',matchLogs:'Match log',signupCodes:'Signup codes',fx:'FX overrides'};
  function $(id){ return document.getElementById(id); }
  function hdr(){
    var s = sessionStorage.getItem('adminSecret') || '';
    return {'x-admin-secret': s, 'Content-Type': 'application/json'};
  }
  function api(path, opt){
    opt = opt || {};
    return fetch('/admin/api' + path, Object.assign({}, opt, {headers: Object.assign({}, hdr(), opt.headers || {})}))
      .then(function(r){ return r.text().then(function(t){
        var j; try { j = JSON.parse(t); } catch(e){ j = { _raw: t }; }
        if(!r.ok) throw new Error((j && j.error) ? (typeof j.error === 'string' ? j.error : JSON.stringify(j.error)) : (t || r.statusText));
        return j;
      });});
  }
  function renderTabs(active){
    $('tabs').innerHTML = tabs.map(function(k){
      return '<button type="button" data-t="'+k+'" class="'+(k===active?'on':'')+'">'+labels[k]+'</button>';
    }).join('');
    $('tabs').onclick = function(e){
      var b = e.target.closest('button[data-t]');
      if(b) go(b.getAttribute('data-t'));
    };
  }
  function go(t){
    renderTabs(t);
    $('main').innerHTML = '<p>Loading…</p>';
    if(t==='stats'){
      api('/stats').then(function(d){ $('main').innerHTML = '<div class="panel"><pre>'+JSON.stringify(d,null,2)+'</pre></div>'; }).catch(fail);
      return;
    }
    if(t==='users'){
      $('main').innerHTML = '<div class="panel" style="margin-bottom:.75rem"><label>Search email <input id="uq" type="search"/></label> <button type="button" class="primary" id="ub">Load</button></div><div id="out"></div>';
      function load(){
        var q = ($('uq').value || '').trim();
        api('/users?take=100&q='+encodeURIComponent(q)).then(function(d){
          var rows = d.users.map(function(u){
            return '<tr><td>'+(u.email||'')+'</td><td>'+(u.fullName||'')+'</td><td>'+(u.phone||'')+'</td><td style="font-size:10px">'+u.id+'</td><td>'+u.createdAt+'</td></tr>';
          }).join('');
          $('out').innerHTML = '<div class="panel"><table><thead><tr><th>Email</th><th>Name</th><th>Phone</th><th>ID</th><th>Created</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
        }).catch(fail);
      }
      $('ub').onclick = load;
      load();
      return;
    }
    if(t==='orders'){
      api('/orders?take=80').then(function(d){
        var rows = d.orders.map(function(o){
          return '<tr><td>'+o.status+'</td><td>'+o.symbol+'</td><td>'+o.side+'</td><td>'+o.price+'</td><td>'+o.amount+'</td><td>'+(o.user&&o.user.email||'')+'</td><td style="font-size:10px">'+o.id+'</td><td>'+o.createdAt+'</td></tr>';
        }).join('');
        $('main').innerHTML = '<div class="panel"><table><thead><tr><th>Status</th><th>Symbol</th><th>Side</th><th>Price</th><th>Amount</th><th>User</th><th>ID</th><th>Created</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
      }).catch(fail);
      return;
    }
    if(t==='deposits'){
      api('/deposits?take=80').then(function(d){
        var rows = d.deposits.map(function(x){
          return '<tr><td>'+x.status+'</td><td>'+x.asset+'</td><td>'+x.amount+'</td><td>'+(x.user&&x.user.email||'')+'</td><td style="font-size:10px">'+x.id+'</td><td>'+x.createdAt+'</td></tr>';
        }).join('');
        $('main').innerHTML = '<div class="panel"><table><thead><tr><th>Status</th><th>Asset</th><th>Amount</th><th>User</th><th>ID</th><th>Created</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
      }).catch(fail);
      return;
    }
    if(t==='withdrawals'){
      api('/withdrawals?take=80').then(function(d){
        var rows = d.withdrawals.map(function(x){
          return '<tr><td>'+x.status+'</td><td>'+x.asset+'</td><td>'+x.amount+'</td><td>'+(x.user&&x.user.email||'')+'</td><td style="font-size:10px">'+x.id+'</td><td>'+x.createdAt+'</td></tr>';
        }).join('');
        $('main').innerHTML = '<div class="panel"><table><thead><tr><th>Status</th><th>Asset</th><th>Amount</th><th>User</th><th>ID</th><th>Created</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
      }).catch(fail);
      return;
    }
    if(t==='fills'){
      api('/fills?take=80').then(function(d){
        var rows = d.fills.map(function(x){
          return '<tr><td>'+x.symbol+'</td><td>'+x.price+'</td><td>'+x.quantity+'</td><td>'+String(x.ledgerApplied)+'</td><td style="font-size:10px">'+x.id+'</td><td>'+x.createdAt+'</td></tr>';
        }).join('');
        $('main').innerHTML = '<div class="panel"><table><thead><tr><th>Symbol</th><th>Price</th><th>Qty</th><th>Ledger</th><th>ID</th><th>Created</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
      }).catch(fail);
      return;
    }
    if(t==='matchLogs'){
      api('/match-logs?take=40').then(function(d){
        $('main').innerHTML = '<div class="panel"><pre>'+JSON.stringify(d.logs,null,2)+'</pre></div>';
      }).catch(fail);
      return;
    }
    if(t==='signupCodes'){
      api('/signup-codes?take=40').then(function(d){
        var rows = d.rows.map(function(x){
          return '<tr><td>'+x.email+'</td><td>'+x.expiresAt+'</td><td>'+x.createdAt+'</td></tr>';
        }).join('');
        $('main').innerHTML = '<div class="panel"><p style="font-size:12px;color:var(--muted)">Verification codes are hashed; only metadata is shown.</p><table><thead><tr><th>Email</th><th>Expires</th><th>Created</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
      }).catch(fail);
      return;
    }
    if(t==='fx'){
      $('main').innerHTML = '<div class="panel"><h3 style="margin-top:0">Manual convert prices</h3><p style="font-size:12px;color:var(--muted)">usdPerUnit = USD value of <strong>1</strong> unit (BTC, IRT, EUR…). Merged on top of live feeds for the Next.js calculator.</p><div style="display:flex;flex-wrap:wrap;gap:.5rem;align-items:flex-end;margin-bottom:1rem"><div><div style="font-size:11px;color:var(--muted)">Currency</div><input id="fxCode" placeholder="BTC"/></div><div><div style="font-size:11px;color:var(--muted)">USD / 1 unit</div><input id="fxUsd" placeholder="67000"/></div><div style="flex:1;min-width:160px"><div style="font-size:11px;color:var(--muted)">Note</div><input id="fxNote" placeholder="optional" style="width:100%"/></div><button type="button" class="primary" id="fxSave">Save / upsert</button></div><div id="fxList"></div></div>';
      function loadFx(){
        api('/fx-overrides').then(function(d){
          var rows = d.overrides.map(function(o){
            return '<tr><td><strong>'+o.currencyCode+'</strong></td><td>'+o.usdPerUnit+'</td><td>'+(o.note||'')+'</td><td>'+o.updatedAt+'</td><td><button type="button" data-del="'+o.currencyCode+'">Remove</button></td></tr>';
          }).join('');
          $('fxList').innerHTML = '<table><thead><tr><th>Code</th><th>usdPerUnit</th><th>Note</th><th>Updated</th><th></th></tr></thead><tbody>'+rows+'</tbody></table>';
          $('fxList').onclick = function(ev){
            var btn = ev.target.closest('button[data-del]');
            if(!btn) return;
            var code = btn.getAttribute('data-del');
            if(!confirm('Remove override for '+code+'?')) return;
            api('/fx-overrides/'+encodeURIComponent(code), {method:'DELETE'}).then(loadFx).catch(fail);
          };
        }).catch(fail);
      }
      $('fxSave').onclick = function(){
        var code = ($('fxCode').value||'').trim().toUpperCase();
        var usd = ($('fxUsd').value||'').trim();
        var note = ($('fxNote').value||'').trim();
        if(!code || !usd) { alert('Currency and USD value required'); return; }
        api('/fx-overrides/'+encodeURIComponent(code), {method:'PUT', body: JSON.stringify({ usdPerUnit: usd, note: note || undefined })}).then(function(){ loadFx(); }).catch(fail);
      };
      loadFx();
      return;
    }
  }
  function fail(e){ $('main').innerHTML = '<p class="err">'+(e && e.message || e)+'</p>'; }
  $('saveSec').onclick = function(){
    sessionStorage.setItem('adminSecret', $('sec').value || '');
    $('hint').textContent = 'Saved for this tab only (sessionStorage).';
  };
  $('sec').value = sessionStorage.getItem('adminSecret') || '';
  go('stats');
})();
<\/script>
</body>
</html>`;
