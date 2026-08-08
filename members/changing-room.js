
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
      spondUrl: "https://spond.com/invite/XJRNG"
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

function renderTeam(team){
  const el=$("#teamWeekPlayers");
  if(!el) return;
  el.innerHTML=team.slice(0,5).map((p,i)=>`
    <div class="pitch-player ${p.slot}">
      <div class="head">${i+1}</div>
      <b>${p.label}</b>
      <small>${Number(p.weeklyChangeKg).toFixed(1)} kg</small>
    </div>
  `).join("");
}

function renderRecipe(r){
  $("#recipeTitle").textContent=r.title;
  $("#recipeImage").src=r.image || "sticky-chicken-katsu.jpg";
  $("#recipeCalories").textContent=r.calories;
  $("#recipeProtein").textContent=`${r.proteinG}g`;
  $("#recipeMinutes").textContent=r.minutes;

  $("#dialogRecipeImage").src=r.image || "sticky-chicken-katsu.jpg";
  $("#dialogRecipeTitle").textContent=r.title;
  $("#dialogMacros").innerHTML=`<b>🔥 ${r.calories} kcal</b><b>💪 ${r.proteinG}g protein</b><b>⏱️ ${r.minutes} mins</b><b>🍽️ Serves ${r.serves}</b>`;
  $("#dialogIngredients").innerHTML=(r.ingredients||[]).map(x=>`<li>${x}</li>`).join("");
  $("#dialogMethod").innerHTML=(r.method||[]).map(x=>`<li>${x}</li>`).join("");
}

async function init(){
  const [portal, members, weighins, recipes, team] = await Promise.all([
    getJSON("data/portal.json", FALLBACK.portal),
    getJSON("data/members.json", FALLBACK.members),
    getJSON("data/weighins.json", FALLBACK.weighins),
    getJSON("data/recipes.json", FALLBACK.recipes),
    getJSON("data/team-of-week.json", FALLBACK.team)
  ]);

  const m=members.find(x=>x.id===portal.currentMemberId) || members[0] || FALLBACK.members[0];
  const history=weighins[m.id] || FALLBACK.weighins["demo-001"];

  $("#topName").textContent=m.firstName || "Member";
  $("#welcomeName").textContent=`${(m.firstName || "Member").toUpperCase()}!`;
  $("#welcomeMessage").innerHTML=welcomeFor(m);

  $("#currentWeight").textContent=fmtKg(m.currentWeightKg);
  $("#lastWeight").textContent=`Last week ${fmtKg(m.previousWeightKg)}`;
  $("#weeklyChange").textContent=`${Number(m.weeklyChangeKg)>0?'+':''}${Number(m.weeklyChangeKg||0).toFixed(1)} kg`;
  $("#weeklyLabel").textContent=Number(m.weeklyChangeKg)<0?"Nice work!":Number(m.weeklyChangeKg)>0?"We go again.":"Steady week.";
  $("#totalLost").textContent=fmtKg(m.totalLostKg);
  $("#ffPoints").textContent=m.ffPoints ?? 0;
  $("#clubRank").textContent=m.ffRank ? `${m.ffRank}th` : "--";
  $("#rankOutOf").textContent=`Out of ${members.length}`;

  $("#sessionName").textContent=portal.nextSession?.name || FALLBACK.portal.nextSession.name;
  $("#sessionDay").textContent=portal.nextSession?.day || "Tuesday";
  $("#sessionTime").textContent=portal.nextSession?.time || "8:00pm";
  $("#sessionVenue").textContent=portal.nextSession?.venue || "Arrow Vale 3G";

  const spond = "https://spond.com/invite/XJRNG";
  [$("#spondButton"),$("#spondSideLink")].forEach(a=>{
    if(a){ a.href=spond; a.target="_blank"; a.rel="noopener"; }
  });

  renderRecipe((recipes && recipes[0]) || FALLBACK.recipes[0]);
  renderTeam(team || FALLBACK.team);

  $("#pointsLeaderboard").innerHTML=renderLeaderboard(members,"ffPoints","",m.id);
  $("#weightLeaderboard").innerHTML=renderLeaderboard(members,"totalLostKg"," kg",m.id);

  $("#newsTitle").textContent=portal.clubNews?.title || FALLBACK.portal.clubNews.title;
  $("#newsBody").textContent=portal.clubNews?.body || FALLBACK.portal.clubNews.body;

  drawChart(history);
  $("#journeyStart").textContent=fmtKg(m.startingWeightKg);
  $("#journeyCurrent").textContent=fmtKg(m.currentWeightKg);
  $("#journeyLost").textContent=fmtKg(m.totalLostKg);
  $("#journeyPercent").textContent=`${Number(m.percentLost||0).toFixed(1)}%`;
  $("#recentWeighins").innerHTML=history.slice(-4).reverse().map((x)=>{
    const idx=history.findIndex(h=>h.date===x.date);
    const prev=idx>0?history[idx-1].weightKg:x.weightKg;
    const ch=Number(x.weightKg)-Number(prev);
    return `<div class="weigh-row"><span>${x.date}</span><b>${fmtKg(x.weightKg)}</b><span class="${ch<=0?'down':'up'}">${ch>0?'+':''}${ch.toFixed(1)} kg ${ch<=0?'↓':'↑'}</span></div>`;
  }).join("");

  const achieved=m.milestones || [];
  const allMilestones=["5% Club","10% Club","15% Club","20% Club"];
  $("#milestoneList").innerHTML=allMilestones.map((x,i)=>{
    const done=achieved.includes(x);
    return `<div class="milestone-row"><span>${done?'🏅':'⚪'}</span><b>${x}</b><em>${done?'Achieved':i===achieved.length?'Next target':'Locked'}</em></div>`;
  }).join("");
  $("#currentStreak").textContent=m.currentStreak ?? 0;

  $("#cardNumber").textContent=`#${m.number ?? "--"}`;
  $("#cardName").textContent=(m.name || "Member").toUpperCase();
  $("#cardPosition").textContent=(m.position || "Player").toUpperCase();
  $("#cardJoined").textContent=`JOINED ${(m.joined || "--").toUpperCase()}`;
  $("#cardWeight").textContent=fmtKg(m.currentWeightKg);
  $("#cardLoss").textContent=fmtKg(m.totalLostKg);
  $("#cardGoals").textContent=m.goals ?? 0;
  $("#cardAssists").textContent=m.assists ?? 0;
  $("#cardAttendance").textContent=`${m.attendancePct ?? 0}%`;
  $("#cardPoints").textContent=m.ffPoints ?? 0;

  const achievements=m.achievements || FALLBACK.members[0].achievements;
  const icons=["🟢","🔥","💙","⚽","🟣"];
  $("#achievementGrid").innerHTML=achievements.map((a,i)=>`<div class="achievement"><div class="badge">${icons[i%icons.length]}</div><b>${a}</b></div>`).join("");

  $("#recipeOpen").onclick=()=>$("#recipeDialog").showModal();
  $("#recipeClose").onclick=()=>$("#recipeDialog").close();
  $("#menuBtn").onclick=()=>$("#sidebar").classList.toggle("open");
  $$(".side-nav a").forEach(a=>a.addEventListener("click",()=>$("#sidebar").classList.remove("open")));
  $$("[data-scroll]").forEach(b=>b.onclick=()=>document.querySelector(b.dataset.scroll)?.scrollIntoView({behavior:"smooth"}));
}

document.addEventListener("DOMContentLoaded", init);
