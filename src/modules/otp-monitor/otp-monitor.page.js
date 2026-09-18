export function renderMonitorPage({ storesPlaintext, ttlMinutes }) {
  return `<!doctype html>
<html lang="sw">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Uvero · OTP Monitor</title>
<style>
  :root {
    --bg:#0b0d14; --panel:#131722; --panel2:#1a2030; --line:#252c3f; --text:#e8ecf6; --muted:#8b95b0;
    --brand:#7c5cff; --brand2:#00c2d8; --ok:#22c55e; --warn:#f59e0b; --bad:#ef4444;
  }
  * { box-sizing:border-box; }
  body { margin:0; font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,sans-serif; background:radial-gradient(1200px 600px at 10% -10%, #1d1740 0%, transparent 60%), var(--bg); color:var(--text); min-height:100vh; }
  .wrap { max-width:1100px; margin:0 auto; padding:28px 20px 60px; }
  header { display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap; margin-bottom:24px; }
  .brand { display:flex; align-items:center; gap:12px; }
  .logo { width:42px; height:42px; border-radius:12px; background:linear-gradient(135deg,var(--brand),var(--brand2)); display:grid; place-items:center; font-weight:800; font-size:20px; }
  h1 { font-size:20px; margin:0; letter-spacing:.2px; }
  .sub { color:var(--muted); font-size:13px; margin-top:2px; }
  .live { display:flex; align-items:center; gap:8px; font-size:13px; color:var(--muted); background:var(--panel); border:1px solid var(--line); padding:8px 14px; border-radius:999px; }
  .dot { width:9px; height:9px; border-radius:50%; background:var(--ok); box-shadow:0 0 0 0 rgba(34,197,94,.6); animation:pulse 1.8s infinite; }
  .dot.off { background:var(--bad); animation:none; }
  @keyframes pulse { 70% { box-shadow:0 0 0 10px rgba(34,197,94,0);} 100% { box-shadow:0 0 0 0 rgba(34,197,94,0);} }
  .stats { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:22px; }
  .stat { background:var(--panel); border:1px solid var(--line); border-radius:16px; padding:16px 18px; }
  .stat b { display:block; font-size:28px; margin-top:4px; }
  .stat span { color:var(--muted); font-size:12px; text-transform:uppercase; letter-spacing:.8px; }
  .stat.active b { color:var(--ok); } .stat.used b { color:var(--brand2); } .stat.expired b { color:var(--muted); }
  .toolbar { display:flex; gap:12px; margin-bottom:14px; }
  .toolbar input { flex:1; background:var(--panel); border:1px solid var(--line); color:var(--text); padding:12px 16px; border-radius:12px; font-size:14px; outline:none; }
  .toolbar input:focus { border-color:var(--brand); }
  .toolbar button { background:var(--panel); border:1px solid var(--line); color:var(--text); padding:0 18px; border-radius:12px; cursor:pointer; font-size:14px; }
  .toolbar button:hover { border-color:var(--brand); }
  .list { display:flex; flex-direction:column; gap:10px; }
  .row { display:grid; grid-template-columns:1.3fr 1.2fr .9fr 1fr; gap:14px; align-items:center; background:var(--panel); border:1px solid var(--line); border-radius:16px; padding:14px 18px; transition:border-color .2s, transform .2s; }
  .row.new { animation:slide .5s ease; border-color:var(--brand); }
  @keyframes slide { from { opacity:0; transform:translateY(-10px);} to { opacity:1; transform:none; } }
  .phone { font-weight:600; font-size:15px; }
  .meta { color:var(--muted); font-size:12px; margin-top:3px; }
  .code { font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace; font-size:26px; font-weight:800; letter-spacing:6px; background:linear-gradient(135deg,var(--brand),var(--brand2)); -webkit-background-clip:text; background-clip:text; color:transparent; cursor:pointer; user-select:all; }
  .code.hidden { color:var(--muted); background:none; -webkit-background-clip:initial; font-size:14px; letter-spacing:1px; font-weight:500; }
  .badge { display:inline-block; padding:4px 12px; border-radius:999px; font-size:12px; font-weight:700; letter-spacing:.5px; }
  .badge.ACTIVE { background:rgba(34,197,94,.15); color:var(--ok); }
  .badge.USED { background:rgba(0,194,216,.15); color:var(--brand2); }
  .badge.EXPIRED { background:rgba(139,149,176,.15); color:var(--muted); }
  .right { text-align:right; }
  .timer { font-variant-numeric:tabular-nums; font-weight:600; }
  .empty { text-align:center; color:var(--muted); padding:60px 0; background:var(--panel); border:1px dashed var(--line); border-radius:16px; }
  .note { margin-top:18px; font-size:12px; color:var(--muted); text-align:center; }
  .toast { position:fixed; bottom:24px; left:50%; transform:translateX(-50%) translateY(20px); background:var(--panel2); border:1px solid var(--brand); padding:10px 18px; border-radius:12px; opacity:0; transition:.25s; pointer-events:none; font-size:14px; }
  .toast.show { opacity:1; transform:translateX(-50%); }
  @media (max-width:760px){ .stats{grid-template-columns:repeat(2,1fr);} .row{grid-template-columns:1fr 1fr;} .right{text-align:left;} }
</style>
</head>
<body>
<div class="wrap">
  <header>
    <div class="brand">
      <div class="logo">U</div>
      <div><h1>OTP Monitor</h1><div class="sub">Msimbo wote unaotumwa kwa watumiaji · huisha baada ya ${ttlMinutes} dakika</div></div>
    </div>
    <div class="live"><span class="dot" id="dot"></span><span id="liveText">Inaunganisha…</span></div>
  </header>

  <section class="stats">
    <div class="stat"><span>Zote zilizotumwa</span><b id="sTotal">0</b></div>
    <div class="stat active"><span>Zinazofanya kazi</span><b id="sActive">0</b></div>
    <div class="stat used"><span>Zilizotumika</span><b id="sUsed">0</b></div>
    <div class="stat expired"><span>Zilizoisha muda</span><b id="sExpired">0</b></div>
  </section>

  <div class="toolbar">
    <input id="search" placeholder="Tafuta kwa namba ya simu… (mf. +255712)" autocomplete="off">
    <button id="pause">⏸ Simamisha</button>
  </div>

  <div class="list" id="list"><div class="empty">Inapakia…</div></div>
  <div class="note">${storesPlaintext ? "Bofya msimbo kuunakili. Inasasishwa kila sekunde 2." : "⚠ Uhifadhi wa msimbo umezimwa (OTP_STORE_PLAINTEXT=false) — msimbo hauonekani."}</div>
</div>
<div class="toast" id="toast">Imenakiliwa ✓</div>

<script>
  const key = new URLSearchParams(location.search).get("key");
  const $ = (id) => document.getElementById(id);
  let paused = false, seen = new Set(), first = true, items = [], serverOffset = 0, timerT;

  function ago(d){ const s=Math.max(0,Math.floor((Date.now()+serverOffset-new Date(d))/1000));
    if(s<60) return s+"s iliyopita"; if(s<3600) return Math.floor(s/60)+"dk iliyopita";
    if(s<86400) return Math.floor(s/3600)+"h iliyopita"; return Math.floor(s/86400)+"siku zilizopita"; }
  function left(d){ const s=Math.floor((new Date(d)-(Date.now()+serverOffset))/1000);
    if(s<=0) return "imeisha"; return Math.floor(s/60)+":"+String(s%60).padStart(2,"0"); }
  function esc(t){ return String(t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])); }

  function render(){
    const list=$("list");
    if(!items.length){ list.innerHTML='<div class="empty">Hakuna OTP bado. Ombi la OTP likifanywa litaonekana hapa moja kwa moja.</div>'; return; }
    list.innerHTML = items.map(o=>{
      const isNew = !first && !seen.has(o.id);
      const code = o.code ? '<div class="code" data-c="'+esc(o.code)+'">'+esc(o.code)+'</div>' : '<div class="code hidden">— imefichwa —</div>';
      const third = o.status==="ACTIVE" ? '<span class="timer" data-exp="'+o.expiresAt+'">'+left(o.expiresAt)+'</span>' : o.status==="USED" ? "imetumika" : "imeisha";
      return '<div class="row'+(isNew?' new':'')+'">'+
        '<div><div class="phone">'+esc(o.phone)+'</div><div class="meta">'+ago(o.createdAt)+' · majaribio '+o.attempts+'</div></div>'+
        code+
        '<div><span class="badge '+o.status+'">'+o.status+'</span></div>'+
        '<div class="right">'+third+'</div></div>';
    }).join("");
    items.forEach(o=>seen.add(o.id)); first=false;
  }

  async function load(){
    if(paused) return;
    try{
      const q = new URLSearchParams({ search:$("search").value.trim() });
      if(key) q.set("key",key);
      const r = await fetch("/admin/otp-monitor/data?"+q, {cache:"no-store"});
      if(!r.ok) throw new Error(r.status);
      const j = await r.json();
      serverOffset = new Date(j.serverTime) - Date.now();
      items = j.data;
      $("sTotal").textContent=j.stats.total; $("sActive").textContent=j.stats.active;
      $("sUsed").textContent=j.stats.used; $("sExpired").textContent=j.stats.expired;
      $("dot").className="dot"; $("liveText").textContent="Moja kwa moja";
      render();
    }catch(e){ $("dot").className="dot off"; $("liveText").textContent="Imekatika ("+e.message+")"; }
  }

  document.addEventListener("click",e=>{
    const c=e.target.closest(".code[data-c]"); if(!c) return;
    navigator.clipboard?.writeText(c.dataset.c); const t=$("toast"); t.classList.add("show"); setTimeout(()=>t.classList.remove("show"),1200);
  });
  $("pause").onclick=()=>{ paused=!paused; $("pause").textContent=paused?"▶ Endelea":"⏸ Simamisha"; $("liveText").textContent=paused?"Imesimamishwa":"Moja kwa moja"; if(!paused) load(); };
  let st; $("search").oninput=()=>{ clearTimeout(st); st=setTimeout(()=>{first=true;seen=new Set();load();},300); };
  setInterval(load,2000);
  setInterval(()=>document.querySelectorAll(".timer").forEach(el=>{ el.textContent=left(el.dataset.exp); }),1000);
  load();
</script>
</body>
</html>`;
}
