
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

async function getJSON(path){
  const r = await fetch(path);
  if(!r.ok) throw new Error(`Could not load ${path}`);
  return r.json();
}
const fmtKg = n => `${Number(n).toFixed(1)} kg`;

function welcomeFor(member){
  if(member.milestones?.includes("20% Club")){
    return `<p><strong>🎉 Brilliant work!</strong></p><p>You've reached another major milestone. Celebrate it — you've earned it. Then let's see what next week brings.</p>`;
  }
  if(member.weeklyChangeKg < 0){
    return `<p><strong>👏 Great work this week!</strong></p><p>Every step forward counts. Keep turning up and trust the process.</p>`;
  }
  if(member.weeklyChangeKg > 0){
    return `<p><strong>💪 Keep going.</strong></p><p>One weigh-in doesn't define your journey. Draw a line under this week and we'll go again together on Tuesday.</p>`;
  }
  return `<p><strong>👍 A solid week.</strong></p><p>Consistency is what creates long-term progress. Keep showing up and let the weeks add up.</p>`;
}

function drawChart(items){
  const svg = $("#weightChart");
  if(!items?.length) return;
  const W=760,H=220,pad=30;
  const vals=items.map(x=>Number(x.weightKg));
  const min=Math.min(...vals)-2,max=Math.max(...vals)+2;
  const x=i=>pad+i*((W-pad*2)/(items.length-1));
  const y=v=>pad+(max-v)*((H-pad*2)/(max-min));
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
  $("#teamWeekPlayers").innerHTML=team.map((p,i)=>`
    <div class="pitch-player ${p.slot}">
      <div class="head">${i+1}</div>
      <b>${p.label}</b>
      <small>${p.weeklyChangeKg.toFixed(1)} kg</small>
    </div>
  `).join("");
}

function renderRecipe(r){
  $("#recipeTitle").textContent=r.title;
  $("#recipeImage").src=r.image;
  $("#recipeCalories").textContent=r.calories;
  $("#recipeProtein").textContent=`${r.proteinG}g`;
  $("#recipeMinutes").textContent=r.minutes;

  $("#dialogRecipeImage").src=r.image;
  $("#dialogRecipeTitle").textContent=r.title;
  $("#dialogMacros").innerHTML=`<b>🔥 ${r.calories} kcal</b><b>💪 ${r.proteinG}g protein</b><b>⏱️ ${r.minutes} mins</b><b>🍽️ Serves ${r.serves}</b>`;
  $("#dialogIngredients").innerHTML=r.ingredients.map(x=>`<li>${x}</li>`).join("");
  $("#dialogMethod").innerHTML=r.method.map(x=>`<li>${x}</li>`).join("");
}

async function init(){
  const [portal, members, weighins, recipes, team] = await Promise.all([
    getJSON("data/portal.json"),
    getJSON("data/members.json"),
    getJSON("data/weighins.json"),
    getJSON("data/recipes.json"),
    getJSON("data/team-of-week.json")
  ]);

  const m=members.find(x=>x.id===portal.currentMemberId) || members[0];
  const history=weighins[m.id]||[];

  $("#topName").textContent=m.firstName;
  $("#welcomeName").textContent=`${m.firstName.toUpperCase()}!`;
  $("#welcomeMessage").innerHTML=welcomeFor(m);

  $("#currentWeight").textContent=fmtKg(m.currentWeightKg);
  $("#lastWeight").textContent=`Last week ${fmtKg(m.previousWeightKg)}`;
  $("#weeklyChange").textContent=`${m.weeklyChangeKg>0?'+':''}${m.weeklyChangeKg.toFixed(1)} kg`;
  $("#weeklyLabel").textContent=m.weeklyChangeKg<0?"Nice work!":m.weeklyChangeKg>0?"We go again.":"Steady week.";
  $("#totalLost").textContent=fmtKg(m.totalLostKg);
  $("#ffPoints").textContent=m.ffPoints;
  $("#clubRank").textContent=`${m.ffRank}th`;
  $("#rankOutOf").textContent=`Out of ${members.length}`;

  $("#sessionName").textContent=portal.nextSession.name;
  $("#sessionDay").textContent=portal.nextSession.day;
  $("#sessionTime").textContent=portal.nextSession.time;
  $("#sessionVenue").textContent=portal.nextSession.venue;
  const spond=portal.nextSession.spondUrl;
  [$("#spondButton"),$("#spondSideLink")].forEach(a=>{
    a.href=spond==="PASTE_SPOND_LINK_HERE"?"https://spond.com/":spond;
  });

  renderRecipe(recipes[0]);
  renderTeam(team);

  $("#pointsLeaderboard").innerHTML=renderLeaderboard(members,"ffPoints","",m.id);
  $("#weightLeaderboard").innerHTML=renderLeaderboard(members,"totalLostKg"," kg",m.id);

  $("#newsTitle").textContent=portal.clubNews.title;
  $("#newsBody").textContent=portal.clubNews.body;

  drawChart(history);
  $("#journeyStart").textContent=fmtKg(m.startingWeightKg);
  $("#journeyCurrent").textContent=fmtKg(m.currentWeightKg);
  $("#journeyLost").textContent=fmtKg(m.totalLostKg);
  $("#journeyPercent").textContent=`${m.percentLost.toFixed(1)}%`;
  $("#recentWeighins").innerHTML=history.slice(-4).reverse().map((x,i,arr)=>{
    const idx=history.findIndex(h=>h.date===x.date);
    const prev=idx>0?history[idx-1].weightKg:x.weightKg;
    const ch=x.weightKg-prev;
    return `<div class="weigh-row"><span>${x.date}</span><b>${fmtKg(x.weightKg)}</b><span class="${ch<=0?'down':'up'}">${ch>0?'+':''}${ch.toFixed(1)} kg ${ch<=0?'↓':'↑'}</span></div>`;
  }).join("");

  const allMilestones=["5% Club","10% Club","15% Club","20% Club"];
  $("#milestoneList").innerHTML=allMilestones.map((x,i)=>{
    const achieved=m.milestones.includes(x);
    return `<div class="milestone-row"><span>${achieved?'🏅':'⚪'}</span><b>${x}</b><em>${achieved?'Achieved':i===m.milestones.length?'Next target':'Locked'}</em></div>`;
  }).join("");
  $("#currentStreak").textContent=m.currentStreak;

  $("#cardNumber").textContent=`#${m.number}`;
  $("#cardName").textContent=m.name.toUpperCase();
  $("#cardPosition").textContent=m.position.toUpperCase();
  $("#cardJoined").textContent=`JOINED ${m.joined.toUpperCase()}`;
  $("#cardWeight").textContent=fmtKg(m.currentWeightKg);
  $("#cardLoss").textContent=fmtKg(m.totalLostKg);
  $("#cardGoals").textContent=m.goals;
  $("#cardAssists").textContent=m.assists;
  $("#cardAttendance").textContent=`${m.attendancePct}%`;
  $("#cardPoints").textContent=m.ffPoints;

  const icons=["🟢","🔥","💙","⚽","🟣"];
  $("#achievementGrid").innerHTML=m.achievements.map((a,i)=>`<div class="achievement"><div class="badge">${icons[i%icons.length]}</div><b>${a}</b></div>`).join("");

  $("#recipeOpen").onclick=()=>$("#recipeDialog").showModal();
  $("#recipeClose").onclick=()=>$("#recipeDialog").close();

  $("#menuBtn").onclick=()=>$("#sidebar").classList.toggle("open");
  $$(".side-nav a").forEach(a=>a.addEventListener("click",()=>$("#sidebar").classList.remove("open")));
  $$("[data-scroll]").forEach(b=>b.onclick=()=>document.querySelector(b.dataset.scroll)?.scrollIntoView({behavior:"smooth"}));
}
init().catch(err=>{
  console.error(err);
  document.body.insertAdjacentHTML("beforeend",`<div style="position:fixed;bottom:10px;right:10px;background:#b00020;color:#fff;padding:12px;border-radius:8px">Portal data error — check files.</div>`);
});
