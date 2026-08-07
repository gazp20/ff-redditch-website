
const cfg = window.FF_CONFIG || {};
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

function setJoinLinks(){
  const url = cfg.googleFormUrl || "";
  $$(".join-btn").forEach(a=>{
    if(url && !url.includes("PASTE_GOOGLE_FORM_LINK_HERE")){
      a.href = url; a.target="_blank"; a.rel="noopener";
    } else {
      a.href="#";
      a.addEventListener("click",e=>{
        e.preventDefault();
        alert("Add your Google Form link in assets/config.js");
      });
    }
  });
}

async function loadJSON(path){
  const r = await fetch(path);
  if(!r.ok) throw new Error("Could not load " + path);
  return r.json();
}

function parseCSV(text){
  const rows=[]; let row=[], field="", q=false;
  for(let i=0;i<text.length;i++){
    const c=text[i], n=text[i+1];
    if(c=='"' && q && n=='"'){field+='"';i++}
    else if(c=='"'){q=!q}
    else if(c==',' && !q){row.push(field);field=""}
    else if((c=='\n'||c=='\r') && !q){
      if(c=='\r' && n=='\n') i++;
      row.push(field); if(row.some(x=>x.trim()!=="")) rows.push(row); row=[]; field="";
    } else field+=c;
  }
  if(field.length||row.length){row.push(field);rows.push(row)}
  if(!rows.length) return [];
  const h=rows.shift().map(x=>x.trim());
  return rows.map(r=>Object.fromEntries(h.map((k,i)=>[k,(r[i]||"").trim()])));
}

async function loadData(csvUrl, fallback){
  if(csvUrl){
    try{
      const r=await fetch(csvUrl);
      if(r.ok) return parseCSV(await r.text());
    }catch(e){ console.warn(e); }
  }
  return loadJSON(fallback);
}

function num(v){ const n=parseFloat(v); return Number.isFinite(n)?n:0; }

async function homeInit(){
  const community = await loadJSON("data/community.json");
  $("#activeMembers").textContent=community.activeMembers;
  $("#communityKgLost").textContent=community.communityKgLost+"kg";
  $("#tnfSessions").textContent=community.tnfSessions;
  $("#playersInto11s").textContent=community.playersInto11s;
  $("#tnfVenue").textContent=community.venue;
  $("#tnfTime").textContent=community.time;

  const progress = await loadData(cfg.sheets?.progressCsv,"data/progress.json");
  renderLeaderboard(progress, "total");
  renderSpotlight(progress);

  const eleven = await loadData(cfg.sheets?.elevenStatsCsv,"data/eleven.json");
  renderEleven(eleven);

  const fixtures = await loadData(cfg.sheets?.fixturesCsv,"data/fixtures.json");
  renderFixture(fixtures);
}

function renderLeaderboard(data, mode){
  const rows=$("#leaderRows"); if(!rows) return;
  const field = mode==="percent" ? "percentLost" : mode==="month" ? "monthlyLostKg" : "totalLostKg";
  const suffix = mode==="percent" ? "%" : " kg";
  const sorted=[...data].sort((a,b)=>num(b[field])-num(a[field]));
  rows.innerHTML=sorted.slice(0,10).map((p,i)=>`
    <div class="leader-row">
      <span class="rank">${i+1}</span>
      <span><strong>${p.name||"Player"}</strong></span>
      <span class="value">${num(p[field]).toFixed(mode==="percent"?1:1)}${suffix}</span>
      <span class="sessions">${num(p.sessions)} sessions</span>
    </div>`).join("");
}
function renderSpotlight(data){
  const p=data.find(x=>String(x.spotlight).toLowerCase()==="true") || [...data].sort((a,b)=>num(b.totalLostKg)-num(a.totalLostKg))[0];
  if(!p) return;
  $("#spotlightName").textContent=p.name;
  $("#spotlightLoss").textContent=num(p.totalLostKg).toFixed(1)+"kg LOST";
  $("#spotlightText").textContent=`${p.name} is one of the players making strong progress through FF Redditch, combining regular football with personal fitness goals.`;
}
function renderEleven(data){
  const scorers=[...data].sort((a,b)=>num(b.goals)-num(a.goals)).slice(0,5);
  const assists=[...data].sort((a,b)=>num(b.assists)-num(a.assists)).slice(0,5);
  const make=(arr,field)=>arr.map((p,i)=>`<li><span class="pos">${i+1}</span><span>${p.name}</span><span class="num">${num(p[field])}</span></li>`).join("");
  if($("#scorers")) $("#scorers").innerHTML=make(scorers,"goals");
  if($("#assists")) $("#assists").innerHTML=make(assists,"assists");
}
function renderFixture(fixtures){
  const f=fixtures.find(x=>(x.status||"").toLowerCase()==="upcoming") || fixtures[0];
  if(!f) return;
  if($("#fixtureOpponent")) $("#fixtureOpponent").textContent=f.opponent||"Opponent TBC";
  if($("#fixtureMeta")) $("#fixtureMeta").textContent=[f.date,f.competition,f.homeAway].filter(Boolean).join(" • ");
}

document.addEventListener("DOMContentLoaded",()=>{
  setJoinLinks();
  const menu=$(".menu"), nav=$(".nav");
  if(menu&&nav) menu.addEventListener("click",()=>nav.classList.toggle("open"));
  $$(".tab").forEach(t=>t.addEventListener("click",async()=>{
    $$(".tab").forEach(x=>x.classList.remove("active")); t.classList.add("active");
    const progress=await loadData(cfg.sheets?.progressCsv,"data/progress.json");
    renderLeaderboard(progress,t.dataset.mode);
  }));
  if(document.body.dataset.page==="home") homeInit();
  if(document.body.dataset.page==="eleven") elevenPageInit();
});


async function elevenPageInit(){
  const fixtures = await loadData(cfg.sheets?.fixturesCsv,"data/fixtures.json");
  const stats = await loadData(cfg.sheets?.elevenStatsCsv,"data/eleven.json");
  const clubs = await loadJSON("data/clubs.json");

  const upcoming = fixtures
    .filter(f => (f.status||"").toLowerCase()==="upcoming")
    .sort((a,b)=>String(a.date||"").localeCompare(String(b.date||"")))[0];

  const played = fixtures
    .filter(f => (f.status||"").toLowerCase()==="played")
    .sort((a,b)=>String(b.date||"").localeCompare(String(a.date||"")))[0];

  const set=(id,val)=>{
    const el=document.getElementById(id);
    if(el) el.textContent=val||"TBC";
  };

  const clubInfo=(name)=>{
    const key=String(name||"").trim().toLowerCase();
    return clubs[key] || {name:name||"Opponent", badge:""};
  };

  const setBadge=(id,name,explicitBadge)=>{
    const img=document.getElementById(id);
    if(!img) return;
    const info=clubInfo(name);
    const src=explicitBadge || info.badge;
    if(src){
      img.src=src;
      img.alt=(info.name||name||"Opponent")+" badge";
      img.style.display="";
    }else{
      img.style.display="none";
    }
  };

  if(upcoming){
    set("nextOpponent", upcoming.opponent);
    set("nextHomeAway", upcoming.homeAway);
    set("nextKO", upcoming.ko);
    set("nextCompetition", upcoming.competition);
    set("nextVenue", upcoming.venue);
    set("nextAddress", upcoming.address);
    setBadge("nextOpponentBadge", upcoming.opponent, upcoming.opponentBadge);
  }

  if(played){
    set("lastOpponent", played.opponent);
    set("lastScore", played.result);
    set("lastScorers", played.scorers);
    set("lastMotm", played.motm);
    setBadge("lastOpponentBadge", played.opponent, played.opponentBadge);
  }

  renderEleven(stats);
}
