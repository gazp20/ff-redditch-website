const cfg = window.FF_CONFIG || {};
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const ELEVEN_STATS_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQvfZXcwd1w1xJJa_Eb2tSVNfRe7epjHAZvHawclyoxaS-oHdr-_fjX0XCo-5M3bCwpmpeitGPEQuy_/pub?gid=1274429032&single=true&output=csv";
const FIXTURES_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQvfZXcwd1w1xJJa_Eb2tSVNfRe7epjHAZvHawclyoxaS-oHdr-_fjX0XCo-5M3bCwpmpeitGPEQuy_/pub?gid=1101386937&single=true&output=csv";

function setJoinLinks(){
  const url = cfg.googleFormUrl || "";
  $$(".join-btn").forEach(a=>{
    if(url && !url.includes("PASTE_GOOGLE_FORM_LINK_HERE")){
      a.href=url; a.target="_blank"; a.rel="noopener";
    }
  });
}

async function loadJSON(path){
  const r=await fetch(path);
  if(!r.ok) throw new Error("Could not load "+path);
  return r.json();
}

function parseCSV(text){
  const rows=[]; let row=[], field="", q=false;
  for(let i=0;i<text.length;i++){
    const c=text[i], n=text[i+1];
    if(c=='"'&&q&&n=='"'){field+='"';i++}
    else if(c=='"'){q=!q}
    else if(c==','&&!q){row.push(field);field=""}
    else if((c=='\n'||c=='\r')&&!q){
      if(c=='\r'&&n=='\n') i++;
      row.push(field);
      if(row.some(x=>x.trim()!=="")) rows.push(row);
      row=[]; field="";
    } else field+=c;
  }
  if(field.length||row.length){row.push(field);rows.push(row)}
  if(!rows.length) return [];
  const h=rows.shift().map(x=>x.trim());
  return rows.map(r=>Object.fromEntries(h.map((k,i)=>[k,(r[i]||"").trim()])));
}

async function loadCSV(url){
  const r=await fetch(url + (url.includes("?") ? "&" : "?") + "_=" + Date.now(), {cache:"no-store"});
  if(!r.ok) throw new Error("Could not load CSV");
  return parseCSV(await r.text());
}

function num(v){const n=parseFloat(v);return Number.isFinite(n)?n:0}
function pick(obj,...keys){for(const key of keys){if(obj && Object.prototype.hasOwnProperty.call(obj,key) && String(obj[key]).trim()!=="") return String(obj[key]).trim();}return "";}
function parseSheetDate(value){if(!value) return null; const s=String(value).trim(); const m=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); if(m) return new Date(Number(m[3]),Number(m[1])-1,Number(m[2]),12); const d=new Date(s); return Number.isNaN(d.getTime())?null:d;}
function formatDate(value){const d=parseSheetDate(value); if(!d) return value||"TBC"; return new Intl.DateTimeFormat("en-GB",{day:"2-digit",month:"2-digit",year:"numeric"}).format(d);}
function shortHA(v){const s=String(v||"").toLowerCase(); if(s.startsWith("h")) return "H"; if(s.startsWith("a")) return "A"; return String(v||"").toUpperCase();}
function normaliseResult(v){const s=String(v||"").trim(); if(!s) return "–"; return s.replace(/^[WLD]\s*/i,"").replace(/(\d)\s*-\s*(\d)/g,"$1–$2");}
const BADGE_ALIASES = {
  "wrexham":"wrexham",
  "sutton":"sutton-united",
  "sutton united":"sutton-united",
  "sandwell":"sandwell-social",
  "sandwell social":"sandwell-social",
  "bromsgrove":"bromsgrove-forge",
  "bromsgrove forge":"bromsgrove-forge",
  "kidderminster":"kidderminster-mvf",
  "kidderminster mvf":"kidderminster-mvf",
  "stoke":"stoke-17s",
  "stoke 17s":"stoke-17s",
  "oldbury lions":"oldbury-lions",
  "solihull":"solihull"
};

function opponentSlug(name){
  const key=String(name||"").trim().toLowerCase();
  if(BADGE_ALIASES[key]) return BADGE_ALIASES[key];
  return key.replace(/&/g,"and").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
}
function setBadge(img,opponent){
  if(!img) return;
  const slug=opponentSlug(opponent);
  img.alt=opponent?opponent+" badge":"Opponent badge";
  img.onerror=function(){this.onerror=null;this.src="assets/badges/ffredditch.png";};
  img.src=slug?("assets/badges/"+slug+".png"):"assets/badges/ffredditch.png";
}

function renderEleven(data){
  const normalised=data.map(p=>({
    name:pick(p,"Player","player","Name","name"),
    goals:pick(p,"Goals","goals"),
    assists:pick(p,"Assists","assists"),
    yellow:pick(p,"yellow","Yellow"),
    red:pick(p,"red","Red")
  })).filter(p=>p.name);
  const goalPlayers=[...normalised].filter(p=>num(p.goals)>0).sort((a,b)=>num(b.goals)-num(a.goals)).slice(0,5);
  const assistPlayers=[...normalised].filter(p=>num(p.assists)>0).sort((a,b)=>num(b.assists)-num(a.assists)).slice(0,5);
  const cards=[...normalised].filter(p=>num(p.yellow)>0||num(p.red)>0).sort((a,b)=>(num(b.red)*3+num(b.yellow))-(num(a.red)*3+num(a.yellow)));
  const make=(arr,field,emptyText)=>!arr.length?`<li class="empty-stat">${emptyText}</li>`:arr.map((p,i)=>`<li><span class="pos">${i+1}</span><span>${p.name}</span><span class="num">${num(p[field])}</span></li>`).join("");
  if($("#scorers")) $("#scorers").innerHTML=make(goalPlayers,"goals","No goals recorded yet.");
  if($("#assists")) $("#assists").innerHTML=make(assistPlayers,"assists","No assists recorded yet.");
  if($("#discipline")){
    $("#discipline").innerHTML=!cards.length?`<div class="discipline-empty">No cards recorded yet.</div>`:`<div class="discipline-row discipline-head"><span>Player</span><span>🟨</span><span>🟥</span></div>`+cards.map(p=>`<div class="discipline-row"><span>${p.name}</span><strong>${num(p.yellow)}</strong><strong>${num(p.red)}</strong></div>`).join("");
  }
}


function resultClass(result){
  const s=String(result||"").trim().toUpperCase();
  if(s.startsWith("W")) return "result-win";
  if(s.startsWith("D")) return "result-draw";
  if(s.startsWith("L")) return "result-loss";
  return "";
}

function renderPastFixtures(fixtures){
  const body=$("#pastFixturesBody");
  if(!body) return;

  const played=[...fixtures]
    .filter(r=>r.status.toLowerCase()==="played" || !!r.result)
    .sort((a,b)=>(parseSheetDate(b.date)?.getTime()||0)-(parseSheetDate(a.date)?.getTime()||0));

  if(!played.length){
    body.innerHTML='<tr><td colspan="8">No past fixtures recorded yet.</td></tr>';
    return;
  }

  body.innerHTML=played.map(r=>`
    <tr>
      <td>${formatDate(r.date)}</td>
      <td>${r.opponent||"TBC"}</td>
      <td>${r.homeAway||"–"}</td>
      <td>${r.competition||"TBC"}</td>
      <td>${r.ko||"TBC"}</td>
      <td class="${resultClass(r.result)}">${r.result||"–"}</td>
      <td>${r.scorers||"None recorded"}</td>
      <td>${r.motm||"TBC"}</td>
    </tr>
  `).join("");
}

function renderFixtures(rows){
  const fixtures=rows.map(r=>({
    date:pick(r,"Date","date"), opponent:pick(r,"Opponent","opponent"), homeAway:pick(r,"H/A","h/a","HA"),
    competition:pick(r,"Competition","competition"), ko:pick(r,"KO","ko"), result:pick(r,"Result","result"),
    scorers:pick(r,"Scorers","scorers"), motm:pick(r,"MOTM","motm"), status:pick(r,"Status","status"), venue:pick(r,"Venue","venue")
  })).filter(r=>r.opponent||r.date);

  const played=fixtures.filter(r=>r.status.toLowerCase()==="played" || !!r.result).sort((a,b)=>(parseSheetDate(b.date)?.getTime()||0)-(parseSheetDate(a.date)?.getTime()||0));
  const upcoming=fixtures.filter(r=>r.status.toLowerCase()==="upcoming").sort((a,b)=>(parseSheetDate(a.date)?.getTime()||Number.MAX_SAFE_INTEGER)-(parseSheetDate(b.date)?.getTime()||Number.MAX_SAFE_INTEGER));
  const last=played[0], next=upcoming[0];

  renderPastFixtures(fixtures);

  if(next){
    $("#nextOpponent").textContent=next.opponent;
    $("#nextOpponentDetail").textContent=next.opponent;
    $("#nextDate").textContent=formatDate(next.date);
    $("#nextKO").textContent=next.ko||"TBC";
    $("#nextCompetition").textContent=next.competition||"TBC";
    $("#nextHomeAway").textContent=shortHA(next.homeAway)||"–";
    $("#nextVenue").textContent=next.venue||"TBC";
    setBadge($("#nextOpponentBadge"),next.opponent);
  }

  if(last){
    $("#lastOpponent").textContent=last.opponent;
    $("#lastScore").textContent=normaliseResult(last.result);
    $("#lastScorers").textContent=last.scorers||"None recorded";
    $("#lastMotm").textContent=last.motm||"TBC";
    $("#lastCompetition").textContent=last.competition||"TBC";
    $("#lastVenue").textContent=last.venue||"TBC";
    setBadge($("#lastOpponentBadge"),last.opponent);
  }
}

async function elevenPageInit(){
  const results=await Promise.allSettled([loadCSV(ELEVEN_STATS_CSV),loadCSV(FIXTURES_CSV)]);
  if(results[0].status==="fulfilled") renderEleven(results[0].value);
  else {console.warn("Could not load 11s stats",results[0].reason); try{renderEleven(await loadJSON("data/eleven-stats.json?v=20260817"));}catch(e){console.warn(e)}}
  if(results[1].status==="fulfilled") renderFixtures(results[1].value);
  else console.warn("Could not load fixtures",results[1].reason);
}

document.addEventListener("DOMContentLoaded",()=>{
  setJoinLinks();
  const menu=$(".menu"),nav=$(".nav");
  if(menu&&nav) menu.addEventListener("click",()=>nav.classList.toggle("open"));
  if(document.body.dataset.page==="eleven") elevenPageInit();
});
