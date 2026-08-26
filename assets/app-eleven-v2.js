const cfg = window.FF_CONFIG || {};
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const ELEVEN_STATS_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQvfZXcwd1w1xJJa_Eb2tSVNfRe7epjHAZvHawclyoxaS-oHdr-_fjX0XCo-5M3bCwpmpeitGPEQuy_/pub?gid=1274429032&single=true&output=csv";
const FIXTURES_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQvfZXcwd1w1xJJa_Eb2tSVNfRe7epjHAZvHawclyoxaS-oHdr-_fjX0XCo-5M3bCwpmpeitGPEQuy_/pub?gid=1101386937&single=true&output=csv";


/* =========================================================
   GENERAL HELPERS
   ========================================================= */

function setJoinLinks(){
  const url = cfg.googleFormUrl || "";

  $$(".join-btn").forEach(a => {
    if(url && !url.includes("PASTE_GOOGLE_FORM_LINK_HERE")){
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener";
    }
  });
}


async function loadJSON(path){
  const r = await fetch(path);

  if(!r.ok){
    throw new Error("Could not load " + path);
  }

  return r.json();
}


/* =========================================================
   CSV PARSER
   ========================================================= */

function parseCSV(text){
  const rows = [];
  let row = [];
  let field = "";
  let q = false;

  for(let i = 0; i < text.length; i++){
    const c = text[i];
    const n = text[i + 1];

    if(c === '"' && q && n === '"'){
      field += '"';
      i++;
    }
    else if(c === '"'){
      q = !q;
    }
    else if(c === ',' && !q){
      row.push(field);
      field = "";
    }
    else if((c === '\n' || c === '\r') && !q){

      if(c === '\r' && n === '\n'){
        i++;
      }

      row.push(field);

      if(row.some(x => x.trim() !== "")){
        rows.push(row);
      }

      row = [];
      field = "";
    }
    else{
      field += c;
    }
  }

  if(field.length || row.length){
    row.push(field);
    rows.push(row);
  }

  if(!rows.length){
    return [];
  }

  const headers = rows.shift().map(x => x.trim());

  return rows.map(r =>
    Object.fromEntries(
      headers.map((k, i) => [
        k,
        (r[i] || "").trim()
      ])
    )
  );
}


async function loadCSV(url){
  const separator = url.includes("?") ? "&" : "?";

  const r = await fetch(
    url + separator + "_=" + Date.now(),
    {
      cache: "no-store"
    }
  );

  if(!r.ok){
    throw new Error("Could not load CSV");
  }

  return parseCSV(await r.text());
}


/* =========================================================
   VALUE HELPERS
   ========================================================= */

function num(v){
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}


function pick(obj, ...keys){
  for(const key of keys){
    if(
      obj &&
      Object.prototype.hasOwnProperty.call(obj, key) &&
      String(obj[key]).trim() !== ""
    ){
      return String(obj[key]).trim();
    }
  }

  return "";
}


/* =========================================================
   ROBUST DATE PARSING
   ========================================================= */

/*
   Handles dates coming from Google Sheets such as:

   06/09/2026
   6/9/2026
   6-Sep-2026
   06-Sep-2026
   6 September 2026
   2026-09-06

   The important part is that dates are converted into
   a real local Date object rather than relying entirely
   on JavaScript's automatic date parser.
*/

function parseSheetDate(value){

  if(!value){
    return null;
  }

  const s = String(value).trim();

  if(!s){
    return null;
  }


  /* DD/MM/YYYY or D/M/YYYY */

  let m = s.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
  );

  if(m){

    const day = Number(m[1]);
    const month = Number(m[2]) - 1;
    const year = Number(m[3]);

    const d = new Date(
      year,
      month,
      day,
      12,
      0,
      0,
      0
    );

    if(
      d.getFullYear() === year &&
      d.getMonth() === month &&
      d.getDate() === day
    ){
      return d;
    }

    return null;
  }


  /* YYYY-MM-DD */

  m = s.match(
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/
  );

  if(m){

    const year = Number(m[1]);
    const month = Number(m[2]) - 1;
    const day = Number(m[3]);

    const d = new Date(
      year,
      month,
      day,
      12,
      0,
      0,
      0
    );

    if(
      d.getFullYear() === year &&
      d.getMonth() === month &&
      d.getDate() === day
    ){
      return d;
    }

    return null;
  }


  /* D-MMM-YYYY / DD-MMM-YYYY */

  m = s.match(
    /^(\d{1,2})[-\s]([A-Za-z]{3,9})[-\s](\d{4})$/
  );

  if(m){

    const day = Number(m[1]);
    const monthText = m[2].toLowerCase();
    const year = Number(m[3]);

    const months = {
      jan: 0,
      january: 0,

      feb: 1,
      february: 1,

      mar: 2,
      march: 2,

      apr: 3,
      april: 3,

      may: 4,

      jun: 5,
      june: 5,

      jul: 6,
      july: 6,

      aug: 7,
      august: 7,

      sep: 8,
      sept: 8,
      september: 8,

      oct: 9,
      october: 9,

      nov: 10,
      november: 10,

      dec: 11,
      december: 11
    };

    if(
      Object.prototype.hasOwnProperty.call(
        months,
        monthText
      )
    ){

      const month = months[monthText];

      const d = new Date(
        year,
        month,
        day,
        12,
        0,
        0,
        0
      );

      if(
        d.getFullYear() === year &&
        d.getMonth() === month &&
        d.getDate() === day
      ){
        return d;
      }
    }
  }


  /* Final fallback */

  const fallback = new Date(s);

  if(!Number.isNaN(fallback.getTime())){
    return fallback;
  }

  return null;
}


/* =========================================================
   TODAY / DATE COMPARISON
   ========================================================= */

function startOfToday(){

  const now = new Date();

  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0
  );
}


function dateTimestamp(value){

  const d = parseSheetDate(value);

  if(!d){
    return null;
  }

  return d.getTime();
}


/* =========================================================
   DATE FORMATTING
   ========================================================= */

function formatDate(value){

  const d = parseSheetDate(value);

  if(!d){
    return value || "TBC";
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }
  ).format(d);
}


/* =========================================================
   HOME / AWAY
   ========================================================= */

function shortHA(v){

  const s = String(v || "").trim().toLowerCase();

  if(s.startsWith("h")){
    return "H";
  }

  if(s.startsWith("a")){
    return "A";
  }

  return String(v || "").toUpperCase();
}


/* =========================================================
   RESULT FORMATTING
   ========================================================= */

function normaliseResult(v){

  const s = String(v || "").trim();

  if(!s){
    return "–";
  }

  return s
    .replace(/^[WLD]\s*/i, "")
    .replace(/(\d)\s*-\s*(\d)/g, "$1–$2");
}


/* =========================================================
   OPPONENT BADGES
   ========================================================= */

const BADGE_ALIASES = {

  "wrexham": "wrexham",

  "sutton": "sutton-united",
  "sutton united": "sutton-united",

  "sandwell": "sandwell-social",
  "sandwell social": "sandwell-social",

  "bromsgrove": "bromsgrove-forge",
  "bromsgrove forge": "bromsgrove-forge",

  "kidderminster": "kidderminster-mvf",
  "kidderminster mvf": "kidderminster-mvf",

  "stoke": "stoke-17s",
  "stoke 17s": "stoke-17s",

  "oldbury lions": "oldbury-lions",

  "solihull": "solihull"
};


function opponentSlug(name){

  const key = String(name || "")
    .trim()
    .toLowerCase();

  if(BADGE_ALIASES[key]){
    return BADGE_ALIASES[key];
  }

  return key
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}


function setBadge(img, opponent){

  if(!img){
    return;
  }

  const slug = opponentSlug(opponent);

  img.alt = opponent
    ? opponent + " badge"
    : "Opponent badge";

  img.onerror = function(){

    this.onerror = null;

    this.src = "assets/badges/ffredditch.png";
  };

  img.src = slug
    ? "assets/badges/" + slug + ".png"
    : "assets/badges/ffredditch.png";
}


/* =========================================================
   PLAYER STATISTICS
   ========================================================= */

function renderEleven(data){

  const normalised = data
    .map(p => ({

      name: pick(
        p,
        "Player",
        "player",
        "Name",
        "name"
      ),

      goals: pick(
        p,
        "Goals",
        "goals"
      ),

      assists: pick(
        p,
        "Assists",
        "assists"
      ),

      yellow: pick(
        p,
        "yellow",
        "Yellow"
      ),

      red: pick(
        p,
        "red",
        "Red"
      )

    }))
    .filter(p => p.name);


  const goalPlayers = [...normalised]
    .filter(p => num(p.goals) > 0)
    .sort(
      (a,b) => num(b.goals) - num(a.goals)
    )
    .slice(0,5);


  const assistPlayers = [...normalised]
    .filter(p => num(p.assists) > 0)
    .sort(
      (a,b) => num(b.assists) - num(a.assists)
    )
    .slice(0,5);


  const cards = [...normalised]
    .filter(
      p =>
        num(p.yellow) > 0 ||
        num(p.red) > 0
    )
    .sort(
      (a,b) =>
        (
          num(b.red) * 3 +
          num(b.yellow)
        ) -
        (
          num(a.red) * 3 +
          num(a.yellow)
        )
    );


  const make = (
    arr,
    field,
    emptyText
  ) => {

    if(!arr.length){
      return `
        <li class="empty-stat">
          ${emptyText}
        </li>
      `;
    }

    return arr
      .map(
        (p,i) => `
          <li>
            <span class="pos">${i + 1}</span>
            <span>${p.name}</span>
            <span class="num">${num(p[field])}</span>
          </li>
        `
      )
      .join("");
  };


  if($("#scorers")){
    $("#scorers").innerHTML =
      make(
        goalPlayers,
        "goals",
        "No goals recorded yet."
      );
  }


  if($("#assists")){
    $("#assists").innerHTML =
      make(
        assistPlayers,
        "assists",
        "No assists recorded yet."
      );
  }


  if($("#discipline")){

    $("#discipline").innerHTML =
      !cards.length

        ? `
          <div class="discipline-empty">
            No cards recorded yet.
          </div>
        `

        : `
          <div class="discipline-row discipline-head">
            <span>Player</span>
            <span>🟨</span>
            <span>🟥</span>
          </div>

          ${
            cards
              .map(
                p => `
                  <div class="discipline-row">
                    <span>${p.name}</span>
                    <strong>${num(p.yellow)}</strong>
                    <strong>${num(p.red)}</strong>
                  </div>
                `
              )
              .join("")
          }
        `;
  }
}


/* =========================================================
   RESULT CLASS
   ========================================================= */

function resultClass(result){

  const s = String(result || "")
    .trim()
    .toUpperCase();

  if(s.startsWith("W")){
    return "result-win";
  }

  if(s.startsWith("D")){
    return "result-draw";
  }

  if(s.startsWith("L")){
    return "result-loss";
  }

  return "";
}


/* =========================================================
   PAST FIXTURES
   ========================================================= */

function renderPastFixtures(fixtures){

  const body = $("#pastFixturesBody");

  if(!body){
    return;
  }


  const played = [...fixtures]

    .filter(
      r =>
        r.status.toLowerCase() === "played" ||
        !!r.result
    )

    .sort(
      (a,b) =>
        (
          dateTimestamp(b.date) || 0
        ) -
        (
          dateTimestamp(a.date) || 0
        )
    );


  if(!played.length){

    body.innerHTML = `
      <tr>
        <td colspan="8">
          No past fixtures recorded yet.
        </td>
      </tr>
    `;

    return;
  }


  body.innerHTML = played
    .map(
      r => `
        <tr>

          <td>
            ${formatDate(r.date)}
          </td>

          <td>
            ${r.opponent || "TBC"}
          </td>

          <td>
            ${r.homeAway || "–"}
          </td>

          <td>
            ${r.competition || "TBC"}
          </td>

          <td>
            ${r.ko || "TBC"}
          </td>

          <td class="${resultClass(r.result)}">
            ${r.result || "–"}
          </td>

          <td>
            ${r.scorers || "None recorded"}
          </td>

          <td>
            ${r.motm || "TBC"}
          </td>

        </tr>
      `
    )
    .join("");
}


/* =========================================================
   FIXTURE RENDERING
   ========================================================= */

function renderFixtures(rows){

  /*
    Convert Google Sheet rows into a consistent structure.
  */

  const fixtures = rows

    .map(r => ({

      date: pick(
        r,
        "Date",
        "date"
      ),

      opponent: pick(
        r,
        "Opponent",
        "opponent"
      ),

      homeAway: pick(
        r,
        "H/A",
        "h/a",
        "HA"
      ),

      competition: pick(
        r,
        "Competition",
        "competition"
      ),

      ko: pick(
        r,
        "KO",
        "ko"
      ),

      result: pick(
        r,
        "Result",
        "result"
      ),

      scorers: pick(
        r,
        "Scorers",
        "scorers"
      ),

      motm: pick(
        r,
        "MOTM",
        "motm"
      ),

      status: pick(
        r,
        "Status",
        "status"
      ),

      venue: pick(
        r,
        "Venue",
        "venue"
      )

    }))

    .filter(
      r =>
        r.opponent ||
        r.date
    );


  /* =======================================================
     PAST FIXTURES

     These are fixtures that have been explicitly marked
     played or have a result.
     ======================================================= */

  const played = fixtures

    .filter(
      r =>
        r.status.toLowerCase() === "played" ||
        !!r.result
    )

    .sort(
      (a,b) =>
        (
          dateTimestamp(b.date) || 0
        ) -
        (
          dateTimestamp(a.date) || 0
        )
    );


  /* =======================================================
     UPCOMING FIXTURES

     IMPORTANT FIX:

     We DO NOT rely on the Status column here.

     Instead we:

     1. Parse the actual fixture date.
     2. Ignore invalid dates.
     3. Ignore dates before today.
     4. Sort all future fixtures chronologically.
     5. Select the first future fixture.

     This prevents an old entry such as:

       13-Dec-2016 Sandwell

     from being selected as the next fixture.

     It also means the website automatically follows the
     fixture list as the season progresses.
     ======================================================= */

  const today = startOfToday();


  const upcoming = fixtures

    .map(r => {

      const parsedDate =
        parseSheetDate(r.date);

      return {
        ...r,
        parsedDate
      };

    })

    .filter(r => {

      if(!r.parsedDate){
        return false;
      }

      /*
        A fixture is considered upcoming if its date
        is today or later.

        This deliberately ignores the Status column.
      */

      return r.parsedDate >= today;

    })

    .sort(
      (a,b) =>
        a.parsedDate.getTime() -
        b.parsedDate.getTime()
    );


  /*
    The first chronological future fixture is ALWAYS
    the next fixture.
  */

  const last = played[0];
  const next = upcoming[0];


  /* =======================================================
     DEBUGGING INFORMATION

     This is useful if the Google Sheet is ever changed
     and the website appears to select the wrong fixture.

     Open browser console (F12) and you'll see exactly
     which fixture the website selected.
     ======================================================= */

  console.log(
    "FF Redditch fixtures loaded:",
    fixtures
  );

  console.log(
    "FF Redditch upcoming fixtures:",
    upcoming
  );

  console.log(
    "FF Redditch next fixture:",
    next
  );


  renderPastFixtures(fixtures);


  /* =======================================================
     NEXT FIXTURE
     ======================================================= */

  if(next){

    if($("#nextOpponent")){
      $("#nextOpponent").textContent =
        next.opponent;
    }

    if($("#nextOpponentDetail")){
      $("#nextOpponentDetail").textContent =
        next.opponent;
    }

    if($("#nextDate")){
      $("#nextDate").textContent =
        formatDate(next.date);
    }

    if($("#nextKO")){
      $("#nextKO").textContent =
        next.ko || "TBC";
    }

    if($("#nextCompetition")){
      $("#nextCompetition").textContent =
        next.competition || "TBC";
    }

    if($("#nextHomeAway")){
      $("#nextHomeAway").textContent =
        shortHA(next.homeAway) || "–";
    }

    if($("#nextVenue")){
      $("#nextVenue").textContent =
        next.venue || "TBC";
    }

    setBadge(
      $("#nextOpponentBadge"),
      next.opponent
    );
  }


  /* =======================================================
     LAST RESULT
     ======================================================= */

  if(last){

    if($("#lastOpponent")){
      $("#lastOpponent").textContent =
        last.opponent;
    }

    if($("#lastScore")){
      $("#lastScore").textContent =
        normaliseResult(last.result);
    }

    if($("#lastScorers")){
      $("#lastScorers").textContent =
        last.scorers ||
        "None recorded";
    }

    if($("#lastMotm")){
      $("#lastMotm").textContent =
        last.motm ||
        "TBC";
    }

    if($("#lastCompetition")){
      $("#lastCompetition").textContent =
        last.competition ||
        "TBC";
    }

    if($("#lastVenue")){
      $("#lastVenue").textContent =
        last.venue ||
        "TBC";
    }

    setBadge(
      $("#lastOpponentBadge"),
      last.opponent
    );
  }
}


/* =========================================================
   PAGE INITIALISATION
   ========================================================= */

async function elevenPageInit(){

  const results =
    await Promise.allSettled([
      loadCSV(ELEVEN_STATS_CSV),
      loadCSV(FIXTURES_CSV)
    ]);


  /* =======================================================
     PLAYER STATS
     ======================================================= */

  if(results[0].status === "fulfilled"){

    renderEleven(
      results[0].value
    );

  }
  else{

    console.warn(
      "Could not load 11s stats",
      results[0].reason
    );

    try{

      renderEleven(
        await loadJSON(
          "data/eleven-stats.json?v=20260817"
        )
      );

    }
    catch(e){

      console.warn(e);

    }
  }


  /* =======================================================
     FIXTURES
     ======================================================= */

  if(results[1].status === "fulfilled"){

    renderFixtures(
      results[1].value
    );

  }
  else{

    console.warn(
      "Could not load fixtures",
      results[1].reason
    );

  }
}


/* =========================================================
   DOM READY
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    setJoinLinks();


    const menu = $(".menu");
    const nav = $(".nav");


    if(menu && nav){

      menu.addEventListener(
        "click",
        () =>
          nav.classList.toggle("open")
      );

    }


    if(
      document.body.dataset.page === "eleven"
    ){

      elevenPageInit();

    }

  }
);
