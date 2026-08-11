
window.openRecipeModal = function(){
  const d = document.getElementById("recipeDialog");
  if(!d) return;
  try{
    if(typeof d.showModal === "function"){
      if(!d.open) d.showModal();
    }else{
      d.setAttribute("open","");
      d.style.display="block";
      d.style.position="fixed";
      d.style.inset="5vh auto auto 50%";
      d.style.transform="translateX(-50%)";
      d.style.zIndex="9999";
      d.style.maxHeight="90vh";
      d.style.overflow="auto";
    }
  }catch(e){
    d.setAttribute("open","");
    d.style.display="block";
    d.style.position="fixed";
    d.style.inset="5vh auto auto 50%";
    d.style.transform="translateX(-50%)";
    d.style.zIndex="9999";
    d.style.maxHeight="90vh";
    d.style.overflow="auto";
  }
};

window.closeRecipeModal = function(){
  const d = document.getElementById("recipeDialog");
  if(!d) return;
  try{
    if(typeof d.close === "function" && d.open) d.close();
    else{
      d.removeAttribute("open");
      d.style.display="none";
    }
  }catch(e){
    d.removeAttribute("open");
    d.style.display="none";
  }
};


const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

const FALLBACK = {
  portal: {
    currentMemberId: "demo-001",
    nextSession: {
      name: "Tuesday Night Football",
      day: "Tuesday",
      time: "8:00pm",
      venue: "Arrow Vale 3G",
      spondUrl: "https://spond.com/client/groups/177A89E178484F8D81BBB39020AF39FB"
    },
    clubNews: {
      title: "Welcome to The Changing Room",
      body: "Demo mode is active while the live spreadsheet connection is being prepared."
    }
  },
  members: [
    {
      id:"demo-001", name:"Demo Member", firstName:"Demo", number:23, position:"Midfielder",
      joined:"Jan 2026", currentWeightKg:88.4, previousWeightKg:89.2, startingWeightKg:106.6,
      attendancePct:92, goals:6, assists:4, ffPoints:42, ffRank:6, weeklyChangeKg:-0.8,
      totalLostKg:18.2, percentLost:17.1, currentStreak:6,
      milestones:["5% Club","10% Club","15% Club"],
      achievements:["First Session","5 Week Streak","5kg Club","First Goal","10% Club"]
    },
    {id:"demo-002",name:"Player 02",ffPoints:56,totalLostKg:12.4,weeklyChangeKg:-1.1},
    {id:"demo-003",name:"Player 03",ffPoints:54,totalLostKg:11.2,weeklyChangeKg:-1.5},
    {id:"demo-004",name:"Player 04",ffPoints:50,totalLostKg:9.8,weeklyChangeKg:-0.9},
    {id:"demo-005",name:"Player 05",ffPoints:48,totalLostKg:8.6,weeklyChangeKg:-1.3},
    {id:"demo-006",name:"Player 06",ffPoints:46,totalLostKg:7.3,weeklyChangeKg:-1.0}
  ],
  weighins: {
    "demo-001": [
      {"date":"2026-06-09","weightKg":106.6},
      {"date":"2026-06-16","weightKg":103.8},
      {"date":"2026-06-23","weightKg":101.7},
      {"date":"2026-06-30","weightKg":99.8},
      {"date":"2026-07-07","weightKg":97.5},
      {"date":"2026-07-14","weightKg":95.4},
      {"date":"2026-07-21","weightKg":93.1},
      {"date":"2026-07-28","weightKg":91.0},
      {"date":"2026-08-04","weightKg":89.2},
      {"date":"2026-08-11","weightKg":88.4}
    ]
  },
  recipes: [{
    id:"katsu-001",
    title:"Sticky Chicken Katsu Curry",
    image:"sticky-chicken-katsu.jpg",
    calories:420,
    proteinG:32,
    carbsG:48,
    fatG:11,
    minutes:30,
    serves:2,
    ingredients:[
      "2 chicken breasts",
      "120g basmati rice",
      "1 carrot",
      "2 spring onions",
      "2 tbsp panko breadcrumbs",
      "1 tsp curry powder",
      "200ml light coconut milk",
      "1 tbsp light soy sauce",
      "1 tsp honey"
    ],
    method:[
      "Cook the rice according to the packet instructions.",
      "Coat the chicken lightly in the breadcrumbs and cook until golden and cooked through.",
      "Simmer the curry powder, coconut milk, soy and honey into a smooth sauce.",
      "Slice the chicken, spoon over the sauce and finish with carrot and spring onion."
    ]
  }],
  team: [
    {"label":"Player 03","weeklyChangeKg":-1.5,"slot":"st"},
    {"label":"Player 05","weeklyChangeKg":-1.3,"slot":"lm"},
    {"label":"Player 02","weeklyChangeKg":-1.1,"slot":"cm"},
    {"label":"Player 06","weeklyChangeKg":-1.0,"slot":"rm"},
    {"label":"Player 04","weeklyChangeKg":-0.9,"slot":"gk"}
  ]
};

async function getJSON(path, fallback){
  try{
    const r = await fetch(path, {cache:"no-store"});
    if(!r.ok) throw new Error(path);
    return await r.json();
  }catch(e){
    console.warn("Using fallback data for", path);
    return fallback;
  }
}

const fmtKg = n => `${Number(n||0).toFixed(1)} kg`;

const ordinal = n => {
  n = Number(n || 0);
  const mod100 = n % 100;
  if(mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch(n % 10){
    case 1: return `${n}st`;
    case 2: return `${n}nd`;
    case 3: return `${n}rd`;
    default: return `${n}th`;
  }
};

function welcomeFor(member){
  if(Number(member.weeklyChangeKg) < 0){
    return `<p><strong>👏 Great work this week!</strong></p><p>Every step forward counts. Keep turning up and trust the process.</p>`;
  }
  if(Number(member.weeklyChangeKg) > 0){
    return `<p><strong>💪 Keep going.</strong></p><p>One weigh-in doesn't define your journey. Draw a line under this week and we'll go again together on Tuesday.</p>`;
  }
  return `<p><strong>👍 A solid week.</strong></p><p>Consistency is what creates long-term progress. Keep showing up and let the weeks add up.</p>`;
}

function drawChart(items){
  const svg = $("#weightChart");
  if(!svg || !items?.length) return;
  const W=760,H=220,pad=30;
  const vals=items.map(x=>Number(x.weightKg));
  const min=Math.min(...vals)-2,max=Math.max(...vals)+2;
  const x=i=>pad+i*((W-pad*2)/(Math.max(1,items.length-1)));
  const y=v=>pad+(max-v)*((H-pad*2)/(max-min || 1));
  const pts=items.map((d,i)=>`${x(i)},${y(d.weightKg)}`).join(" ");
  const grid=[0,.25,.5,.75,1].map(t=>{
    const gy=pad+t*(H-pad*2);
    const v=(max-t*(max-min)).toFixed(0);
    return `<line x1="${pad}" y1="${gy}" x2="${W-pad}" y2="${gy}" stroke="#e6e9e6"/><text x="3" y="${gy+4}" font-size="12" fill="#7a7f7b">${v}</text>`;
  }).join("");
  svg.innerHTML = `${grid}<polyline points="${pts}" fill="none" stroke="#239528" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`+
    items.map((d,i)=>`<circle cx="${x(i)}" cy="${y(d.weightKg)}" r="5" fill="#239528"/>`).join("");
}

function renderLeaderboard(players, field, unit, currentId){
  const arr=[...players].sort((a,b)=>Number(b[field]||0)-Number(a[field]||0)).slice(0,6);
  return arr.map((p,i)=>`
    <div class="leader-row ${p.id===currentId?'you':''}">
      <span class="rank">${i+1}</span>
      <span class="name">${p.name}${p.id===currentId?' (You)':''}</span>
      <strong>${Number(p[field]||0).toFixed(unit===' kg'?1:0)}${unit}</strong>
    </div>`).join("");
}

function renderFullPointsLeaderboard(players, currentId){
  const arr=[...players].sort((a,b)=>Number(b.ffPoints||0)-Number(a.ffPoints||0));
  return arr.map((p,i)=>`
    <div class="leader-row ${p.id===currentId?'you':''}">
      <span class="rank">${i+1}</span>
      <span class="name">${p.name}${p.id===currentId?' (You)':''}</span>
      <strong>${Number(p.ffPoints||0).toFixed(0)} pts</strong>
    </div>`).join("");
}

function renderWeightLeaderboard(players, currentName, limit=5){
  const arr=[...players]
    .filter(p=>Number(p.percentLost)>0 || Number(p.totalKgLost)>0)
    .sort((a,b)=>Number(b.percentLost||0)-Number(a.percentLost||0))
    .slice(0,limit);
  return arr.map((p,i)=>`
    <div class="leader-row ${p.name===currentName?'you':''}">
      <span class="rank">${i+1}</span>
      <span class="name">${p.name}${p.name===currentName?' (You)':''}</span>
      <strong class="weight-detail">${Number(p.percentLost||0).toFixed(1)}%<small>${Number(p.totalKgLost||0).toFixed(1)} kg</small></strong>
    </div>`).join("");
}

function renderFullWeightLeaderboard(players, currentName){
  const arr=[...players]
    .filter(p=>Number(p.percentLost)>0 || Number(p.totalKgLost)>0)
    .sort((a,b)=>Number(b.percentLost||0)-Number(a.percentLost||0));
  return arr.map((p,i)=>`
    <div class="leader-row ${p.name===currentName?'you':''}">
      <span class="rank">${i+1}</span>
      <span class="name">${p.name}${p.name===currentName?' (You)':''}</span>
      <strong class="weight-detail">${Number(p.percentLost||0).toFixed(1)}%<small>${Number(p.totalKgLost||0).toFixed(1)} kg</small></strong>
    </div>`).join("");
}


function renderFullJourney(items){
  return items.slice().reverse().map((x,revIndex)=>{
    const idx = items.length - 1 - revIndex;
    const prev = idx>0 ? Number(items[idx-1].weightKg) : Number(x.weightKg);
    const ch = Number(x.weightKg) - prev;
    const changeText = idx===0 ? "Starting point" : `${ch>0?'+':''}${ch.toFixed(1)} kg ${ch<=0?'↓':'↑'}`;
    return `
      <div class="leader-row">
        <span class="rank">${idx+1}</span>
        <span class="name">${x.date}</span>
        <strong class="weight-detail">${fmtKg(x.weightKg)}<small>${changeText}</small></strong>
      </div>`;
  }).join("");
}

function renderTeam(team){
  const el=$("#teamWeekPlayers");
  if(!el) return;
  el.innerHTML=team.slice(0,5).map((p,i)=>`
    <div class="pitch-player ${p.slot}">
      <div class="head">${i+1}</div>
      <b>${p.label}</b>
      <small>${Number(p.weeklyPoints || 0)} FF pts</small>
    </div>
  `).join("");
}


  const featuredRecipe = {
    id:"gousto-southern-fried",
    title:"Southern Fried Chicken With Creamy Slaw, Gravy & Chips",
    image:"southern-fried-chicken-gousto.jpg",
    sourceUrl:"https://www.gousto.co.uk/cookbook/recipes/southern-fried-chicken-with-creamy-slaw-gravy-chips",
    sourceName:"Gousto",
    ingredients:[
      "Carrot & cabbage slaw mix (160g)",
      "Skinless chicken thighs (320g)",
      "Mayonnaise (50ml)",
      "Southern fried seasoning (1 tbsp)"
    ],
    method:[
      "Open the original Gousto recipe for the complete step-by-step cooking method."
    ]
  };

function renderRecipe(r){
  $("#recipeTitle").textContent=r.title;
  $("#recipeImage").src=r.image || "sticky-chicken-katsu.jpg";
  $("#recipeImage").alt=r.title || "Recipe of the week";

  const calories = $("#recipeCalories");
  const protein = $("#recipeProtein");
  const minutes = $("#recipeMinutes");
  if(calories) calories.textContent = r.calories ?? "See recipe";
  if(protein) protein.textContent = r.proteinG != null ? `${r.proteinG}g` : "Gousto";
  if(minutes) minutes.textContent = r.minutes ?? "↗";

  $("#dialogRecipeImage").src=r.image || "sticky-chicken-katsu.jpg";
  $("#dialogRecipeTitle").textContent=r.title;
  $("#dialogMacros").innerHTML = r.sourceName
    ? `<b>🍽️ Recipe source: ${r.sourceName}</b>`
    : `<b>🔥 ${r.calories} kcal</b><b>💪 ${r.proteinG}g protein</b><b>⏱️ ${r.minutes} mins</b><b>🍽️ Serves ${r.serves}</b>`;

  $("#dialogIngredients").innerHTML=(r.ingredients||[]).map(x=>`<li>${x}</li>`).join("");
  $("#dialogMethod").innerHTML=(r.method||[]).map(x=>`<li>${x}</li>`).join("");

  const btn=$("#recipeOpen");
  if(btn && r.sourceUrl){
    btn.textContent="VIEW RECIPE ON GOUSTO ↗";
    btn.onclick=()=>window.open(r.sourceUrl,"_blank","noopener");
  }else if(btn){
    btn.textContent="VIEW RECIPE";
    btn.onclick=window.openRecipeModal;
  }
}

async function init(){
  const [portal, members, weighins, recipes, team, meData] = await Promise.all([
getJSON("data/portal.json", FALLBACK.portal),
getJSON("data/members.json", FALLBACK.members),
getJSON("data/weighins.json", FALLBACK.weighins),
getJSON("data/recipes.json", FALLBACK.recipes),
getJSON("/api/rankings", { success:false, members:[] }),
getJSON("/api/me", null)
]);

 const sheetMember = meData && meData.success ? meData.member : null;

const m = sheetMember ? {
  id: "live-member",
  name: sheetMember["Name"] || "Member",
  firstName: sheetMember["First Name"] || "Member",
  number: sheetMember["shirt number"] || "--",
  position: sheetMember["Position"] || "Player",
  joined: sheetMember["Date Joined"] || "--",
  photo: sheetMember["player photo"] || "",
  currentWeightKg: Number(sheetMember["Current weight"] || 0),
  startingWeightKg: Number(sheetMember["Start weight"] || 0),
  totalLostKg: Number(sheetMember["total weight loss"] || sheetMember["weight lost"] || 0),
  percentLost: Number(sheetMember["% lost"] || 0),
  weeklyChangeKg: -Number(sheetMember["weekly weight loss"] || 0),
  previousWeightKg: Number(sheetMember["Current weight"] || 0) + Number(sheetMember["weekly weight loss"] || 0),
  ffPoints: Number(sheetMember["FF Total points"] || 0),
  weeklyFFPoints: Number(sheetMember["FF weekly points"] || 0),
  currentStreak: Number(sheetMember["week streak"] || 0),
  weekWeights: Array.from({length:10}, (_,i) => {
    const raw = sheetMember[`week ${i+1}`];
    if(raw === "" || raw === null || raw === undefined) return null;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  }),
  milestones: [
    sheetMember["5% milestone"] ? "5% Club" : null,
    sheetMember["10% milestone"] ? "10% Club" : null,
    sheetMember["15% milestone"] ? "15% Club" : null
  ].filter(Boolean)
} : FALLBACK.members[0];
  const liveHistory = (m.weekWeights || [])
    .map((weightKg,i)=> weightKg ? ({ date:`Week ${i+1}`, weightKg:Number(weightKg) }) : null)
    .filter(Boolean);

  const history = liveHistory.length
    ? liveHistory
    : (weighins[m.id] || FALLBACK.weighins["demo-001"]);

  $("#topName").textContent=m.firstName || "Member";
  $("#welcomeName").textContent=`${(m.firstName || "Member").toUpperCase()}!`;
  $("#welcomeMessage").innerHTML=welcomeFor(m);

  $("#currentWeight").textContent=fmtKg(m.currentWeightKg);
  $("#lastWeight").textContent=`Last week ${fmtKg(m.previousWeightKg)}`;
  $("#weeklyChange").textContent=`${Number(m.weeklyChangeKg)>0?'+':''}${Number(m.weeklyChangeKg||0).toFixed(1)} kg`;
  $("#weeklyLabel").textContent=Number(m.weeklyChangeKg)<0?"Nice work!":Number(m.weeklyChangeKg)>0?"We go again.":"Steady week.";
  $("#totalLost").textContent=fmtKg(m.totalLostKg);
  $("#ffPoints").textContent=m.ffPoints ?? 0;

  const liveRankings = (team && team.success && Array.isArray(team.members))
    ? [...team.members].sort((a,b)=>Number(b.totalPoints||0)-Number(a.totalPoints||0))
    : [];

  const liveRankIndex = liveRankings.findIndex(p =>
    String(p.name || "").trim().toLowerCase() === String(m.name || "").trim().toLowerCase()
  );

  $("#clubRank").textContent = liveRankIndex >= 0 ? ordinal(liveRankIndex + 1) : "--";
  $("#rankOutOf").textContent = liveRankings.length ? `Out of ${liveRankings.length}` : "Out of --";

  $("#sessionName").textContent=portal.nextSession?.name || FALLBACK.portal.nextSession.name;
  $("#sessionDay").textContent=portal.nextSession?.day || "Tuesday";
  $("#sessionTime").textContent=portal.nextSession?.time || "8:00pm";
  $("#sessionVenue").textContent=portal.nextSession?.venue || "Arrow Vale 3G";

  const spond = "https://spond.com/client/groups/177A89E178484F8D81BBB39020AF39FB";
  [$("#spondButton"),$("#spondSideLink")].forEach(a=>{
    if(a){ a.href=spond; a.target="_blank"; a.rel="noopener"; }
  });

  renderRecipe(featuredRecipe);
  const weeklyTeam = (team.success ? team.members : [])
  .filter(p => Number(p.weeklyPoints) > 0)
  .sort((a,b) => Number(b.weeklyPoints) - Number(a.weeklyPoints))
  .slice(0,5)
  .map((p,i) => ({
    label: p.name,
    weeklyPoints: Number(p.weeklyPoints),
    weeklyChangeKg: 0,
    slot: ["st","lm","cm","rm","gk"][i]
  }));

renderTeam(weeklyTeam.length ? weeklyTeam : FALLBACK.team);

  const liveLeague = (team.success ? team.members : [])
  .filter(p => Number(p.totalPoints) > 0)
  .sort((a,b) => Number(b.totalPoints) - Number(a.totalPoints))
  .map((p,i) => ({
    id: p.name === m.name ? m.id : `league-${i}`,
    name: p.name,
    ffPoints: Number(p.totalPoints)
  }));

$("#pointsLeaderboard").innerHTML = renderLeaderboard(
  liveLeague.length ? liveLeague : members,
  "ffPoints",
  "",
  m.id
);

const allLiveLeague = (team.success ? team.members : [])
  .sort((a,b) => Number(b.totalPoints) - Number(a.totalPoints))
  .map((p,i) => ({
    id: p.name === m.name ? m.id : `full-league-${i}`,
    name: p.name,
    ffPoints: Number(p.totalPoints)
  }));

$("#fullPointsLeaderboard").innerHTML = renderFullPointsLeaderboard(
  allLiveLeague.length ? allLiveLeague : members,
  m.id
);

const liveWeightLeague = (team.success ? team.members : []);
$("#weightLeaderboard").innerHTML = liveWeightLeague.length
  ? renderWeightLeaderboard(liveWeightLeague, m.name, 5)
  : renderLeaderboard(members,"totalLostKg"," kg",m.id);

if($("#fullWeightLeaderboard")){
  $("#fullWeightLeaderboard").innerHTML = liveWeightLeague.length
    ? renderFullWeightLeaderboard(liveWeightLeague, m.name)
    : renderLeaderboard(members,"totalLostKg"," kg",m.id);
}

  $("#newsTitle").textContent="TNF RETURNS 1ST SEPTEMBER";
  $("#newsBody").innerHTML=`Tuesday Night Football is back! <a href="${spond}" target="_blank" rel="noopener">Click on Spond to book your place ↗</a>`;

  drawChart(history);
  $("#journeyStart").textContent=fmtKg(m.startingWeightKg);
  $("#journeyCurrent").textContent=fmtKg(m.currentWeightKg);
  $("#journeyLost").textContent=fmtKg(m.totalLostKg);
  $("#journeyPercent").textContent=`${Number(m.percentLost||0).toFixed(1)}%`;
  $("#recentWeighins").innerHTML=history.slice(-8).reverse().map((x)=>{
    const idx=history.indexOf(x);
    const prev=idx>0?history[idx-1].weightKg:x.weightKg;
    const ch=Number(x.weightKg)-Number(prev);
    const changeText = idx===0 ? "Starting point" : `${ch>0?'+':''}${ch.toFixed(1)} kg ${ch<=0?'↓':'↑'}`;
    return `<div class="weigh-row"><span>${x.date}</span><b>${fmtKg(x.weightKg)}</b><span class="${idx===0?'':(ch<=0?'down':'up')}">${changeText}</span></div>`;
  }).join("");

  if($("#fullJourneyList")){
    $("#fullJourneyList").innerHTML = renderFullJourney(history);
  }
  if($("#fullJourneyOpen")){
    $("#fullJourneyOpen").hidden = history.length <= 8;
  }

  const achieved=m.milestones || [];
  const allMilestones=["5% Club","10% Club","15% Club","20% Club"];
  $("#milestoneList").innerHTML=allMilestones.map((x,i)=>{
    const done=achieved.includes(x);
    return `<div class="milestone-row"><span>${done?'🏅':'⚪'}</span><b>${x}</b><em>${done?'Achieved':i===achieved.length?'Next target':'Locked'}</em></div>`;
  }).join("");
  $("#currentStreak").textContent=m.currentStreak ?? 0;

  $("#cardNumber").textContent=`#${m.number ?? "--"}`;
  $("#cardPhoto").src = m.photo ? `/members/images/players/${m.photo}` : "/badge.png";
  $("#cardName").textContent=(m.name || "Member").toUpperCase();
  $("#cardPosition").textContent=(m.position || "Player").toUpperCase();
  $("#cardJoined").textContent=`JOINED ${(m.joined || "--").toUpperCase()}`;
  if($("#pcStartWeight")) $("#pcStartWeight").textContent=fmtKg(m.startWeightKg);
  $("#cardWeight").textContent=fmtKg(m.currentWeightKg);
  $("#cardLoss").textContent=fmtKg(m.totalLostKg);
  $("#cardGoals").textContent=m.goals ?? 0;
  $("#cardAssists").textContent=m.assists ?? 0;
  $("#cardAttendance").textContent=`${m.attendancePct ?? 0}%`;
  $("#cardPoints").textContent=m.ffPoints ?? 0;

  const achievements=m.achievements || FALLBACK.members[0].achievements;
  const icons=["🟢","🔥","💙","⚽","🟣"];
  $("#achievementGrid").innerHTML=achievements.map((a,i)=>`<div class="achievement"><div class="badge">${icons[i%icons.length]}</div><b>${a}</b></div>`).join("");

  if($("#recipeClose")) $("#recipeClose").onclick=window.closeRecipeModal;

  if($("#fullLeagueOpen")) $("#fullLeagueOpen").onclick=()=>{
    const d=$("#leagueDialog");
    if(!d) return;
    if(typeof d.showModal==="function") d.showModal();
    else d.setAttribute("open","");
  };
  if($("#fullLeagueClose")) $("#fullLeagueClose").onclick=()=>{
    const d=$("#leagueDialog");
    if(!d) return;
    if(typeof d.close==="function") d.close();
    else d.removeAttribute("open");
  };

  if($("#fullWeightOpen")) $("#fullWeightOpen").onclick=()=>{
    const d=$("#weightDialog");
    if(!d) return;
    if(typeof d.showModal==="function") d.showModal();
    else d.setAttribute("open","");
  };
  if($("#fullWeightClose")) $("#fullWeightClose").onclick=()=>{
    const d=$("#weightDialog");
    if(!d) return;
    if(typeof d.close==="function") d.close();
    else d.removeAttribute("open");
  };

  if($("#fullJourneyOpen")) $("#fullJourneyOpen").onclick=()=>{
    const d=$("#journeyDialog");
    if(!d) return;
    if(typeof d.showModal==="function") d.showModal();
    else d.setAttribute("open","");
  };
  if($("#fullJourneyClose")) $("#fullJourneyClose").onclick=()=>{
    const d=$("#journeyDialog");
    if(!d) return;
    if(typeof d.close==="function") d.close();
    else d.removeAttribute("open");
  };

  $("#menuBtn").onclick=()=>$("#sidebar").classList.toggle("open");
  $$(".side-nav a").forEach(a=>a.addEventListener("click",()=>$("#sidebar").classList.remove("open")));
  $$("[data-scroll]").forEach(b=>b.onclick=()=>document.querySelector(b.dataset.scroll)?.scrollIntoView({behavior:"smooth"}));
}

document.addEventListener("DOMContentLoaded", init);
