
const cfg = window.FF_CONFIG || {};
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

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
      row.push(field); if(row.some(x=>x.trim()!=="")) rows.push(row); row=[]; field="";
    } else field+=c;
  }
  if(field.length||row.length){row.push(field);rows.push(row)}
  if(!rows.length) return [];
  const h=rows.shift().map(x=>x.trim());
  return rows.map(r=>Object.fromEntries(h.map((k,i)=>[k,(r[i]||"").trim()])));
}
async function loadData(csvUrl,fallback){
  if(csvUrl){
    try{const r=await fetch(csvUrl); if(r.ok) return parseCSV(await r.text());}catch(e){console.warn(e)}
  }
  return loadJSON(fallback);
}
function num(v){const n=parseFloat(v);return Number.isFinite(n)?n:0}

async function homeInit(){
  try{
    const c=await loadJSON("data/community.json");
    if($("#communityKgLost")) $("#communityKgLost").textContent=num(c.communityKgLost).toFixed(0)+"kg";
    if($("#weeklyKgLost")) $("#weeklyKgLost").textContent=num(c.weeklyKgLost).toFixed(1)+"kg";
    if($("#totalMembers")) $("#totalMembers").textContent=c.totalMembers;
    if($("#tnfSessions")) $("#tnfSessions").textContent=c.tnfSessions;
  }catch(e){console.warn(e)}
}

function renderEleven(data){
  const goalPlayers=[...data].filter(p=>num(p.goals)>0).sort((a,b)=>num(b.goals)-num(a.goals)).slice(0,5);
  const assistPlayers=[...data].filter(p=>num(p.assists)>0).sort((a,b)=>num(b.assists)-num(a.assists)).slice(0,5);
  const cards=[...data].filter(p=>num(p.yellow)>0||num(p.red)>0).sort((a,b)=>(num(b.red)*3+num(b.yellow))-(num(a.red)*3+num(a.yellow)));

  const make=(arr,field,emptyText)=>{
    if(!arr.length) return `<li class="empty-stat">${emptyText}</li>`;
    return arr.map((p,i)=>`<li><span class="pos">${i+1}</span><span>${p.name}</span><span class="num">${num(p[field])}</span></li>`).join("");
  };

  if($("#scorers")) $("#scorers").innerHTML=make(goalPlayers,"goals","No goals recorded yet.");
  if($("#assists")) $("#assists").innerHTML=make(assistPlayers,"assists","No assists recorded yet.");

  if($("#discipline")){
    if(!cards.length){
      $("#discipline").innerHTML=`<div class="discipline-empty">No cards recorded yet.</div>`;
    }else{
      $("#discipline").innerHTML=
        `<div class="discipline-row discipline-head"><span>Player</span><span>🟨</span><span>🟥</span></div>`+
        cards.map(p=>`<div class="discipline-row"><span>${p.name}</span><strong>${num(p.yellow)}</strong><strong>${num(p.red)}</strong></div>`).join("");
    }
  }
}

async function elevenPageInit(){
  try{
    const stats=await loadData(cfg.sheets?.elevenStatsCsv,"data/eleven.json");
    renderEleven(stats);
  }catch(e){console.warn(e)}
}

document.addEventListener("DOMContentLoaded",()=>{
  setJoinLinks();
  const menu=$(".menu"), nav=$(".nav");
  if(menu&&nav) menu.addEventListener("click",()=>nav.classList.toggle("open"));
  if(document.body.dataset.page==="home") homeInit();
  if(document.body.dataset.page==="eleven") elevenPageInit();
});
