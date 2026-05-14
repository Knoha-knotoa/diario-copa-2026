
const STADIUM_IMAGES = [
  { key: "azteca", file: "Estadio-Azteca.JPG" },
  { key: "akron", file: "Estadio-Akron.jpg" },
  { key: "bmo field", file: "Estadio-BMO-Field.jpg" },
  { key: "sofi", file: "Estadio-SoFi.jpg" },
  { key: "levis", file: "Estadio-levis.jpeg" },
  { key: "levi’s", file: "Estadio-levis.jpeg" },
  { key: "levi's", file: "Estadio-levis.jpeg" },
  { key: "metlife", file: "Estadio-Metlife.jpg" },
  { key: "gillette", file: "Estadio-gillette.jpg" },
  { key: "bc place", file: "Estadio-BC-place.jpg" },
  { key: "nrg", file: "Estadio-NRG.jpg" },
  { key: "at&t", file: "Estadio-AT&T.jpg" },
  { key: "att", file: "Estadio-AT&T.jpg" },
  { key: "lincoln financial", file: "Estadio-Lincoln-Financial-Field.jpg" },
  { key: "bbva", file: "Estadio_BBVA.JPG" },
  { key: "mercedes-benz", file: "Estadio-Mercedes-Benz.jpg" },
  { key: "mercedes benz", file: "Estadio-Mercedes-Benz.jpg" },
  { key: "lumen", file: "Estadio-Lumen-Field.jpg" },
  { key: "hard rock", file: "Estadio-Hard-Rock.jpg" },
  { key: "arrowhead", file: "Estadio-GEHA-Field.jpeg" },
  { key: "geha", file: "Estadio-GEHA-Field.jpeg" }
];

function stadiumImagePath(venue) {
  const texto = String(venue || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const achado = STADIUM_IMAGES.find(item => texto.includes(
    item.key
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
  ));

  return achado ? `fotos-estadios/${achado.file}` : "";
}

const PHASES = [
  {id:"home", label:"Início", short:"Capa", matches:null, title:"Início", unlock:()=>true},
  {id:"grupos", label:"Jogos", short:"Grupos", matches:null, title:"Jogos", unlock:()=>true},
  {id:"teams", label:"Seleções", short:"Jogadores", matches:null, title:"Seleções e jogadores", unlock:()=>true},
  {id:"api", label:"API", short:"Dados oficiais", matches:null, title:"API-Football", unlock:()=>true},
  {id:"diary", label:"Área pessoal", short:"Diário + fotos", matches:null, title:"Área pessoal", unlock:()=>true},
  {id:"report", label:"Livro PDF", short:"Livro", matches:null, title:"Livro da Copa", unlock:()=>true},
  {id:"scrapbook", label:"Scrapbook Final", short:"Guia", matches:null, title:"Scrapbook Final", unlock:()=>true},
  {id:"r32", label:"16 avos", short:"16", matches:R32, title:"16 avos de final", unlock:()=>true},
  {id:"r16", label:"Oitavas", short:"8", matches:R16, title:"Oitavas de final", unlock:()=>true},
  {id:"qf", label:"Quartas", short:"4", matches:QF, title:"Quartas de final", unlock:()=>true},
  {id:"sf", label:"Semifinais", short:"Semi", matches:SF, title:"Semifinais", unlock:()=>true},
  {id:"finals", label:"Finais", short:"Final", matches:FINALS, title:"Final e disputa de 3º lugar", unlock:()=>true}
];
const STORE = "quem_ganha_copa_2026_estrutura_final_v1";
const STORE_LITE = STORE + "_lite";
const DB_NAME = "quem_ganha_copa_2026_db";
const DB_STORE = "app_state";

let state = loadState();
let activePhase = "home";
let openGroups = new Set(state.openGroups || ["A"]);
let persistTimer=null;
let dbPromise=null;


function updateLocalSaveStatus(text){
  const el=document.getElementById("localSaveStatus");
  if(el) el.textContent=text;
}
async function testarSalvamentoLocal(){
  persist();
  setTimeout(async ()=>{
    let ok=false;
    try{
      if(typeof loadStateIndexedDB === "function"){
        const saved = await loadStateIndexedDB();
        ok = !!saved;
      }else{
        ok = !!localStorage.getItem(STORE);
      }
    }catch(e){}
    alert(ok ? "Salvamento local funcionando neste navegador." : "Não consegui confirmar o salvamento local. Use Exportar backup.");
  },500);
}

function defaultState(){return {groupScores:{},koScores:{},tieChoices:{},lineups:{},matchNotes:{},players:{},apiTeams:{},apiFixtures:{},personal:{},openGroups:["A"]};}

function localStorageSafeGet(key){
  try{return localStorage.getItem(key);}catch(e){return null;}
}

function loadState(){
  try{
    const oldFull = localStorageSafeGet(STORE);
    const lite = localStorageSafeGet(STORE_LITE);
    return {...defaultState(),...JSON.parse(oldFull || lite || "{}")};
  }catch(e){
    return defaultState();
  }
}

function isLargeDataImage(value){
  return typeof value === "string" && value.startsWith("data:image") && value.length > 5000;
}

function saveLocalLite(){
  try{
    const lite = JSON.stringify(state, (key,value)=>{
      if(isLargeDataImage(value)) return "";
      return value;
    });
    localStorage.setItem(STORE_LITE,lite);
  }catch(e){}
}

function openAppDB(){
  if(!("indexedDB" in window)) return Promise.reject(new Error("IndexedDB indisponível"));
  if(dbPromise) return dbPromise;
  dbPromise = new Promise((resolve,reject)=>{
    const req = indexedDB.open(DB_NAME,1);
    req.onupgradeneeded = e=>{
      const db=e.target.result;
      if(!db.objectStoreNames.contains(DB_STORE)) db.createObjectStore(DB_STORE);
    };
    req.onsuccess = e=>resolve(e.target.result);
    req.onerror = ()=>reject(req.error || new Error("Erro ao abrir banco local"));
  });
  return dbPromise;
}

async function saveStateIndexedDB(){
  try{
    state.openGroups=[...openGroups];
    const db = await openAppDB();
    await new Promise((resolve,reject)=>{
      const tx = db.transaction(DB_STORE,"readwrite");
      tx.objectStore(DB_STORE).put({value:state,updatedAt:Date.now()},"main");
      tx.oncomplete=()=>{updateLocalSaveStatus("💾 Salvo no celular"); resolve();};
      tx.onerror=()=>reject(tx.error);
    });
  }catch(e){
    console.warn("Não foi possível salvar no IndexedDB:", e);
  }
}

async function loadStateIndexedDB(){
  try{
    const db = await openAppDB();
    return await new Promise((resolve,reject)=>{
      const tx = db.transaction(DB_STORE,"readonly");
      const req = tx.objectStore(DB_STORE).get("main");
      req.onsuccess=()=>resolve(req.result?.value || null);
      req.onerror=()=>reject(req.error);
    });
  }catch(e){
    console.warn("Não foi possível carregar do IndexedDB:", e);
    return null;
  }
}

function persist(){
  state.openGroups=[...openGroups];
  saveLocalLite();
  saveStateIndexedDB();
}

function persistSoon(){
  state.openGroups=[...openGroups];
  clearTimeout(persistTimer);
  persistTimer=setTimeout(()=>persist(),350);
}

async function bootApp(){
  const saved = await loadStateIndexedDB();
  if(saved){
    state = {...defaultState(),...saved};
    openGroups = new Set(state.openGroups || ["A"]);
  }else{
    persist();
  }
  ensurePlayers();
  render();
}
function h(x){return String(x ?? "").replace(/[&<>"']/g, m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));}
function fmt(iso){return new Intl.DateTimeFormat("pt-BR",{dateStyle:"short",timeStyle:"short",timeZone:"America/Sao_Paulo"}).format(new Date(iso));}
function strength(t){return BASE[t] || 70;}
function prob(a,b){const ra=strength(a),rb=strength(b),diff=ra-rb;const draw=Math.max(14,Math.min(30,27-Math.abs(diff)*0.55));const paNoDraw=1/(1+Math.exp(-diff/9));const pa=Math.round((100-draw)*paNoDraw);const pd=Math.round(draw);const pb=Math.max(0,100-pa-pd);const qa=Math.round(100/(1+Math.exp(-diff/8)));return{ra,rb,pa,pd,pb,qa,qb:100-qa};}
function bar(v,color){return `<div class="bar"><span style="width:${Math.max(2,Math.min(100,v))}%;background:${color}"></span></div>`;}
function hashStr(str){let h=0;for(let i=0;i<String(str).length;i++)h=((h<<5)-h)+String(str).charCodeAt(i),h|=0;return Math.abs(h);}
function venuePalette(name){const palettes=[["#0f766e","#14b8a6","#99f6e4"],["#1d4ed8","#60a5fa","#dbeafe"],["#7c3aed","#c084fc","#ede9fe"],["#b91c1c","#fb7185","#ffe4e6"],["#166534","#4ade80","#dcfce7"],["#92400e","#f59e0b","#fef3c7"]];return palettes[hashStr(name)%palettes.length];}
function venueShort(name){return String(name||"").split(",")[0];}
function venueImage(venue){
  const caminho = stadiumImagePath(venue);
  if (caminho) return caminho;

  const [c1,c2,c3]=venuePalette(venue);
  const title=venueShort(venue).replace(/&/g,'&amp;').replace(/</g,'&lt;');
  const sub=String(venue||'').replace(/&/g,'&amp;').replace(/</g,'&lt;');
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 420"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect width="800" height="420" rx="0" fill="url(#g)"/><circle cx="90" cy="70" r="34" fill="#ffffff22"/><circle cx="720" cy="70" r="54" fill="#ffffff14"/><ellipse cx="400" cy="300" rx="230" ry="84" fill="#0f172a22"/><ellipse cx="400" cy="288" rx="250" ry="96" fill="#ffffff18"/><ellipse cx="400" cy="285" rx="205" ry="72" fill="#0f172a66"/><ellipse cx="400" cy="285" rx="142" ry="44" fill="#22c55e"/><text x="36" y="54" fill="#fff" font-family="Arial, sans-serif" font-size="18" font-weight="700">ESTÁDIO</text><text x="36" y="95" fill="#fff" font-family="Arial, sans-serif" font-size="38" font-weight="900">${title}</text><text x="36" y="126" fill="${c3}" font-family="Arial, sans-serif" font-size="18">${sub}</text></svg>`;
  return 'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(svg);
}
function getOfficial(id,field){return state.officials?.[id]?.[field] || "";}
function setOfficial(id,field,value){state.officials[id]=state.officials[id]||{};state.officials[id][field]=value;persist();}
function getLineup(id,side){return state.lineups?.[id]?.[side] || "";}
function setLineup(id,side,value){state.lineups[id]=state.lineups[id]||{};state.lineups[id][side]=value;persist();}
function lineupPlaceholder(team){return `1. Goleiro
2. Lateral direito
3. Zagueiro
4. Zagueiro
5. Lateral esquerdo
6. Volante
7. Meio-campo
8. Meio-campo
9. Ponta
10. Centroavante
11. Ponta`;}

function getMatchNote(id,field){return state.matchNotes?.[id]?.[field] || "";}
function setMatchNote(id,field,value){state.matchNotes[id]=state.matchNotes[id]||{};state.matchNotes[id][field]=value;persistSoon();}
function setMatchNoteAndRender(id,field,value){setMatchNote(id,field,value);render();}

const POS_TEMPLATE = ["GOL","GOL","GOL","LD","ZAG","ZAG","ZAG","ZAG","LE","VOL","VOL","MC","MC","MEI","MEI","PD","PE","ATA","ATA","ATA","ATA","JOG","JOG","JOG","JOG","JOG"];
const POSITION_ORDER = ["Goleiros","Defensores","Meio-campistas","Atacantes","Outros"];
const POSITION_OPTIONS = ["Goleiro","Defensor","Meio-campista","Atacante","GOL","LD","ZAG","LE","VOL","MC","MEI","PD","PE","ATA","JOG"];
function allTeams(){return Object.values(GROUPS).flat();}
function teamByIndex(idx){return allTeams()[Number(idx)] || allTeams()[0];}
function makeDefaultPlayers(team){return POS_TEMPLATE.map((pos,i)=>({name:`${team} jogador ${i+1}`, number:i+1, pos, age:"", photo:"", cardUrl:"", history:"", apiStats:"", apiId:"", favorite:false}));}
function ensurePlayers(){state.players=state.players||{};allTeams().forEach(team=>{if(!Array.isArray(state.players[team]))state.players[team]=makeDefaultPlayers(team);});}
function getPlayers(team){ensurePlayers();return state.players[team] || makeDefaultPlayers(team);}
function setPlayerFieldByIndex(teamIndex,playerIndex,field,value){ensurePlayers();const team=teamByIndex(teamIndex);const list=getPlayers(team).map(p=>({...p}));if(!list[playerIndex])return;list[playerIndex][field]=["number","age"].includes(field)?(value===""?"":Number(value||0)):value;state.players[team]=list;persist();if(activePhase==="teams")renderTeams();}
function togglePlayerFavorite(teamIndex,playerIndex){ensurePlayers();const team=teamByIndex(teamIndex);const list=getPlayers(team).map(p=>({...p}));if(!list[playerIndex])return;list[playerIndex].favorite=!list[playerIndex].favorite;state.players[team]=list;persist();renderTeamsMaybe();}
function addManualPlayer(teamIndex){const team=teamByIndex(teamIndex);ensurePlayers();state.players[team]=getPlayers(team).concat([{name:"Novo jogador",number:"",pos:"JOG",age:"",photo:"",cardUrl:"",history:"",apiStats:"",apiId:"",favorite:false}]);persist();renderTeams();}
function removePlayerByIndex(teamIndex,playerIndex){const team=teamByIndex(teamIndex);if(!confirm(`Remover este jogador de ${team}?`))return;state.players[team]=getPlayers(team).filter((_,i)=>i!==playerIndex);persist();renderTeams();}
function handlePlayerPhotoByIndex(teamIndex,playerIndex,input){const file=input.files&&input.files[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{setPlayerFieldByIndex(teamIndex,playerIndex,"photo",reader.result);};reader.readAsDataURL(file);}
function removePlayerPhoto(teamIndex,playerIndex){setPlayerFieldByIndex(teamIndex,playerIndex,"photo","");}
function initials(name){return String(name||"?").split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join("").toUpperCase()||"?";}
function playerAvatar(name,team,number){const [c1,c2,c3]=venuePalette(team);const safe=String(name||"").replace(/&/g,"&amp;").replace(/</g,"&lt;");const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 480"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect width="360" height="480" rx="28" fill="url(#g)"/><circle cx="180" cy="150" r="62" fill="#ffffffd9"/><path d="M70 392c22-92 86-138 110-138s88 46 110 138" fill="#ffffffd9"/><text x="180" y="58" text-anchor="middle" fill="#fff" font-family="Arial, sans-serif" font-size="34" font-weight="900">${number||""}</text><text x="180" y="442" text-anchor="middle" fill="${c3}" font-family="Arial, sans-serif" font-size="34" font-weight="900">${initials(safe)}</text></svg>`;return "data:image/svg+xml;charset=UTF-8,"+encodeURIComponent(svg);}
function playerImage(p,team){return p.photo || p.cardUrl || playerAvatar(p.name,team,p.number);}
function normalizePosition(pos){
  const p=String(pos||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
  if(/goal|goleiro|\bgk\b|\bgol\b/.test(p))return "Goleiros";
  if(/defen|zague|lateral|\bld\b|\ble\b|\bcb\b|\brb\b|\blb\b|zag/.test(p))return "Defensores";
  if(/mid|meio|vol|mc|mei|dm|cm|am/.test(p))return "Meio-campistas";
  if(/att|ata|forward|wing|ponta|striker|pd|pe|fw/.test(p))return "Atacantes";
  return "Outros";
}
function playersByPosition(team){
  const groups={};POSITION_ORDER.forEach(k=>groups[k]=[]);
  getPlayers(team).forEach((p,i)=>{const key=normalizePosition(p.pos||p.position);groups[key]=groups[key]||[];groups[key].push({...p,_index:i});});
  return groups;
}
function positionLabel(pos){return String(pos||"JOG");}
function playerStatsForDisplay(team,p,stats){const st=stats[normalizeName(p.name)]||{goals:0,mvps:0};return st;}

function normalizeName(s){return String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim();}
function parseEntries(text){return String(text||"").split(/\n|,/).map(s=>s.trim()).filter(Boolean);}
function entryPlayerName(entry){return normalizeName(String(entry||"").replace(/[-–—].*$/,"").replace(/\(?\d+.*$/,"").replace(/\s+\d+'?.*$/,"").trim());}
function teamPlayerStats(team){ensurePlayers();const stats={};getPlayers(team).forEach(p=>stats[normalizeName(p.name)]={goals:0,mvps:0,name:p.name});const add=(match,side)=>{const notes=state.matchNotes?.[match.id]||{};parseEntries(notes[side]||"").forEach(e=>{const k=entryPlayerName(e);if(stats[k])stats[k].goals++;});};FIXTURES.forEach(m=>{if(m.a===team)add(m,"goalsA");if(m.b===team)add(m,"goalsB");const mvp=normalizeName(state.matchNotes?.[m.id]?.mvp);if(stats[mvp])stats[mvp].mvps++;});[...R32,...R16,...QF,...SF,...FINALS].forEach(m=>{const a=resolveKoTeam(m,"a"),b=resolveKoTeam(m,"b");if(a===team)add(m,"goalsA");if(b===team)add(m,"goalsB");const mvp=normalizeName(state.matchNotes?.[m.id]?.mvp);if(stats[mvp])stats[mvp].mvps++;});return stats;}
function groupOfTeam(team){for(const [g,arr] of Object.entries(GROUPS)){if(arr.includes(team))return g;}return "-";}
function totalCountryStats(team){const s=teamPlayerStats(team);let goals=0,mvps=0;Object.values(s).forEach(v=>{goals+=v.goals;mvps+=v.mvps;});return {goals,mvps};}
function renderMatchHero(m,label){return `<div class="cardHero" style="background-image:url('${venueImage(m.venue)}')"><div class="heroMeta"><div class="heroVenue">${h(venueShort(m.venue))}</div><div class="heroSub">${h(label)} • ${fmt(m.iso)}</div><div class="heroSub">${h(m.venue)}</div></div></div>`;}
function handleMatchPhoto(id,input){const file=input.files&&input.files[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{setMatchNote(id,"photo",reader.result);if(activePhase==="diary")renderDiary();};reader.readAsDataURL(file);}
function removeMatchPhoto(id){setMatchNote(id,"photo","");if(activePhase==="diary")renderDiary();}

function matchPhotoPreview(id){const photo=getMatchNote(id,"photo");return photo?`<div class="personalPhotoBox albumPhoto"><b>📷 Foto do dia</b><img src="${photo}" alt="Foto pessoal do dia do jogo"><div class="photoButtons"><button onclick="removeMatchPhoto(${id})">Remover foto</button></div></div>`:"";}
function getPersonal(field){state.personal=state.personal||{};return state.personal[field]||"";}
function setPersonal(field,value){state.personal=state.personal||{};state.personal[field]=value;persist();}
function emotionButtons(id){
  const current=getMatchNote(id,'emotion');
  const options=[
    ['feliz','😄','Feliz'],
    ['surpreso','😱','Surpreso'],
    ['triste','😢','Triste'],
    ['empolgado','🔥','Empolgado'],
    ['nervoso','😬','Nervoso']
  ];
  return `<div class="emotionRow">${options.map(([value,emoji,label])=>`<button type="button" class="emotionBtn ${current===value?'active':''}" onclick="setMatchNoteAndRender(${id},'emotion','${value}')"><span>${emoji}</span>${label}</button>`).join("")}</div>`;
}
function emotionLabel(value){
  return ({feliz:'😄 Feliz',surpreso:'😱 Surpreso',triste:'😢 Triste',empolgado:'🔥 Empolgado',nervoso:'😬 Nervoso'})[value] || "";
}
function setMatchNoteAndRender(id,field,value){setMatchNote(id,field,value);render();}
function compactText(value, max=72){
  const txt=String(value||"").replace(/\s+/g," ").trim();
  return txt.length>max ? txt.slice(0,max-1)+"…" : txt;
}
function goalsCompact(notes){
  const a=compactText(notes.goalsA||"",48);
  const b=compactText(notes.goalsB||"",48);
  return [a,b].filter(Boolean).join(" • ");
}


function renderPlayerCard(team,ti,p,i,stats){
  const st=playerStatsForDisplay(team,p,stats);
  return `<details class="playerCard fullPlayerCard ${p.favorite?'favorite':''}">
    <summary>
      <div class="playerTop">
        <div class="playerAvatar"><img src="${playerImage(p,team)}" alt="Foto de ${h(p.name)}"></div>
        <div>
          <div style="font-weight:1000">${p.favorite?'⭐ ':''}${h(p.name||'Jogador')}</div>
          <div class="small">${h(positionLabel(p.pos))}${p.number?` • camisa ${h(p.number)}`:""}${p.age?` • ${h(p.age)} anos`:""}</div>
          <div class="playerStats">
            <span class="badgeStat goal">⚽ ${st.goals||0}</span>
            <span class="badgeStat mvp">⭐ ${st.mvps||0}</span>
            ${p.apiId?`<span class="badgeStat">API ${h(p.apiId)}</span>`:""}
          </div>
        </div>
      </div>
    </summary>
    <img class="playerBigPhoto" src="${playerImage(p,team)}" alt="Foto de ${h(p.name)}">
    <div class="playerFields" style="margin-top:10px">
      <input value="${h(p.name)}" placeholder="Nome do jogador" onchange="setPlayerFieldByIndex(${ti},${i},'name',this.value)">
      <div style="display:grid;grid-template-columns:76px 82px 1fr;gap:6px">
        <input type="number" min="0" max="99" value="${h(p.number||'')}" placeholder="Nº" onchange="setPlayerFieldByIndex(${ti},${i},'number',this.value)">
        <input type="number" min="0" max="60" value="${h(p.age||'')}" placeholder="Idade" onchange="setPlayerFieldByIndex(${ti},${i},'age',this.value)">
        <select onchange="setPlayerFieldByIndex(${ti},${i},'pos',this.value)">
          ${POSITION_OPTIONS.map(pos=>`<option value="${pos}" ${String(p.pos)===pos?'selected':''}>${pos}</option>`).join("")}
        </select>
      </div>
      <div class="playerPhotoActions">
        <label class="small"><b>Foto do jogador</b></label>
        <input type="file" accept="image/*" onchange="handlePlayerPhotoByIndex(${ti},${i},this)">
        <input value="${h(p.cardUrl||'')}" placeholder="Link da imagem/foto API/card" onchange="setPlayerFieldByIndex(${ti},${i},'cardUrl',this.value)">
        <div class="playerButtonLine">
          <button class="btn secondary" type="button" onclick="removePlayerPhoto(${ti},${i})">Remover foto enviada</button>
          <button class="btn secondary" type="button" onclick="togglePlayerFavorite(${ti},${i})">${p.favorite?'Remover favorito':'Marcar favorito'}</button>
          <button class="btn red miniDanger" type="button" onclick="removePlayerByIndex(${ti},${i})">Remover</button>
        </div>
      </div>
      <label class="small"><b>Histórico resumido</b></label>
      <textarea placeholder="Ex.: destaque da seleção, clube, característica, curiosidade..." onchange="setPlayerFieldByIndex(${ti},${i},'history',this.value)">${h(p.history||'')}</textarea>
      <label class="small"><b>Estatísticas / API</b></label>
      <textarea placeholder="Dados vindos da API ou preenchidos manualmente" onchange="setPlayerFieldByIndex(${ti},${i},'apiStats',this.value)">${h(p.apiStats||'')}</textarea>
    </div>
  </details>`;
}
function renderCountryCard(team){
  const ti=allTeams().indexOf(team);
  const totals=totalCountryStats(team);
  const stats=teamPlayerStats(team);
  const grouped=playersByPosition(team);
  const logo=state.apiTeams?.[team]?.logo||"";
  const flag=teamFlag(team);
  const apiId=state.apiTeams?.[team]?.id;
  const count=getPlayers(team).length;
  return `<details class="countryCard squadCountryCard">
    <summary class="countryHead">
      <div>
        <h3>${flag} ${logo?`<img class="teamLogo" src="${logo}" alt="">`:""}${h(team)}</h3>
        <div class="small">Grupo ${h(groupOfTeam(team))}${apiId?" • API ID "+apiId:""} • ${count} jogadores</div>
      </div>
      <div class="countryStatsLine">
        <span class="countryStatBox">👥 ${count}</span>
        <span class="countryStatBox">⚽ ${totals.goals} gols</span>
        <span class="countryStatBox">⭐ ${totals.mvps} MVPs</span>
      </div>
    </summary>
    <div class="countryBody">
      <div class="squadToolbar">
        <button class="btn green" type="button" onclick="goPhase('api');setTimeout(()=>{const s=document.getElementById('apiTeamSelect');if(s){s.value='${h(team)}';}},100)">Atualizar pela API</button>
        <button class="btn secondary" type="button" onclick="addManualPlayer(${ti})">Adicionar jogador</button>
      </div>
      ${POSITION_ORDER.map(group=>grouped[group]?.length?`<section class="positionSection"><h4>${group} <span>${grouped[group].length}</span></h4><div class="playersGrid fullSquadGrid">${grouped[group].map(p=>renderPlayerCard(team,ti,p,p._index,stats)).join("")}</div></section>`:"").join("")}
    </div>
  </details>`;
}
function renderTeams(){
  ensurePlayers();
  document.getElementById("main").innerHTML=`<div class="toolbar"><strong>Seleções e elencos completos</strong><button class="btn secondary" onclick="goPhase('api')">Atualizar pela API</button><button class="btn secondary" onclick="goPhase('grupos')">Voltar aos jogos</button><button class="btn secondary" onclick="exportData()">Exportar backup</button></div><div class="realisticNote"><b>Elenco completo:</b> cada seleção pode ter todos os jogadores retornados pela API. Eles são separados por posição e podem receber foto, histórico, estatísticas e favoritos.</div><div class="playerCountryGrid">${Object.keys(GROUPS).map(g=>`<section class="groupCard"><div class="groupHead"><div class="groupLetter">${g}</div><div><div class="groupTitle">Grupo ${g}</div><div class="small">${h(GROUPS[g].join(" • "))}</div></div></div><div class="groupBody">${GROUPS[g].map(renderCountryCard).join("")}</div></section>`).join("")}</div>`;
}

function resetPlayers(){if(confirm("Resetar todos os jogadores para o modelo padrão?")){state.players={};ensurePlayers();persist();renderTeams();}}
function getDiaryMatchList(){const ko=[...R32,...R16,...QF,...SF,...FINALS].map(m=>({match:m,a:resolveKoTeam(m,'a')||m.a,b:resolveKoTeam(m,'b')||m.b,phase:m.id<=88?'16 avos':m.id<=96?'Oitavas':m.id<=100?'Quartas':m.id<=102?'Semifinais':(m.id===103?'3º lugar':'Final')}));return [...FIXTURES.map(m=>({match:m,a:m.a,b:m.b,phase:`Grupo ${m.group}`})),...ko];}
function stars(value,id){const v=Number(value||0);let out='<div class="ratingRow">';for(let i=1;i<=5;i++){out+=`<button type="button" class="starBtn ${i<=v?'active':''}" onclick="setMatchNote(${id},'rating','${i}')">${i<=v?'★':'☆'}</button>`;}return out+'</div>';}
function diaryPreview(id){const n=state.matchNotes?.[id]||{};const bits=[];if(n.rating)bits.push(`<div><b>Nota do jogo</b>${'★'.repeat(Number(n.rating))}${'☆'.repeat(5-Number(n.rating))}</div>`);if(n.watchedWith)bits.push(`<div><b>Assistiu com</b>${h(n.watchedWith)}</div>`);if(n.favorite)bits.push(`<div><b>O que mais gostou</b>${h(n.favorite)}</div>`);if(n.diary)bits.push(`<div><b>Como foi o jogo</b>${h(n.diary)}</div>`);return bits.length?`<div class="diaryPreview">${bits.join('')}</div>`:'';}
function renderDiaryFields(m){return `<div class="summaryLine"><div class="summaryChip diaryAlbumChip"><b>📔 Diário do espectador</b><div class="diaryFields">
  <div class="field"><label>Nota do jogo</label>${stars(getMatchNote(m.id,'rating'),m.id)}</div>
  <div class="field"><label>Emoção do jogo</label>${emotionButtons(m.id)}</div>
  <div class="field"><label>Assistiu com quem?</label><input value="${h(getMatchNote(m.id,'watchedWith'))}" placeholder="Ex.: pai, mãe, amigos..." onchange="setMatchNote(${m.id},'watchedWith',this.value)"></div>
  <div class="field"><label>Jogador favorito do jogo</label><input value="${h(getMatchNote(m.id,'favoritePlayer'))}" placeholder="Ex.: Vini Jr., Messi, Mbappé..." onchange="setMatchNote(${m.id},'favoritePlayer',this.value)"></div>
  <div class="field"><label>Melhor momento</label><textarea placeholder="Ex.: o gol no final, a defesa do goleiro, a festa da torcida..." onchange="setMatchNote(${m.id},'bestMoment',this.value)">${h(getMatchNote(m.id,'bestMoment'))}</textarea></div>
  <div class="field"><label>Foto do dia do jogo</label><input type="file" accept="image/*" onchange="handleMatchPhoto(${m.id},this)"></div>
  <div class="field"><label>O que ele mais gostou?</label><textarea placeholder="Ex.: o gol de falta, a defesa do goleiro, a torcida..." onchange="setMatchNote(${m.id},'favorite',this.value)">${h(getMatchNote(m.id,'favorite'))}</textarea></div>
  <div class="field"><label>Como foi o jogo?</label><textarea placeholder="Escreva o relato do jogo com as palavras dele..." onchange="setMatchNote(${m.id},'diary',this.value)">${h(getMatchNote(m.id,'diary'))}</textarea></div>
</div></div></div>${matchPhotoPreview(m.id)}${diaryPreview(m.id)}`;}
function renderFavoritesPanel(){
  return `<section class="personalPanel favoritePanel">
    <h2>⭐ Meus favoritos da Copa</h2>
    <p class="small">Essa página vira uma parte especial do livro final.</p>
    <div class="favoriteGrid">
      <div class="field"><label>Meu jogo favorito</label><input value="${h(getPersonal('favoriteMatch'))}" placeholder="Ex.: Brasil x Argentina" onchange="setPersonal('favoriteMatch',this.value)"></div>
      <div class="field"><label>Meu jogador favorito</label><input value="${h(getPersonal('favoritePlayer'))}" placeholder="Ex.: Vini Jr." onchange="setPersonal('favoritePlayer',this.value)"></div>
      <div class="field"><label>Minha seleção favorita</label><input value="${h(getPersonal('favoriteTeam'))}" placeholder="Ex.: Brasil" onchange="setPersonal('favoriteTeam',this.value)"></div>
      <div class="field"><label>Melhor gol</label><input value="${h(getPersonal('bestGoal'))}" placeholder="Ex.: gol de bicicleta..." onchange="setPersonal('bestGoal',this.value)"></div>
      <div class="field"><label>Melhor defesa</label><input value="${h(getPersonal('bestSave'))}" placeholder="Ex.: defesa nos pênaltis..." onchange="setPersonal('bestSave',this.value)"></div>
      <div class="field"><label>Maior surpresa</label><input value="${h(getPersonal('biggestSurprise'))}" placeholder="Ex.: seleção zebra..." onchange="setPersonal('biggestSurprise',this.value)"></div>
      <div class="field wide"><label>Jogo mais emocionante</label><textarea placeholder="Por que esse jogo foi especial?" onchange="setPersonal('mostExciting',this.value)">${h(getPersonal('mostExciting'))}</textarea></div>
      <div class="field wide"><label>Momento mais engraçado / marcante</label><textarea placeholder="Uma lembrança divertida ou marcante da Copa..." onchange="setPersonal('funniestMoment',this.value)">${h(getPersonal('funniestMoment'))}</textarea></div>
    </div>
  </section>`;
}

function renderDiary(){
  const list = getDiaryMatchList();
  const filled = list.filter(item=>{
    const n = state.matchNotes?.[item.match.id] || {};
    return n.diary || n.favorite || n.rating || n.watchedWith || n.photo || n.emotion || n.favoritePlayer || n.bestMoment;
  });

  document.getElementById("main").innerHTML = `
    <div class="personalHero">
      <div>
        <span class="homeEyebrow">Área pessoal</span>
        <h1>Meu Diário da Copa</h1>
        <p>Um espaço para registrar emoções, fotos, favoritos e memórias dos jogos, como um bloco de anotações que virou diário.</p>
      </div>
      <div class="personalHeroStats">
        <div><b>${filled.length}</b><span>memórias</span></div>
        <div><b>${Object.values(state.matchNotes||{}).filter(n=>n&&n.photo).length}</b><span>fotos</span></div>
        <div><b>${Object.values(state.matchNotes||{}).filter(n=>n&&n.rating).length}</b><span>notas</span></div>
        <div><b>${Object.values(state.matchNotes||{}).filter(n=>n&&n.emotion).length}</b><span>emoções</span></div>
      </div>
    </div>

    <section class="personalNavCards">
      <button onclick="document.getElementById('diaryList')?.scrollIntoView({behavior:'smooth',block:'start'})">📔<b>Diário dos jogos</b><small>relatos, emoção e fotos</small></button>
      <button onclick="document.getElementById('favoritesPanel')?.scrollIntoView({behavior:'smooth',block:'start'})">⭐<b>Meus favoritos</b><small>os melhores momentos da Copa</small></button>
      <button onclick="goPhase('report')">📘<b>Livro PDF</b><small>gerar o livro final</small></button>
      <button onclick="exportData()">💾<b>Backup</b><small>salvar o progresso</small></button>
    </section>

    <div id="favoritesPanel">${renderFavoritesPanel()}</div>

    <section class="personalPanel" id="diaryList">
      <div class="sectionHead">
        <div>
          <h2>📔 Diário dos jogos</h2>
          <p class="small">Os cards alternam entre dois estilos para a leitura ficar mais leve e parecer um diário de memórias.</p>
        </div>
        <span class="sectionHint">${filled.length} jogo(s) com memória registrada</span>
      </div>
      <div class="summaryGrid albumDiaryGrid">
        ${list.map(({match,a,b,phase}, index)=>renderDiaryCard(match,a,b,phase,index)).join('')}
      </div>
    </section>
  `;
}

function renderDiaryCard(m,a,b,phase,index=0){
  const n = state.matchNotes?.[m.id] || {};
  const has = n.diary || n.favorite || n.rating || n.watchedWith || n.photo || n.emotion || n.favoritePlayer || n.bestMoment;
  const variant = index % 2 === 0 ? "notepad" : "scrapbook";

  return `<article class="diaryCard albumDiaryCard diaryVariant-${variant} ${has?'filled':''}">
    <div class="diaryCardHero" style="background-image:linear-gradient(180deg,#00000005,#00000090),url('${venueImage(m.venue)}')">
      <div>
        <span>${h(phase)}</span>
        <b>${teamFlag(a)} ${h(a)} x ${teamFlag(b)} ${h(b)}</b>
        <small>${fmt(m.iso)} • ${h(venueShort(m.venue))}</small>
      </div>
    </div>

    <div class="diaryCardInner">
      <div class="matchMemoryChips">
        ${n.rating?`<span>⭐ ${"★".repeat(Number(n.rating))}${"☆".repeat(5-Number(n.rating))}</span>`:""}
        ${n.emotion?`<span>${emotionLabel(n.emotion)}</span>`:""}
        ${n.photo?`<span>📷 Foto</span>`:""}
        ${n.favoritePlayer?`<span>👟 ${h(n.favoritePlayer)}</span>`:""}
        <span>${has?'preenchido':'em branco'}</span>
      </div>
      ${renderDiaryFields(m)}
    </div>
  </article>`;
}

function renderExtras(m, teamA, teamB){return `<div class="detailWrap"><details class="more"><summary>⚽ Gols, MVP e escalações</summary><div class="detailGrid"><div class="field"><label>MVP da partida</label><input value="${h(getMatchNote(m.id,'mvp'))}" placeholder="Ex.: Vinícius Júnior" onchange="setMatchNote(${m.id},'mvp',this.value)"></div></div><div class="summaryLine"><div class="summaryChip"><b>⚽ Gols de ${h(teamA||'Time A')}</b><textarea placeholder="Ex.: Vinícius Júnior 12'&#10;Richarlison 77'" onchange="setMatchNote(${m.id},'goalsA',this.value)">${h(getMatchNote(m.id,'goalsA'))}</textarea></div><div class="summaryChip"><b>⚽ Gols de ${h(teamB||'Time B')}</b><textarea placeholder="Ex.: Mbappé 31'" onchange="setMatchNote(${m.id},'goalsB',this.value)">${h(getMatchNote(m.id,'goalsB'))}</textarea></div></div><div class="lineups"><div class="field"><label>Escalação titular — ${h(teamA||'Time A')}</label><textarea placeholder="${lineupPlaceholder(teamA||'Time A')}" onchange="setLineup(${m.id},'a',this.value)">${h(getLineup(m.id,'a'))}</textarea></div><div class="field"><label>Escalação titular — ${h(teamB||'Time B')}</label><textarea placeholder="${lineupPlaceholder(teamB||'Time B')}" onchange="setLineup(${m.id},'b',this.value)">${h(getLineup(m.id,'b'))}</textarea></div></div></details></div>`;}
function hasScore(s){return s && s.a!=="" && s.b!=="" && s.a!=null && s.b!=null && !Number.isNaN(Number(s.a)) && !Number.isNaN(Number(s.b));}
function fixturesOfGroup(g){return FIXTURES.filter(m=>m.group===g);}
function completedGroupMatches(g){return fixturesOfGroup(g).filter(m=>hasScore(state.groupScores[m.id])).length;}
function groupComplete(g){return completedGroupMatches(g)===6;}
function blank(team,group){return{team,group,p:0,j:0,v:0,e:0,d:0,gp:0,gc:0,sg:0};}
function standings(){
  const tables={};Object.keys(GROUPS).forEach(g=>{tables[g]={};GROUPS[g].forEach(t=>tables[g][t]=blank(t,g));});
  FIXTURES.forEach(m=>{const s=state.groupScores[m.id];if(!hasScore(s))return;const ga=Number(s.a),gb=Number(s.b),A=tables[m.group][m.a],B=tables[m.group][m.b];A.j++;B.j++;A.gp+=ga;A.gc+=gb;B.gp+=gb;B.gc+=ga;if(ga>gb){A.v++;B.d++;A.p+=3;}else if(gb>ga){B.v++;A.d++;B.p+=3;}else{A.e++;B.e++;A.p++;B.p++;}});
  const sorted={};Object.keys(tables).forEach(g=>{Object.values(tables[g]).forEach(r=>r.sg=r.gp-r.gc);sorted[g]=Object.values(tables[g]).sort((x,y)=>y.p-x.p||y.sg-x.sg||y.gp-x.gp||strength(y.team)-strength(x.team)||x.team.localeCompare(y.team));});return sorted;
}
function bestThirds(st, completedOnly=true){return Object.keys(st).filter(g=>!completedOnly||groupComplete(g)).map(g=>st[g][2]).filter(Boolean).sort((x,y)=>y.p-x.p||y.sg-x.sg||y.gp-x.gp||strength(y.team)-strength(x.team)).slice(0,8);}
function assignThirds(thirds){const used=new Set(),out={};[74,77,81,82,79,80,85,87].forEach(mid=>{const pick=thirds.find(t=>THIRD_SLOT_OPTIONS[mid].includes(t.group)&&!used.has(t.group));if(pick){used.add(pick.group);out[mid]=pick;}});return out;}
function r32Context(){const st=standings();const thirds=bestThirds(st,true);return{st,thirds,thirdMap:assignThirds(thirds)};}
function resolveR32Slot(slot, ctx, mid){if(slot==="3")return ctx.thirdMap[mid]?.team || "3º de " + (THIRD_SLOT_OPTIONS[mid]||[]).join("/");const pos=Number(slot[0]),g=slot[1];if(!groupComplete(g))return slot;return ctx.st[g]?.[pos-1]?.team || slot;}
function isRealTeam(t){return Object.prototype.hasOwnProperty.call(BASE,t);}
function matchById(id){return [...R32,...R16,...QF,...SF,...FINALS].find(m=>m.id===Number(id));}
function resolveToken(token){
  if(!token)return "";
  if(token.startsWith("W")||token.startsWith("L")){const wantWinner=token[0]==="W";const id=Number(token.slice(1));const result=getKoResult(id);return wantWinner?result.winner:result.loser;}
  const ctx=r32Context();return resolveR32Slot(token,ctx,0);
}
function resolveKoTeam(match, side){
  const token = match[side];
  if(match.id>=73 && match.id<=88){const ctx=r32Context();return resolveR32Slot(token,ctx,match.id);}
  return resolveToken(token);
}
function getKoResult(id){
  const m=matchById(id);if(!m)return {winner:"",loser:""};
  const a=resolveKoTeam(m,"a"), b=resolveKoTeam(m,"b");const real=isRealTeam(a)&&isRealTeam(b);if(!real)return {winner:"",loser:""};
  const s=state.koScores[id];if(!hasScore(s))return {winner:"",loser:""};
  const ga=Number(s.a),gb=Number(s.b);if(ga>gb)return{winner:a,loser:b};if(gb>ga)return{winner:b,loser:a};
  const choice=state.tieChoices[id];if(choice===a)return{winner:a,loser:b};if(choice===b)return{winner:b,loser:a};return{winner:"",loser:""};
}
function resolvedSlotsInR32(){const ctx=r32Context();let n=0;R32.forEach(m=>{if(isRealTeam(resolveR32Slot(m.a,ctx,m.id)))n++;if(isRealTeam(resolveR32Slot(m.b,ctx,m.id)))n++;});return n;}

/* Integração API-Football / API-Sports */
const API_FOOTBALL_BASE = "https://v3.football.api-sports.io";
const API_KEY_STORAGE = "quem_ganha_copa_api_football_key_local";
let apiLog = [];

const TEAM_TRANSLATIONS = {
  "Mexico": "México",
  "South Africa": "África do Sul",
  "Korea Republic": "Coreia do Sul",
  "South Korea": "Coreia do Sul",
  "Czech Republic": "Tchéquia",
  "Czechia": "Tchéquia",
  "Canada": "Canadá",
  "Bosnia & Herzegovina": "Bósnia e Herzegovina",
  "Bosnia and Herzegovina": "Bósnia e Herzegovina",
  "Qatar": "Catar",
  "Switzerland": "Suíça",
  "Brazil": "Brasil",
  "Morocco": "Marrocos",
  "Haiti": "Haiti",
  "Scotland": "Escócia",
  "USA": "Estados Unidos",
  "United States": "Estados Unidos",
  "United States of America": "Estados Unidos",
  "Paraguay": "Paraguai",
  "Australia": "Austrália",
  "Türkiye": "Turquia",
  "Turkey": "Turquia",
  "Germany": "Alemanha",
  "Curaçao": "Curaçao",
  "Curacao": "Curaçao",
  "Ivory Coast": "Costa do Marfim",
  "Côte d'Ivoire": "Costa do Marfim",
  "Ecuador": "Equador",
  "Netherlands": "Países Baixos",
  "Japan": "Japão",
  "Sweden": "Suécia",
  "Tunisia": "Tunísia",
  "Belgium": "Bélgica",
  "Egypt": "Egito",
  "Iran": "Irã",
  "New Zealand": "Nova Zelândia",
  "Spain": "Espanha",
  "Cape Verde": "Cabo Verde",
  "Saudi Arabia": "Arábia Saudita",
  "Uruguay": "Uruguai",
  "France": "França",
  "Senegal": "Senegal",
  "Iraq": "Iraque",
  "Norway": "Noruega",
  "Argentina": "Argentina",
  "Algeria": "Argélia",
  "Austria": "Áustria",
  "Jordan": "Jordânia",
  "Portugal": "Portugal",
  "Congo DR": "RD Congo",
  "DR Congo": "RD Congo",
  "Uzbekistan": "Uzbequistão",
  "Colombia": "Colômbia",
  "England": "Inglaterra",
  "Croatia": "Croácia",
  "Ghana": "Gana",
  "Panama": "Panamá"
};

function apiLeague(){return Number(localStorage.getItem("quem_ganha_copa_api_league") || 1);}
function apiSeason(){return Number(localStorage.getItem("quem_ganha_copa_api_season") || 2026);}
function apiGetKey(){return localStorage.getItem(API_KEY_STORAGE) || "";}
function apiSetKey(value){localStorage.setItem(API_KEY_STORAGE, String(value || "").trim());}
function apiSetLeagueSeason(league, season){localStorage.setItem("quem_ganha_copa_api_league", Number(league || 1));localStorage.setItem("quem_ganha_copa_api_season", Number(season || 2026));}
function apiAddLog(msg){apiLog.unshift(`[${new Date().toLocaleTimeString("pt-BR")}] ${msg}`);apiLog=apiLog.slice(0,12);const el=document.getElementById("apiLog");if(el)el.innerHTML=apiLog.map(x=>`<div>${h(x)}</div>`).join("");}
function apiStatus(msg, type="info"){const el=document.getElementById("apiStatus");if(el)el.innerHTML=`<div class="notice ${type}">${h(msg)}</div>`;apiAddLog(msg);}
function translateTeamName(name){return TEAM_TRANSLATIONS[String(name || "").trim()] || String(name || "").trim();}
function apiTeamFromLocal(localName){return state.apiTeams?.[localName] || null;}
function apiEnsureState(){state.apiTeams=state.apiTeams||{};state.apiFixtures=state.apiFixtures||{};state.apiFlags=state.apiFlags||{};state.apiMeta=state.apiMeta||{};}

async function apiFetch(endpoint, params={}){
  const key = apiGetKey();
  if(!key) throw new Error("Cole e salve sua API key primeiro.");
  const url = new URL(API_FOOTBALL_BASE + "/" + endpoint.replace(/^\//,""));
  Object.entries(params).forEach(([k,v])=>{if(v!==undefined && v!==null && v!=="")url.searchParams.set(k,v);});
  const response = await fetch(url.toString(), {headers: {"x-apisports-key": key}});
  const data = await response.json().catch(()=>({errors:["Resposta inválida da API"]}));
  if(!response.ok) throw new Error(`Erro HTTP ${response.status}`);
  if(data.errors && ((Array.isArray(data.errors) && data.errors.length) || (!Array.isArray(data.errors) && Object.keys(data.errors).length))){
    throw new Error(typeof data.errors === "string" ? data.errors : JSON.stringify(data.errors));
  }
  return data;
}

async function apiTestConnection(){
  try{
    apiStatus("Testando conexão com a API...");
    const data = await apiFetch("countries");
    apiStatus(`Conexão OK. Países retornados: ${data.results || data.response?.length || 0}.`, "ok");
  }catch(err){apiStatus("Falha no teste: " + err.message, "warn");}
}

async function apiCheckCoverage(){
  try{
    apiStatus("Consultando cobertura da Copa...");
    const data = await apiFetch("leagues", {id: apiLeague(), season: apiSeason()});
    const league = data.response?.[0]?.league;
    const coverage = data.response?.[0]?.seasons?.find(s=>Number(s.year)===apiSeason())?.coverage || data.response?.[0]?.coverage || {};
    state.apiMeta.coverage = coverage;
    state.apiMeta.league = league || {};
    persist();
    apiStatus(`Cobertura carregada para ${league?.name || "World Cup"} ${apiSeason()}.`, "ok");
    renderApi();
  }catch(err){apiStatus("Erro ao consultar cobertura: " + err.message, "warn");}
}

async function apiSyncTeams(){
  try{
    apiEnsureState();
    apiStatus("Baixando seleções da Copa...");
    const data = await apiFetch("teams", {league: apiLeague(), season: apiSeason()});
    let linked = 0;
    (data.response || []).forEach(item=>{
      const apiName = item.team?.name || "";
      const local = translateTeamName(apiName);
      if(allTeams().includes(local)){
        state.apiTeams[local] = {
          id: item.team.id,
          name: apiName,
          localName: local,
          code: item.team.code || "",
          country: item.team.country || "",
          logo: item.team.logo || "",
          founded: item.team.founded || "",
          venue: item.venue || {}
        };
        linked++;
      }
    });
    persist();
    apiStatus(`Seleções sincronizadas: ${linked}/${allTeams().length}.`, "ok");
    renderApi();
  }catch(err){apiStatus("Erro ao baixar seleções: " + err.message, "warn");}
}

function localFixtureByTeams(home, away){
  const a = translateTeamName(home);
  const b = translateTeamName(away);
  return FIXTURES.find(m => (m.a===a && m.b===b) || (m.a===b && m.b===a));
}

async function apiSyncFixtures(){
  try{
    apiEnsureState();
    apiStatus("Baixando jogos e placares da Copa...");
    const data = await apiFetch("fixtures", {league: apiLeague(), season: apiSeason()});
    let linked = 0, scores = 0;
    (data.response || []).forEach(item=>{
      const home = translateTeamName(item.teams?.home?.name);
      const away = translateTeamName(item.teams?.away?.name);
      const local = localFixtureByTeams(home, away);
      if(local){
        state.apiFixtures[local.id] = {
          id: item.fixture.id,
          apiHome: item.teams.home.name,
          apiAway: item.teams.away.name,
          home,
          away,
          date: item.fixture.date,
          status: item.fixture.status,
          venue: item.fixture.venue,
          goals: item.goals,
          score: item.score
        };
        linked++;
        const gh = item.goals?.home;
        const ga = item.goals?.away;
        if(gh !== null && gh !== undefined && ga !== null && ga !== undefined){
          const homeIsLocalA = local.a === home;
          state.groupScores[local.id] = homeIsLocalA ? {a: gh, b: ga} : {a: ga, b: gh};
          scores++;
        }
      }
    });
    persist();
    apiStatus(`Jogos vinculados: ${linked}. Placares atualizados: ${scores}.`, "ok");
    renderApi();
  }catch(err){apiStatus("Erro ao baixar jogos: " + err.message, "warn");}
}

function selectedApiFixtureId(){
  const id = document.getElementById("apiFixtureSelect")?.value;
  return id ? Number(id) : null;
}

async function apiSyncSelectedFixture(){
  try{
    apiEnsureState();
    const localId = selectedApiFixtureId();
    if(!localId) throw new Error("Escolha um jogo.");
    const apiFixture = state.apiFixtures[localId];
    if(!apiFixture?.id) throw new Error("Este jogo ainda não tem fixture_id. Clique primeiro em 'Baixar jogos/placares'.");
    const localMatch = FIXTURES.find(m=>m.id===localId);
    apiStatus(`Baixando escalações, eventos e estatísticas do jogo ${localMatch.a} x ${localMatch.b}...`);

    const [lineups, events, players] = await Promise.all([
      apiFetch("fixtures/lineups", {fixture: apiFixture.id}).catch(e=>({response:[], _error:e.message})),
      apiFetch("fixtures/events", {fixture: apiFixture.id}).catch(e=>({response:[], _error:e.message})),
      apiFetch("fixtures/players", {fixture: apiFixture.id}).catch(e=>({response:[], _error:e.message}))
    ]);

    if(lineups._error) apiAddLog("Lineups indisponíveis: " + lineups._error);
    if(events._error) apiAddLog("Eventos indisponíveis: " + events._error);
    if(players._error) apiAddLog("Estatísticas de jogadores indisponíveis: " + players._error);

    applyLineupsToMatch(localId, localMatch, lineups.response || [], players.response || []);
    applyEventsToMatch(localId, localMatch, events.response || []);
    applyPlayersStatsToTeams(localMatch, players.response || []);

    persist();
    apiStatus("Jogo sincronizado. Confira gols, MVP, escalações e jogadores.", "ok");
    renderApi();
  }catch(err){apiStatus("Erro ao sincronizar jogo: " + err.message, "warn");}
}


function mergePlayersIntoTeam(localTeam, incoming, overwrite=false){
  ensurePlayers();
  const current = overwrite ? [] : getPlayers(localTeam).map(p=>({...p}));
  const byApi = new Map(current.filter(p=>p.apiId).map(p=>[String(p.apiId),p]));
  const byName = new Map(current.map(p=>[normalizeName(p.name),p]));
  incoming.forEach(np=>{
    const keyApi = np.apiId ? String(np.apiId) : "";
    const keyName = normalizeName(np.name);
    let target = (keyApi && byApi.get(keyApi)) || byName.get(keyName);
    if(target){
      Object.assign(target, {...target, ...np, history: np.history || target.history || "", apiStats: np.apiStats || target.apiStats || ""});
    }else{
      current.push(np);
    }
  });
  state.players[localTeam]=current;
}
function applyLineupsToMatch(localId, localMatch, lineups, playerStats){
  state.lineups[localId]=state.lineups[localId]||{};
  lineups.forEach(teamLineup=>{
    const localTeam = translateTeamName(teamLineup.team?.name);
    const side = localTeam === localMatch.a ? "a" : localTeam === localMatch.b ? "b" : null;
    if(!side) return;
    const starters = (teamLineup.startXI || []).map(x=>x.player).filter(Boolean);
    const text = starters.map(p=>`${p.number || ""}. ${p.name || ""} (${p.pos || ""})`).join("\n");
    state.lineups[localId][side] = `${localTeam}${teamLineup.formation ? " - "+teamLineup.formation : ""}\n${text}`.trim();

    if(starters.length){
      const statsForTeam = playerStats.find(t=>translateTeamName(t.team?.name)===localTeam);
      const byName = {};
      (statsForTeam?.players || []).forEach(p=>{byName[normalizeName(p.player?.name)]=p;});
      const incoming = starters.map((p,idx)=>{
        const stat = byName[normalizeName(p.name)];
        return {
          name: p.name || `${localTeam} jogador ${idx+1}`,
          number: p.number || "",
          pos: p.pos || "JOG",
          age: "",
          photo: stat?.player?.photo || "",
          cardUrl: stat?.player?.photo || "",
          history: "",
          apiStats: formatApiPlayerStats(stat),
          apiId: stat?.player?.id || p.id || "",
          favorite:false
        };
      });
      mergePlayersIntoTeam(localTeam, incoming, false);
    }
  });
}

function applyEventsToMatch(localId, localMatch, events){
  state.matchNotes[localId]=state.matchNotes[localId]||{};
  const goalsA=[], goalsB=[];
  events.forEach(ev=>{
    if(ev.type !== "Goal") return;
    const localTeam = translateTeamName(ev.team?.name);
    const line = `${ev.player?.name || "Jogador"} ${ev.time?.elapsed ? ev.time.elapsed+"'" : ""}${ev.detail ? " - "+ev.detail : ""}`.trim();
    if(localTeam === localMatch.a) goalsA.push(line);
    if(localTeam === localMatch.b) goalsB.push(line);
  });
  if(goalsA.length) state.matchNotes[localId].goalsA = goalsA.join("\n");
  if(goalsB.length) state.matchNotes[localId].goalsB = goalsB.join("\n");
}

function applyPlayersStatsToTeams(localMatch, response){
  let best = {rating: -1, name: ""};
  response.forEach(teamBlock=>{
    const localTeam = translateTeamName(teamBlock.team?.name);
    (teamBlock.players || []).forEach(item=>{
      const rating = Number(item.statistics?.[0]?.games?.rating || 0);
      if(rating > best.rating){best = {rating, name: item.player?.name || ""};}
    });
  });
  if(best.name){
    state.matchNotes[localMatch.id]=state.matchNotes[localMatch.id]||{};
    state.matchNotes[localMatch.id].mvp = best.name;
  }
}

function formatApiPlayerStats(item){
  if(!item) return "";
  const s = item.statistics?.[0] || {};
  const bits = [];
  if(s.games?.minutes !== undefined) bits.push(`Minutos: ${s.games.minutes}`);
  if(s.games?.position) bits.push(`Posição: ${s.games.position}`);
  if(s.games?.rating) bits.push(`Nota API: ${s.games.rating}`);
  if(s.goals?.total !== undefined) bits.push(`Gols: ${s.goals.total}`);
  if(s.goals?.assists !== undefined) bits.push(`Assistências: ${s.goals.assists}`);
  if(s.shots?.total !== undefined) bits.push(`Finalizações: ${s.shots.total}`);
  if(s.passes?.total !== undefined) bits.push(`Passes: ${s.passes.total}`);
  if(s.cards?.yellow !== undefined || s.cards?.red !== undefined) bits.push(`Cartões: ${s.cards?.yellow||0}A / ${s.cards?.red||0}V`);
  return bits.join("\n");
}


function apiSleep(ms){return new Promise(resolve=>setTimeout(resolve,ms));}
function mapSquadPlayer(p,idx,localTeam){
  return {
    name: p.name || `${localTeam} jogador ${idx+1}`,
    number: p.number || "",
    pos: p.position || "JOG",
    age: p.age || "",
    photo: p.photo || "",
    cardUrl: p.photo || "",
    history: [p.age?`Idade: ${p.age}`:"", p.position?`Posição: ${p.position}`:""].filter(Boolean).join("\n"),
    apiStats: "",
    apiId: p.id || "",
    favorite:false
  };
}
function mapPlayerStatsItem(item,idx,localTeam){
  return {
    name: item.player?.name || `${localTeam} jogador ${idx+1}`,
    number: item.statistics?.[0]?.games?.number || "",
    pos: item.statistics?.[0]?.games?.position || "JOG",
    age: item.player?.age || "",
    photo: item.player?.photo || "",
    cardUrl: item.player?.photo || "",
    history: [
      item.player?.age ? `Idade: ${item.player.age}` : "",
      item.player?.nationality ? `Nacionalidade: ${item.player.nationality}` : "",
      item.player?.height ? `Altura: ${item.player.height}` : "",
      item.player?.weight ? `Peso: ${item.player.weight}` : ""
    ].filter(Boolean).join("\n"),
    apiStats: formatApiPlayerStats(item),
    apiId: item.player?.id || "",
    favorite:false
  };
}
async function apiFetchSquad(localTeam){
  const apiTeam = apiTeamFromLocal(localTeam);
  if(!apiTeam?.id) throw new Error(`Seleção sem team_id: ${localTeam}`);
  const squadData = await apiFetch("players/squads", {team: apiTeam.id});
  const squad = squadData.response?.[0]?.players || [];
  if(squad.length){
    return squad.map((p,idx)=>mapSquadPlayer(p,idx,localTeam));
  }

  const players = [];
  let page = 1, total = 1;
  do{
    const data = await apiFetch("players", {league: apiLeague(), season: apiSeason(), team: apiTeam.id, page});
    total = data.paging?.total || 1;
    players.push(...(data.response || []));
    page++;
  }while(page <= total && page <= 4);
  return players.map((item,idx)=>mapPlayerStatsItem(item,idx,localTeam));
}
async function apiSyncPlayersForTeam(){
  try{
    apiEnsureState();
    const localTeam = document.getElementById("apiTeamSelect")?.value;
    if(!localTeam) throw new Error("Escolha uma seleção.");
    apiStatus(`Baixando elenco completo de ${localTeam}...`);
    const players = await apiFetchSquad(localTeam);
    if(!players.length) throw new Error("A API não retornou jogadores para esta seleção.");
    mergePlayersIntoTeam(localTeam, players, true);
    persist();
    apiStatus(`Elenco completo atualizado para ${localTeam}: ${state.players[localTeam].length} jogadores.`, "ok");
    renderApi();
  }catch(err){apiStatus("Erro ao baixar elenco: " + err.message, "warn");}
}
async function apiSyncAllSquads(){
  try{
    apiEnsureState();
    apiStatus("Baixando elencos completos de todas as seleções vinculadas. Isso pode demorar...");
    let ok=0, fail=0;
    for(const team of allTeams()){
      const apiTeam = apiTeamFromLocal(team);
      if(!apiTeam?.id){fail++; apiAddLog(`Sem team_id: ${team}`); continue;}
      try{
        apiAddLog(`Elenco: ${team}`);
        const players = await apiFetchSquad(team);
        if(players.length){
          mergePlayersIntoTeam(team, players, true);
          ok++;
          apiAddLog(`${team}: ${players.length} jogadores`);
        }else{
          fail++;
          apiAddLog(`${team}: nenhum jogador retornado`);
        }
        persist();
        await apiSleep(850);
      }catch(e){
        fail++;
        apiAddLog(`${team}: ${e.message}`);
        await apiSleep(850);
      }
    }
    apiStatus(`Elencos finalizados. Sucesso: ${ok}. Falhas/sem dados: ${fail}.`, ok?"ok":"warn");
    renderApi();
  }catch(err){apiStatus("Erro ao baixar todos os elencos: " + err.message, "warn");}
}
async function apiSyncFlags(){
  try{
    apiEnsureState();
    apiStatus("Baixando bandeiras dos países...");
    const data = await apiFetch("countries");
    let linked=0;
    (data.response || []).forEach(item=>{
      const local = translateTeamName(item.name);
      if(allTeams().includes(local) && item.flag){
        state.apiFlags[local]={flag:item.flag, code:item.code||"", name:item.name||local};
        linked++;
      }
    });
    // Alguns nomes vêm do campo country da seleção
    Object.entries(state.apiTeams||{}).forEach(([local,info])=>{
      if(state.apiFlags[local])return;
      const byCountry=(data.response||[]).find(item=>translateTeamName(item.name)===translateTeamName(info.country));
      if(byCountry?.flag){state.apiFlags[local]={flag:byCountry.flag, code:byCountry.code||"", name:byCountry.name||local};linked++;}
    });
    persist();
    apiStatus(`Bandeiras vinculadas: ${linked}.`, "ok");
    renderApi();
  }catch(err){apiStatus("Erro ao baixar bandeiras: " + err.message, "warn");}
}

function renderApiTeamSummary(){
  const linked = Object.keys(state.apiTeams||{}).length;
  const fixtures = Object.keys(state.apiFixtures||{}).length;
  const squads = Object.values(state.players||{}).filter(arr=>Array.isArray(arr)&&arr.length>11).length;
  const flags = Object.keys(state.apiFlags||{}).length;
  return `<div class="apiSummary">
    <div><b>${linked}</b><span>seleções vinculadas</span></div>
    <div><b>${flags}</b><span>bandeiras</span></div>
    <div><b>${squads}</b><span>elencos completos</span></div>
    <div><b>${fixtures}</b><span>jogos vinculados</span></div>
    <div><b>${apiLeague()}</b><span>league</span></div>
    <div><b>${apiSeason()}</b><span>season</span></div>
  </div>`;
}

function renderApi(){
  apiEnsureState();
  const key = apiGetKey();
  const teamsOptions = allTeams().map(t=>`<option value="${h(t)}">${h(t)}${state.apiTeams?.[t]?.id ? " • ID "+state.apiTeams[t].id : ""}</option>`).join("");
  const fixturesOptions = FIXTURES.map(m=>`<option value="${m.id}">${String(m.id).padStart(2,"0")} • ${h(m.a)} x ${h(m.b)}${state.apiFixtures?.[m.id]?.id ? " • API "+state.apiFixtures[m.id].id : ""}</option>`).join("");

  document.getElementById("main").innerHTML = `
    <div class="toolbar">
      <strong>API-Football</strong>
      <button class="btn secondary" onclick="goPhase('teams')">Ver seleções</button>
      <button class="btn secondary" onclick="goPhase('grupos')">Ver jogos</button>
      <button class="btn secondary" onclick="exportData()">Exportar backup</button>
    </div>

    <div class="notice info">
      Esta área busca dados da API-Football / API-Sports. A chave fica salva só neste navegador, separada do backup.
    </div>

    <section class="apiPanel">
      <h2>Configuração</h2>
      <div class="apiGrid">
        <div class="field"><label>API key</label><input id="apiKeyInput" type="password" value="${h(key)}" placeholder="Cole sua API key aqui"></div>
        <div class="field"><label>League ID</label><input id="apiLeagueInput" type="number" value="${apiLeague()}"></div>
        <div class="field"><label>Season</label><input id="apiSeasonInput" type="number" value="${apiSeason()}"></div>
      </div>
      <div class="apiActions">
        <button class="btn green" onclick="apiSetKey(document.getElementById('apiKeyInput').value);apiSetLeagueSeason(document.getElementById('apiLeagueInput').value,document.getElementById('apiSeasonInput').value);apiStatus('Configuração salva neste navegador.','ok');renderApi();">Salvar configuração</button>
        <button class="btn secondary" onclick="apiTestConnection()">Testar conexão</button>
        <button class="btn secondary" onclick="apiCheckCoverage()">Ver cobertura</button>
      </div>
      ${renderApiTeamSummary()}
    </section>

    <section class="apiPanel">
      <h2>Preencher o app</h2>
      <div class="apiActions">
        <button class="btn green" onclick="apiSyncTeams()">Baixar seleções/logos</button>
        <button class="btn green" onclick="apiSyncFlags()">Baixar bandeiras</button>
        <button class="btn green" onclick="apiSyncFixtures()">Baixar jogos/placares</button>
        <button class="btn green" onclick="apiSyncAllSquads()">Baixar todos os elencos</button>
      </div>

      <div class="apiGrid two">
        <div>
          <div class="field"><label>Baixar elenco completo de uma seleção</label><select id="apiTeamSelect">${teamsOptions}</select></div>
          <button class="btn secondary" onclick="apiSyncPlayersForTeam()">Atualizar elenco da seleção</button>
        </div>
        <div>
          <div class="field"><label>Baixar escalações, gols e estatísticas de um jogo</label><select id="apiFixtureSelect">${fixturesOptions}</select></div>
          <button class="btn secondary" onclick="apiSyncSelectedFixture()">Sincronizar jogo selecionado</button>
        </div>
      </div>
    </section>

    <section id="apiStatus"></section>
    <section class="apiPanel"><h2>Histórico da sincronização</h2><div id="apiLog" class="apiLog">${apiLog.map(x=>`<div>${h(x)}</div>`).join("")}</div></section>

    <section class="apiPanel">
      <h2>Observações</h2>
      <p class="small">Para a Copa 2026, a API-Football usa normalmente <b>league=1</b> e <b>season=2026</b>. Dados como escalações, eventos e estatísticas de jogadores só aparecem quando estiverem disponíveis na API para cada partida.</p>
      <p class="small">Fotos de jogadores e bandeiras vindas da API entram na área Seleções. O elenco completo pode ter 23, 26 ou mais jogadores, conforme o que a API retornar.</p>
    </section>
  `;
}

function phaseUnlock(id){
  if(id==="r32")return resolvedSlotsInR32()>0;
  if(id==="r16")return R32.some(m=>!!getKoResult(m.id).winner);
  if(id==="qf")return R16.some(m=>!!getKoResult(m.id).winner);
  if(id==="sf")return QF.some(m=>!!getKoResult(m.id).winner);
  if(id==="finals")return SF.some(m=>!!getKoResult(m.id).winner);
  return true;
}
function activePhaseObj(){return PHASES.find(p=>p.id===activePhase)||PHASES[0];}
function setGroupScore(id,side,value){
  const next=value===""?"":Number(value);
  state.groupScores[id]=state.groupScores[id]||{};
  if(state.groupScores[id][side]===next)return;
  state.groupScores[id][side]=next;
  clearDependentKo();
  persist();
  render();
}
function setKoScore(id,side,value){
  const next=value===""?"":Number(value);
  state.koScores[id]=state.koScores[id]||{};
  if(state.koScores[id][side]===next)return;
  state.koScores[id][side]=next;
  delete state.tieChoices[id];
  clearNextAfter(id);
  persist();
  render();
}
function setTieChoice(id,team){state.tieChoices[id]=team;clearNextAfter(id);persist();render();}
function clearDependentKo(){state.koScores={};state.tieChoices={};Object.keys(state.officials||{}).forEach(k=>{if(Number(k)>=73)delete state.officials[k];});Object.keys(state.lineups||{}).forEach(k=>{if(Number(k)>=73)delete state.lineups[k];});Object.keys(state.matchNotes||{}).forEach(k=>{if(Number(k)>=73)delete state.matchNotes[k];});}
function clearNextAfter(id){const idn=Number(id);const dependents={73:[90],74:[89],75:[90],76:[91],77:[89],78:[91],79:[92],80:[92],81:[94],82:[94],83:[93],84:[93],85:[96],86:[95],87:[96],88:[95],89:[97],90:[97],91:[99],92:[99],93:[98],94:[98],95:[100],96:[100],97:[101],98:[101],99:[102],100:[102],101:[103,104],102:[103,104]};
  const queue=[...(dependents[idn]||[])];const seen=new Set();while(queue.length){const x=queue.shift();if(seen.has(x))continue;seen.add(x);delete state.koScores[x];delete state.tieChoices[x];if(state.officials)delete state.officials[x];if(state.lineups)delete state.lineups[x];if(state.matchNotes)delete state.matchNotes[x];(dependents[x]||[]).forEach(y=>queue.push(y));}
}
function toggleGroup(g){openGroups.has(g)?openGroups.delete(g):openGroups.add(g);persist();renderGroups();}

function allGroupMatchesFilled(){
  return Object.values(state.groupScores||{}).filter(hasScore).length;
}
function diaryFilledCount(){
  return Object.values(state.matchNotes||{}).filter(n=>n && (n.diary||n.favorite||n.rating||n.watchedWith||n.photo)).length;
}
function personalPhotoCount(){
  return Object.values(state.matchNotes||{}).filter(n=>n && n.photo).length;
}
function mvpCount(){
  return Object.values(state.matchNotes||{}).filter(n=>n && n.mvp).length;
}
function todayNextMatch(){
  const now = new Date();
  return FIXTURES.find(m=>!hasScore(state.groupScores[m.id]) && new Date(m.iso) >= now) || FIXTURES.find(m=>!hasScore(state.groupScores[m.id])) || FIXTURES[0];
}
function homeLastFilledMatches(){
  return FIXTURES
    .filter(m=>hasScore(state.groupScores[m.id]) || reportHasText(state.matchNotes?.[m.id]?.diary) || reportHasText(state.matchNotes?.[m.id]?.favorite) || state.matchNotes?.[m.id]?.photo)
    .slice(-4)
    .reverse();
}
function progressPercent(){
  return Math.round((allGroupMatchesFilled()/72)*100);
}
function renderHomeMatchMini(m){
  const s=state.groupScores[m.id]||{};
  const n=state.matchNotes?.[m.id]||{};
  const score=hasScore(s)?`${s.a} x ${s.b}`:"a registrar";
  return `<article class="homeMiniMatch" onclick="goPhase('grupos');openGroups.add('${m.group}');render();setTimeout(()=>document.getElementById('grupo-${m.group}')?.scrollIntoView({behavior:'smooth',block:'start'}),80)">
    <div class="miniStadium" style="background-image:linear-gradient(180deg,#00000010,#00000095),url('${venueImage(m.venue)}')"></div>
    <div class="miniBody">
      <b>${teamFlag(m.a)} ${h(m.a)} <span>${h(score)}</span> ${teamFlag(m.b)} ${h(m.b)}</b>
      <small>Grupo ${m.group} • ${fmt(m.iso)}</small>
      ${n.mvp?`<small>⭐ MVP: ${h(n.mvp)}</small>`:""}
    </div>
  </article>`;
}
function renderHome(){
  const next=todayNextMatch();
  const last=homeLastFilledMatches();
  const pct=progressPercent();
  document.getElementById("main").innerHTML=`
    <section class="homeCover">
      <div class="homeCoverText">
        <div class="homeEyebrow">Álbum digital • Copa 2026</div>
        <h1>Minha Primeira Copa do Mundo</h1>
        <p>Um livro vivo para registrar placares, jogadores, fotos e as memórias dos jogos assistidos em família.</p>
        <div class="homeActions">
          <button class="btn green" onclick="goPhase('grupos')">Registrar jogos</button>
          <button class="btn secondary" onclick="goPhase('diary')">Escrever diário</button>
          <button class="btn secondary" onclick="goPhase('report')">Ver livro PDF</button>
        </div>
      </div>
      <div class="homeNextCard">
        <div class="homeNextImage" style="background-image:linear-gradient(180deg,#00000010,#00000095),url('${venueImage(next.venue)}')"></div>
        <div class="homeNextContent">
          <div class="small">Próximo jogo para registrar</div>
          <h2>${teamFlag(next.a)} ${h(next.a)} <span>x</span> ${teamFlag(next.b)} ${h(next.b)}</h2>
          <p>Grupo ${next.group} • ${fmt(next.iso)}</p>
          <p>${h(next.venue)}</p>
          <button class="btn primary" onclick="goPhase('grupos');openGroups.add('${next.group}');render();setTimeout(()=>document.getElementById('grupo-${next.group}')?.scrollIntoView({behavior:'smooth',block:'start'}),80)">Abrir Grupo ${next.group}</button>
        </div>
      </div>
    </section>

    <section class="homeDashboard">
      <div class="homeStatCard"><span>${allGroupMatchesFilled()}</span><b>jogos com placar</b><small>de 72 na fase de grupos</small></div>
      <div class="homeStatCard"><span>${diaryFilledCount()}</span><b>diários escritos</b><small>memórias registradas</small></div>
      <div class="homeStatCard"><span>${personalPhotoCount()}</span><b>fotos pessoais</b><small>dias de jogo</small></div>
      <div class="homeStatCard"><span>${mvpCount()}</span><b>MVPs marcados</b><small>melhores da partida</small></div>
    </section>

    <section class="homeProgressPanel">
      <div class="homeProgressHeader"><b>Progresso do livro</b><span>${pct}%</span></div>
      <div class="homeProgress"><span style="width:${pct}%"></span></div>
      <p class="small">O livro vai ficando completo conforme vocês registram placares, gols, MVPs, fotos e diário.</p>
    </section>

    <section class="homeMainGrid">
      <div class="homePanel">
        <h2>Atalhos</h2>
        <div class="homeShortcutGrid">
          <button onclick="goPhase('grupos')">⚽<b>Jogos</b><small>placares, gols e MVP</small></button>
          <button onclick="goPhase('teams')">🌎<b>Seleções</b><small>jogadores e estatísticas</small></button>
          <button onclick="goPhase('diary')">📔<b>Área pessoal</b><small>diário e fotos</small></button>
          <button onclick="goPhase('report')">📘<b>Livro PDF</b><small>gerar lembrança final</small></button><button onclick="goPhase('scrapbook')">✂️<b>Scrapbook</b><small>guia para o livro final</small></button>
        </div>
      </div>
      <div class="homePanel">
        <h2>Últimos registros</h2>
        <div class="homeMiniList">${last.length?last.map(renderHomeMatchMini).join(""):`<div class="homeEmpty">Nenhum jogo registrado ainda. Comece pela aba <b>Jogos</b>.</div>`}</div>
      </div>
    </section>
  `;
}

function renderStats(){const filled=Object.values(state.groupScores).filter(hasScore).length;const completed=Object.keys(GROUPS).filter(groupComplete).length;const qualified=Object.keys(GROUPS).filter(groupComplete).length*2 + bestThirds(standings(),true).length;const unlocked=PHASES.filter(p=>p.unlock()).at(-1)?.label || "Fase de grupos";const diaryCount=Object.values(state.matchNotes||{}).filter(n=>n && (n.diary||n.favorite||n.rating||n.watchedWith)).length;document.getElementById("stats").innerHTML=`
  <div class="stat"><div class="label">Jogos da fase A</div><div class="value">${filled}/72</div><div class="hint">placares preenchidos</div></div>
  <div class="stat"><div class="label">Grupos fechados</div><div class="value">${completed}/12</div><div class="hint">abre vagas no mata-mata</div></div>
  <div class="stat"><div class="label">Classificados visíveis</div><div class="value">${Math.min(32,qualified)}/32</div><div class="hint">inclui melhores terceiros parciais</div></div>
  <div class="stat"><div class="label">Diários escritos</div><div class="value">${diaryCount}</div><div class="hint">memórias dos jogos</div></div>
  <div class="stat"><div class="label">Última fase liberada</div><div class="value" style="font-size:22px">${h(unlocked)}</div><div class="hint">conforme os resultados</div></div>`;}
function renderPhasebar(){document.getElementById("phasebar").innerHTML=PHASES.map(p=>{const open=p.unlock();const active=p.id===activePhase;return `<button class="phaseBtn ${active?'active':''} ${open?'':'locked'}" onclick="goPhase('${p.id}')" ${open?'':'disabled'}>${open?'':'🔒 '}${p.label}<small>${p.short}</small></button>`;}).join("");}
function goPhase(id){const p=PHASES.find(x=>x.id===id);if(!p||!p.unlock())return;activePhase=id;render();window.scrollTo({top:0,behavior:'smooth'});}

let faseMataAtual = "r32";

const FASES_MATA = {
  r32: { titulo: "16 avos de final", resumo: "32 seleções", jogos: () => R32 },
  r16: { titulo: "Oitavas de final", resumo: "16 seleções", jogos: () => typeof R16 !== "undefined" ? R16 : [] },
  qf: { titulo: "Quartas de final", resumo: "8 seleções", jogos: () => typeof QF !== "undefined" ? QF : [] },
  sf: { titulo: "Semifinais", resumo: "4 seleções", jogos: () => typeof SF !== "undefined" ? SF : [] },
  finals: { titulo: "Final e 3º lugar", resumo: "decisão", jogos: () => typeof FINALS !== "undefined" ? FINALS : [] }
};

function grupoCompleto(grupo) {
  return jogosDoGrupo(grupo).every(jogo => temPlacar(jogo.id));
}

function grupoDaSelecao(selecao) {
  for (const [grupo, selecoes] of Object.entries(GROUPS)) {
    if (selecoes.includes(selecao)) return grupo;
  }
  return "";
}

function melhoresTerceiros() {
  return Object.keys(GROUPS)
    .filter(grupoCompleto)
    .map(grupo => calcularTabela(grupo)[2])
    .filter(Boolean)
    .sort((a, b) =>
      b.pontos - a.pontos ||
      b.sg - a.sg ||
      b.gp - a.gp ||
      forca(b.selecao) - forca(a.selecao)
    )
    .slice(0, 8)
    .map(linha => ({ grupo: grupoDaSelecao(linha.selecao), selecao: linha.selecao, linha }));
}

function mapaTerceiros() {
  const terceiros = melhoresTerceiros();
  const usados = new Set();
  const mapa = {};
  const ordem = [74, 77, 81, 82, 79, 80, 85, 87];

  for (const id of ordem) {
    const opcoes = (typeof THIRD_SLOT_OPTIONS !== "undefined" && THIRD_SLOT_OPTIONS[id]) || [];
    const escolhido = terceiros.find(t => opcoes.includes(t.grupo) && !usados.has(t.grupo));
    if (escolhido) {
      usados.add(escolhido.grupo);
      mapa[id] = escolhido.selecao;
    }
  }

  return mapa;
}

function traduzirSlotMata(slot, matchId = null) {
  if (!slot) return "";
  if (slot === "3") {
    const opcoes = matchId && typeof THIRD_SLOT_OPTIONS !== "undefined" ? THIRD_SLOT_OPTIONS[matchId] : null;
    return opcoes ? `3º colocado dos grupos ${opcoes.join("/")}` : "Melhor 3º colocado";
  }
  if (/^[12][A-L]$/.test(slot)) {
    const posicao = slot[0] === "1" ? "1º" : "2º";
    return `${posicao} do Grupo ${slot[1]}`;
  }
  if (/^W\d+/.test(slot)) return `Vencedor do M${slot.slice(1)}`;
  if (/^L\d+/.test(slot)) return `Perdedor do M${slot.slice(1)}`;
  return slot;
}

function resolverSlotR32(slot, matchId) {
  if (slot === "3") {
    const mapa = mapaTerceiros();
    return mapa[matchId] || traduzirSlotMata(slot, matchId);
  }

  if (/^[12][A-L]$/.test(slot)) {
    const posicao = Number(slot[0]);
    const grupo = slot[1];

    if (!grupoCompleto(grupo)) return traduzirSlotMata(slot, matchId);

    const tabela = calcularTabela(grupo);
    return tabela[posicao - 1]?.selecao || traduzirSlotMata(slot, matchId);
  }

  return traduzirSlotMata(slot, matchId);
}

function todosJogosMata() {
  return [
    ...R32,
    ...(typeof R16 !== "undefined" ? R16 : []),
    ...(typeof QF !== "undefined" ? QF : []),
    ...(typeof SF !== "undefined" ? SF : []),
    ...(typeof FINALS !== "undefined" ? FINALS : [])
  ];
}

function jogoMataPorId(id) {
  return todosJogosMata().find(jogo => Number(jogo.id) === Number(id));
}

function ehSelecaoReal(nome) {
  return todasSelecoes().includes(nome);
}

function resolverTokenMata(token) {
  if (!token) return "";
  if (token.startsWith("W")) {
    const id = token.slice(1);
    return resultadoMata(id).vencedor || `Vencedor do M${id}`;
  }
  if (token.startsWith("L")) {
    const id = token.slice(1);
    return resultadoMata(id).perdedor || `Perdedor do M${id}`;
  }
  return token;
}

function resolverTimeMata(jogo, lado) {
  const token = jogo[lado];

  if (jogo.id >= 73 && jogo.id <= 88) {
    return resolverSlotR32(token, jogo.id);
  }

  return resolverTokenMata(token);
}

function resultadoMata(id) {
  const jogo = jogoMataPorId(id);
  if (!jogo) return { vencedor: "", perdedor: "" };

  const a = resolverTimeMata(jogo, "a");
  const b = resolverTimeMata(jogo, "b");

  if (!ehSelecaoReal(a) || !ehSelecaoReal(b)) return { vencedor: "", perdedor: "" };

  const p = estado.placaresMata[id];
  if (!p || p.a === "" || p.b === "" || p.a == null || p.b == null) return { vencedor: "", perdedor: "" };

  const ga = Number(p.a);
  const gb = Number(p.b);

  if (ga > gb) return { vencedor: a, perdedor: b };
  if (gb > ga) return { vencedor: b, perdedor: a };

  const escolha = estado.escolhasMata[id];
  if (escolha === a) return { vencedor: a, perdedor: b };
  if (escolha === b) return { vencedor: b, perdedor: a };

  return { vencedor: "", perdedor: "" };
}

function atualizarPlacarMata(jogoId, lado, valor) {
  estado.placaresMata[jogoId] = estado.placaresMata[jogoId] || {};
  estado.placaresMata[jogoId][lado] = valor === "" ? "" : Number(valor);
  delete estado.escolhasMata[jogoId];
  salvarEstado();
  render();
}

function escolherVencedorPenaltis(jogoId, selecao) {
  estado.escolhasMata[jogoId] = selecao;
  salvarEstado();
  render();
}

function mudarFaseMata(fase) {
  faseMataAtual = fase;
  renderMataMata();
}

function cardMata(jogo, faseId) {
  const a = resolverTimeMata(jogo, "a");
  const b = resolverTimeMata(jogo, "b");
  const real = ehSelecaoReal(a) && ehSelecaoReal(b);
  const p = estado.placaresMata[jogo.id] || {};
  const resultado = resultadoMata(jogo.id);
  const empate = real && p.a !== "" && p.b !== "" && p.a != null && p.b != null && Number(p.a) === Number(p.b) && !resultado.vencedor;
  const label = jogo.label || `M${jogo.id}`;

  return `
    <article class="knockout-card">
      <div class="knockout-code">${escapar(label)} • ${escapar(FASES_MATA[faseId].titulo)}</div>
      <div class="small">${jogo.iso ? dataBR(jogo.iso) : ""}</div>
      <div class="small">${escapar(jogo.venue || "")}</div>

      <div class="knockout-versus">
        <span class="${ehSelecaoReal(a) ? "" : "slot-muted"}">${escapar(a)}</span>
        <span> x </span>
        <span class="${ehSelecaoReal(b) ? "" : "slot-muted"}">${escapar(b)}</span>
      </div>

      <div class="original-slot">
        Cruzamento-base: ${escapar(traduzirSlotMata(jogo.a, jogo.id))} x ${escapar(traduzirSlotMata(jogo.b, jogo.id))}
      </div>

      <div class="knockout-score">
        <strong class="team-a">${escapar(a)}</strong>
        <input type="number" min="0" ${real ? "" : "disabled"} value="${p.a ?? ""}" oninput="atualizarPlacarMata(${jogo.id}, 'a', this.value)">
        <strong>x</strong>
        <input type="number" min="0" ${real ? "" : "disabled"} value="${p.b ?? ""}" oninput="atualizarPlacarMata(${jogo.id}, 'b', this.value)">
        <strong>${escapar(b)}</strong>
      </div>

      ${empate ? `
        <div class="penalty-choice">
          <strong>Empate no mata-mata. Quem passou nos pênaltis?</strong><br>
          <button onclick="escolherVencedorPenaltis(${jogo.id}, '${escapar(a)}')">${escapar(a)}</button>
          <button onclick="escolherVencedorPenaltis(${jogo.id}, '${escapar(b)}')">${escapar(b)}</button>
        </div>
      ` : ""}

      ${resultado.vencedor ? `<div class="winner-line">✅ Avança: ${escapar(resultado.vencedor)}</div>` : ""}
    </article>
  `;
}

function renderMataMata() {
  const fase = FASES_MATA[faseMataAtual] || FASES_MATA.r32;
  const jogos = fase.jogos();

  document.getElementById("app").innerHTML = `
    <section class="panel">
      <h2>Mata-mata</h2>
      <p class="small">Todas as fases ficam liberadas desde o início. Primeiro aparece o cruzamento-base; depois o app troca pelas seleções conforme você preenche grupos e placares.</p>

      <div class="knockout-tabs">
        ${Object.entries(FASES_MATA).map(([id, info]) => `
          <button class="${id === faseMataAtual ? "active" : ""}" onclick="mudarFaseMata('${id}')">
            ${escapar(info.titulo)}
            <br><span class="small">${escapar(info.resumo)}</span>
          </button>
        `).join("")}
      </div>

      <div class="bracket-note">
        Exemplo: se aparecer “1º do Grupo C”, é porque o Grupo C ainda não foi concluído. Quando os 6 jogos forem preenchidos, o nome da seleção entra automaticamente.
      </div>
    </section>

    <section class="knockout-grid">
      ${jogos.length ? jogos.map(jogo => cardMata(jogo, faseMataAtual)).join("") : `
        <article class="knockout-card">
          <strong>Fase ainda sem dados no arquivo.</strong>
          <p class="small">Podemos incluir os cruzamentos completos desta fase no dados-copa.js.</p>
        </article>
      `}
    </section>
  `;
}



/* Relatório final para impressão / PDF */
const TEAM_FLAGS = {
  "México":"🇲🇽","África do Sul":"🇿🇦","Coreia do Sul":"🇰🇷","Tchéquia":"🇨🇿",
  "Canadá":"🇨🇦","Bósnia e Herzegovina":"🇧🇦","Catar":"🇶🇦","Suíça":"🇨🇭",
  "Brasil":"🇧🇷","Marrocos":"🇲🇦","Haiti":"🇭🇹","Escócia":"🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  "Estados Unidos":"🇺🇸","Paraguai":"🇵🇾","Austrália":"🇦🇺","Turquia":"🇹🇷",
  "Alemanha":"🇩🇪","Curaçao":"🇨🇼","Costa do Marfim":"🇨🇮","Equador":"🇪🇨",
  "Países Baixos":"🇳🇱","Japão":"🇯🇵","Suécia":"🇸🇪","Tunísia":"🇹🇳",
  "Bélgica":"🇧🇪","Egito":"🇪🇬","Irã":"🇮🇷","Nova Zelândia":"🇳🇿",
  "Espanha":"🇪🇸","Cabo Verde":"🇨🇻","Arábia Saudita":"🇸🇦","Uruguai":"🇺🇾",
  "França":"🇫🇷","Senegal":"🇸🇳","Iraque":"🇮🇶","Noruega":"🇳🇴",
  "Argentina":"🇦🇷","Argélia":"🇩🇿","Áustria":"🇦🇹","Jordânia":"🇯🇴",
  "Portugal":"🇵🇹","RD Congo":"🇨🇩","Uzbequistão":"🇺🇿","Colômbia":"🇨🇴",
  "Inglaterra":"🏴󠁧󠁢󠁥󠁮󠁧󠁿","Croácia":"🇭🇷","Gana":"🇬🇭","Panamá":"🇵🇦"
};

function teamFlag(team){const flag=state.apiFlags?.[team]?.flag;if(flag)return `<img class="inlineFlag" src="${flag}" alt="${h(team)}">`;return TEAM_FLAGS[team] || "🏳️";}
function reportHasText(x){return String(x||"").trim().length>0;}
function reportHasScore(s){return s && s.a!=="" && s.b!=="" && s.a!=null && s.b!=null;}
function reportTeamLogo(team){return state.apiTeams?.[team]?.logo || "";}
function reportMatchNotes(id){return state.matchNotes?.[id] || {};}
function reportLineups(id){return state.lineups?.[id] || {};}
function reportGroupScore(m){const s=state.groupScores[m.id];return reportHasScore(s)?`${m.a} ${s.a} x ${s.b} ${m.b}`:"";}
function reportKoScore(m){const s=state.koScores[m.id];const a=resolveKoTeam(m,"a"),b=resolveKoTeam(m,"b");return reportHasScore(s)?`${a} ${s.a} x ${s.b} ${b}`:"";}
function reportAnyMatchFilled(m,isKo=false){
  const notes=reportMatchNotes(m.id);
  const lines=reportLineups(m.id);
  const s=isKo?state.koScores[m.id]:state.groupScores[m.id];
  return reportHasScore(s)||Object.values(notes||{}).some(reportHasText)||Object.values(lines||{}).some(reportHasText);
}


function reportHasDiaryContent(notes){
  return !!(notes && (notes.diary||notes.favorite||notes.rating||notes.watchedWith||notes.photo||notes.emotion||notes.favoritePlayer||notes.bestMoment));
}
function reportHasDiaryPhoto(notes){
  return !!(notes && notes.photo && reportHasDiaryContent(notes));
}
function reportMatchCardWeight(m,isKo=false){
  const notes=reportMatchNotes(m.id);
  const score=isKo?state.koScores[m.id]:state.groupScores[m.id];
  if(reportHasDiaryPhoto(notes)) return 0;
  if(reportHasDiaryContent(notes)) return 1;
  if(reportHasScore(score) && (notes.goalsA||notes.goalsB||notes.mvp)) return 2;
  return 3;
}
function reportMatchCard(m,isKo=false,phaseLabel=""){
  const a=isKo?resolveKoTeam(m,"a"):m.a;
  const b=isKo?resolveKoTeam(m,"b"):m.b;
  const score=isKo?reportKoScore(m):reportGroupScore(m);
  const notes=reportMatchNotes(m.id);
  const goalsA=notes.goalsA||"";
  const goalsB=notes.goalsB||"";
  const mvp=notes.mvp||"";
  const diary=notes.diary||"";
  const favorite=notes.favorite||"";
  const watchedWith=notes.watchedWith||"";
  const rating=notes.rating||"";
  const emotion=notes.emotion||"";
  const favoritePlayer=notes.favoritePlayer||"";
  const bestMoment=notes.bestMoment||"";
  const photo=notes.photo||"";
  const hasDiary=reportHasDiaryContent(notes);
  const hasDiaryPhoto=reportHasDiaryPhoto(notes);
  const cardCls=hasDiaryPhoto?"photoDiaryCard":(hasDiary?"diaryCard":"plainCard");
  const parts=[];

  parts.push(`<div class="matchStadiumHero" style="background-image:linear-gradient(180deg,#00000020,#00000090),url('${venueImage(m.venue)}')">
    <div class="heroPhase">${h(phaseLabel)}</div>
    <div class="heroTeams">${teamFlag(a)} ${h(a)} <span>x</span> ${teamFlag(b)} ${h(b)}</div>
    <div class="heroMeta">${m.iso?fmt(m.iso):""}${m.venue?` • ${h(m.venue)}`:""}</div>
  </div>`);

  if(score) parts.push(`<div class="reportScore">${h(score)}</div>`);
  if(mvp) parts.push(`<div class="reportBadgeLine"><b>MVP:</b> ${h(mvp)}</div>`);

  if(goalsA || goalsB){
    parts.push(`<div class="goalsGrid">
      ${goalsA?`<div class="reportTextBlock"><b>Gols de ${h(a)}</b>\n${h(goalsA)}</div>`:""}
      ${goalsB?`<div class="reportTextBlock"><b>Gols de ${h(b)}</b>\n${h(goalsB)}</div>`:""}
    </div>`);
  }

  if(hasDiaryPhoto){
    parts.push(`<img class="reportDiaryPhoto simpleMatchPhoto featuredDiaryPhoto" src="${photo}" alt="Foto do dia do jogo">`);
  }

  if(hasDiary){
    parts.push(`<div class="reportTextBlock diaryBlock"><b>Diário do jogo</b>${rating?`\nNota: ${"★".repeat(Number(rating))}${"☆".repeat(5-Number(rating))}`:""}${emotion?`\nEmoção: ${h(emotionLabel(emotion))}`:""}${watchedWith?`\nAssistiu com: ${h(watchedWith)}`:""}${favoritePlayer?`\nJogador favorito: ${h(favoritePlayer)}`:""}${bestMoment?`\nMelhor momento: ${h(bestMoment)}`:""}${favorite?`\nO que mais gostou: ${h(favorite)}`:""}${diary?`\nRelato: ${h(diary)}`:""}</div>`);
  }

  if(photo && !hasDiaryPhoto){
    parts.push(`<img class="reportDiaryPhoto simpleMatchPhoto" src="${photo}" alt="Foto do dia do jogo">`);
  }

  return `<article class="reportCard simpleMatchCard ${cardCls}">
    ${parts.join("")}
  </article>`;
}

function reportGroupsSection(){
  const st=standings();
  const groups=Object.keys(GROUPS).filter(g=>FIXTURES.some(m=>m.group===g && reportAnyMatchFilled(m,false)));
  if(!groups.length)return "";
  return `<section class="reportSection simpleGroups"><h2>Grupos e tabelas</h2><div class="reportGrid simpleGroupsGrid">${groups.map(g=>`<div class="reportCard simpleGroupCard"><h3>Grupo ${g}</h3><table class="reportTable"><thead><tr><th>Seleção</th><th>P</th><th>J</th><th>SG</th><th>GP</th></tr></thead><tbody>${st[g].map((r,i)=>`<tr><td>${i+1}. ${teamFlag(r.team)} ${h(r.team)}</td><td>${r.p}</td><td>${r.j}</td><td>${r.sg}</td><td>${r.gp}</td></tr>`).join("")}</tbody></table></div>`).join("")}</div></section>`;
}

function reportMatchPhaseSection(title,matches,isKo=false,labelFn=null){
  const cards=matches
    .filter(m=>reportAnyMatchFilled(m,isKo))
    .sort((a,b)=>reportMatchCardWeight(a,isKo)-reportMatchCardWeight(b,isKo))
    .map(m=>reportMatchCard(m,isKo,labelFn?labelFn(m):(isKo?(m.label||`M${m.id}`):`Grupo ${m.group}`)));
  if(!cards.length)return "";
  return `<section class="reportSection simplePhase"><h2>${h(title)}</h2><div class="reportGrid simpleMatchesGrid">${cards.join("")}</div></section>`;
}
function reportMatchesSection(){
  return [
    reportMatchPhaseSection("Jogos preenchidos — Fase de grupos",FIXTURES,false,m=>`Grupo ${m.group}`),
    reportMatchPhaseSection("Mata-mata — 16 avos",R32,true,m=>m.label||`M${m.id}`),
    reportMatchPhaseSection("Mata-mata — Oitavas",R16,true,m=>m.label||`M${m.id}`),
    reportMatchPhaseSection("Mata-mata — Quartas",QF,true,m=>m.label||`M${m.id}`),
    reportMatchPhaseSection("Mata-mata — Semifinais",SF,true,m=>m.label||`M${m.id}`),
    reportMatchPhaseSection("Final e 3º lugar",FINALS,true,m=>m.label||`M${m.id}`)
  ].filter(Boolean).join("");
}
function reportDiarySection(){return "";}
function reportFinalistTeams(){
  const set=new Set(["Brasil"]);
  const finalMatch=FINALS.find(m=>m.id===104) || FINALS[0];
  if(finalMatch){
    const a=resolveKoTeam(finalMatch,"a");
    const b=resolveKoTeam(finalMatch,"b");
    if(a && !/^Vencedor|^Perdedor|^A definir|^Melhor/.test(a))set.add(a);
    if(b && !/^Vencedor|^Perdedor|^A definir|^Melhor/.test(b))set.add(b);
  }
  return [...set].filter(Boolean);
}
function reportLatestLineupForTeam(team){
  const all=[...FIXTURES,...R32,...R16,...QF,...SF,...FINALS];
  let found=null;
  all.forEach(m=>{
    const isKo=m.id>=73;
    const a=isKo?resolveKoTeam(m,"a"):m.a;
    const b=isKo?resolveKoTeam(m,"b"):m.b;
    const lines=reportLineups(m.id);
    if(a===team && lines.a)found={match:m,side:"a",text:lines.a,opponent:b};
    if(b===team && lines.b)found={match:m,side:"b",text:lines.b,opponent:a};
  });
  return found;
}

function reportLineupsSection(){
  const teams=reportFinalistTeams();
  const cards=teams.map(team=>{
    const item=reportLatestLineupForTeam(team);
    if(!item)return "";
    return `<div class="reportCard simpleLineupCard"><h3>${teamFlag(team)} ${h(team)}</h3><div class="reportMeta">Escalação registrada contra ${h(item.opponent)}</div><div class="reportTextBlock">${h(item.text)}</div></div>`;
  }).filter(Boolean).join("");
  if(!cards)return "";
  return `<section class="reportSection simpleLineups"><h2>Escalações em destaque</h2><p class="reportMeta">Somente Brasil e seleções finalistas.</p><div class="reportGrid">${cards}</div></section>`;
}
function reportResolvedTeamsFromMatches(matches){
  const set=new Set();
  matches.forEach(m=>{
    const a=resolveKoTeam(m,"a"), b=resolveKoTeam(m,"b");
    if(isRealTeam(a))set.add(a);
    if(isRealTeam(b))set.add(b);
  });
  return set;
}

function reportFeaturedTeams(){
  return reportFinalistTeams();
}
function reportTeamPlayersSection(){
  ensurePlayers();
  const teams=reportFeaturedTeams();
  if(!teams.length)return "";
  return `<section class="reportSection"><h2>Jogadores em destaque: Brasil e finalistas</h2>${teams.map(team=>reportTeamBlock(team)).join("")}</section>`;
}
function reportTeamBlock(team){
  const logo=reportTeamLogo(team);
  const stats=teamPlayerStats(team);
  const players=(getPlayers(team)||[]).filter(p=>p && (p.name||p.photo||p.cardUrl||p.history||p.apiStats));
  if(!players.length)return "";
  return `<div class="reportCard" style="margin-bottom:14px"><div class="reportTeamHeader"><span class="reportFlag">${teamFlag(team)}</span>${logo?`<img class="reportTeamLogo" src="${logo}" alt="">`:""}<div><h3>${h(team)}</h3><div class="reportMeta">Grupo ${h(groupOfTeam(team))}</div></div></div><div class="reportPlayers">${players.map(p=>{const st=stats[normalizeName(p.name)]||{goals:0,mvps:0};return `<div class="reportPlayer"><img src="${playerImage(p,team)}" alt="Foto de ${h(p.name)}"><b>${h(p.name||"Jogador")}</b><div class="small">${h(p.pos||"")} • camisa ${h(p.number||"")}</div>${(st.goals||st.mvps)?`<div class="small">⚽ ${st.goals||0} • ⭐ ${st.mvps||0}</div>`:""}${p.history?`<div class="reportTextBlock">${h(p.history)}</div>`:""}${p.apiStats?`<div class="reportTextBlock">${h(p.apiStats)}</div>`:""}</div>`;}).join("")}</div></div>`;
}

function reportFavoritesSection(){
  const p=state.personal||{};
  const entries=[
    ["Meu jogo favorito",p.favoriteMatch],
    ["Meu jogador favorito",p.favoritePlayer],
    ["Minha seleção favorita",p.favoriteTeam],
    ["Melhor gol",p.bestGoal],
    ["Melhor defesa",p.bestSave],
    ["Maior surpresa",p.biggestSurprise],
    ["Jogo mais emocionante",p.mostExciting],
    ["Momento mais engraçado / marcante",p.funniestMoment]
  ].filter(x=>reportHasText(x[1]));
  if(!entries.length)return "";
  return `<section class="reportSection"><h2>Favoritos da Copa</h2><div class="reportGrid">${entries.map(([label,value])=>`<div class="reportCard"><h3>${h(label)}</h3><div class="reportTextBlock">${h(value)}</div></div>`).join("")}</div></section>`;
}

function reportSummary(){
  const filledGroups=Object.keys(GROUPS).filter(g=>FIXTURES.some(m=>m.group===g&&reportAnyMatchFilled(m,false))).length;
  const filledMatches=FIXTURES.filter(m=>reportAnyMatchFilled(m,false)).length + [...R32,...R16,...QF,...SF,...FINALS].filter(m=>reportAnyMatchFilled(m,true)).length;
  const diaryCount=FIXTURES.concat(R32,R16,QF,SF,FINALS).filter(m=>{const n=reportMatchNotes(m.id);return n.diary||n.favorite||n.rating||n.watchedWith||n.photo||n.emotion||n.favoritePlayer||n.bestMoment;}).length;
  return `<div class="reportGrid"><div class="reportCard"><h3>${filledGroups}</h3><div class="reportMeta">grupos com preenchimento</div></div><div class="reportCard"><h3>${filledMatches}</h3><div class="reportMeta">jogos preenchidos</div></div><div class="reportCard"><h3>${diaryCount}</h3><div class="reportMeta">entradas de diário/fotos</div></div></div>`;
}



function trophyImage(){
  return "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 180"><defs><linearGradient id="g" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#FDE68A"/><stop offset="1" stop-color="#D97706"/></linearGradient></defs><rect width="140" height="180" rx="24" fill="#FFF7ED"/><path d="M45 28h50v18c0 18-10 34-25 42-15-8-25-24-25-42V28Z" fill="url(#g)"/><path d="M95 34h20c0 18-5 30-18 34" fill="none" stroke="#D97706" stroke-width="8" stroke-linecap="round"/><path d="M45 34H25c0 18 5 30 18 34" fill="none" stroke="#D97706" stroke-width="8" stroke-linecap="round"/><rect x="60" y="90" width="20" height="24" rx="6" fill="#F59E0B"/><rect x="44" y="112" width="52" height="14" rx="7" fill="#B45309"/><rect x="34" y="130" width="72" height="20" rx="10" fill="#7C2D12"/><text x="70" y="164" font-family="Arial" font-size="12" text-anchor="middle" fill="#FFF">WORLD CUP</text></svg>`);
}
function simpleBracketMatch(m,label=""){
  const a=resolveKoTeam(m,"a");
  const b=resolveKoTeam(m,"b");
  const s=state.koScores?.[m.id]||{};
  const result=getKoResult(m.id)||{winner:"",loser:""};
  const scoreA=(s.a!=="" && s.a!=null)?s.a:"–";
  const scoreB=(s.b!=="" && s.b!=null)?s.b:"–";
  return `<div class="simpleBracketMatch">
    <div class="simpleBracketLabel">${h(label||m.label||`M${m.id}`)}</div>
    <div class="simpleBracketRow ${result.winner===a?'winner':''}"><span>${teamFlag(a)} ${h(a)}</span><b>${scoreA}</b></div>
    <div class="simpleBracketRow ${result.winner===b?'winner':''}"><span>${teamFlag(b)} ${h(b)}</span><b>${scoreB}</b></div>
  </div>`;
}
function simpleBracketRound(title,matches){
  return `<div class="simpleBracketRound"><h3>${h(title)}</h3>${matches.map(m=>simpleBracketMatch(m,m.label||`M${m.id}`)).join("")}</div>`;
}
function reportBracketSection(){
  const anyKoData=[...R32,...R16,...QF,...SF,...FINALS].some(m=>reportAnyMatchFilled(m,true));
  if(!anyKoData)return "";
  const finalMatch=FINALS.find(m=>m.id===104)||FINALS[0];
  const thirdPlace=FINALS.find(m=>m.id!==104);
  const champion=getKoResult(104).winner||"";
  return `<section class="reportSection simpleBracketPage">
    <div class="simpleBracketHeader">
      <div>
        <h2>Chaveamento final</h2>
        <p>Resumo simples do mata-mata com o caminho até a decisão.</p>
      </div>
      <div class="simpleTrophyBox"><img src="${trophyImage()}" alt="Taça"><span>${champion?`Campeão: ${teamFlag(champion)} ${h(champion)}`:"Taça da Copa"}</span></div>
    </div>
    <div class="simpleBracketRounds">
      ${simpleBracketRound("16 avos",R32)}
      ${simpleBracketRound("Oitavas",R16)}
      ${simpleBracketRound("Quartas",QF)}
      ${simpleBracketRound("Semifinais",SF)}
      ${simpleBracketRound("Final", finalMatch?[finalMatch]:[])}
    </div>
    ${thirdPlace?`<div class="simpleThirdPlaceWrap"><h3>3º lugar</h3>${simpleBracketMatch(thirdPlace,"3º lugar")}</div>`:""}
  </section>`;
}
function defaultScrapbookNotes(){
  return `OBJETIVO DO LIVRO
Criar um livro final em estilo scrapbook/álbum de memórias da Copa 2026, usando os dados registrados no app.

ESTILO VISUAL DESEJADO
- Scrapbook esportivo, bonito e afetivo.
- Visual de álbum de memórias, com fotos coladas, fitas adesivas, adesivos, rabiscos e papéis sobrepostos.
- Não deve parecer infantil demais; deve ser divertido, mas organizado e legível.
- Usar elementos de futebol: bola, chuteira, luva de goleiro, apito, camisa, taça, bandeiras, estrelas e setas.
- Usar silhuetas de jogadores, goleiros, estádios e monumentos/cidades onde os jogos aconteceram.
- Dar destaque maior às fotos pessoais e ao diário do que às estatísticas.

ORGANIZAÇÃO DO LIVRO
1. Capa: Minha Primeira Copa do Mundo 2026.
2. Página de abertura com texto emocional.
3. Sumário visual.
4. Fase de grupos.
5. Jogos assistidos e registrados.
6. Brasil na Copa.
7. Diário e fotos dos jogos.
8. Jogadores favoritos.
9. Escalações do Brasil e finalistas.
10. Chaveamento horizontal do mata-mata.
11. Grande final.
12. Página final de lembranças.

MATERIAL QUE ENVIAREI DEPOIS
- Backup final exportado pelo app.
- PDF simples gerado pelo app.
- Fotos dos dias de jogo.
- Fotos da criança/família assistindo aos jogos.
- Fotos dos jogadores importantes.
- Fotos dos estádios.
- Observações finais sobre momentos favoritos.

PRIORIDADES
- Fotos pessoais devem ser grandes e emocionais.
- Jogos com diário devem ter mais destaque.
- Jogos apenas com placar podem aparecer menores.
- Brasil, semifinal/final e jogo favorito devem ter páginas especiais.
- O livro final deve parecer uma lembrança para guardar por muitos anos.`;
}
function getScrapbookNotes(){state.personal=state.personal||{};return state.personal.scrapbookNotes || defaultScrapbookNotes();}
function setScrapbookNotes(value){state.personal=state.personal||{};state.personal.scrapbookNotes=value;persist();}
function scrapbookChecklistText(){
  return `PASTA PARA ENVIAR DEPOIS:

Livro-Copa-2026/
├── dados-do-app/
│   ├── backup-copa-2026-final.json
│   └── livro-copa-2026-base.pdf
├── fotos-dos-jogos/
├── fotos-do-dia/
├── jogadores/
│   ├── brasil/
│   ├── finalista-1/
│   └── finalista-2/
├── estadios/
└── observacoes-scrapbook.txt

COMO GERAR:
1. No app, clique em Exportar backup.
2. No app, abra Livro PDF e salve o PDF simples.
3. Separe as melhores fotos em pastas.
4. Mantenha nomes fáceis de entender, por exemplo:
   - brasil-x-franca-final-familia.jpg
   - jogo-brasil-01-pipoca.jpg
   - vini-jr.jpg
   - estadio-metlife.jpg
5. Compacte tudo em ZIP e envie para edição do scrapbook.`;
}
function downloadScrapbookGuide(){
  const text = `GUIA PARA MONTAR O SCRAPBOOK FINAL DA COPA 2026

${scrapbookChecklistText()}

----------------------------------------
OBSERVAÇÕES E ESTILO DO SCRAPBOOK
----------------------------------------

${getScrapbookNotes()}
`;
  const blob = new Blob([text], {type:"text/plain;charset=utf-8"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "observacoes-scrapbook-copa-2026.txt";
  a.click();
  URL.revokeObjectURL(a.href);
}
function renderScrapbookGuide(){
  document.getElementById("main").innerHTML = `
    <section class="scrapbookGuideHero">
      <div>
        <span class="homeEyebrow">Depois da Copa</span>
        <h1>Preparar Scrapbook Final</h1>
        <p>Esta área guarda as instruções para transformar os dados do app em um livro final estilo scrapbook depois que a Copa terminar.</p>
      </div>
      <div class="scrapbookHeroCard">
        <b>Fluxo ideal</b>
        <span>App simples → PDF base → ZIP organizado → Livro scrapbook</span>
      </div>
    </section>

    <section class="scrapbookGuideGrid">
      <article class="scrapbookGuideCard">
        <h2>1. O que enviar depois</h2>
        <div class="scrapbookFolderBox"><pre>${h(scrapbookChecklistText())}</pre></div>
      </article>

      <article class="scrapbookGuideCard">
        <h2>2. Como deverá ser o livro</h2>
        <p class="small">Edite este texto durante ou depois da Copa. Ele será salvo no app e pode ser baixado junto com as instruções.</p>
        <textarea class="scrapbookNotes" onchange="setScrapbookNotes(this.value)">${h(getScrapbookNotes())}</textarea>
      </article>
    </section>

    <section class="scrapbookGuideCard">
      <h2>3. Ações importantes</h2>
      <div class="scrapbookActions">
        <button class="btn green" onclick="exportData()">Exportar backup do app</button>
        <button class="btn secondary" onclick="goPhase('report')">Abrir Livro PDF simples</button>
        <button class="btn secondary" onclick="downloadScrapbookGuide()">Baixar guia do scrapbook</button>
      </div>
      <div class="scrapbookTip">
        <b>Importante:</b> o app deve continuar simples e confiável para registrar tudo. O visual scrapbook será feito depois, usando o backup, o PDF base e as fotos separadas.
      </div>
    </section>
  `;
}


function renderReport(){
  const content=[
    reportGroupsSection(),
    reportMatchesSection(),
    reportFavoritesSection(),
    reportLineupsSection(),
    reportTeamPlayersSection(),
    reportBracketSection()
  ].filter(Boolean).join("");
  document.getElementById("main").innerHTML=`<div class="reportWrap simplePrintReport"><header class="reportHeader"><div><h1>Livro da Copa 2026</h1><p>Versão simples para impressão. Gerado em ${new Date().toLocaleDateString("pt-BR")}.</p></div><div class="reportActions"><button class="btn green" onclick="window.print()">Imprimir / Salvar PDF</button><button class="btn secondary" onclick="exportData()">Exportar backup</button><button class="btn secondary" onclick="goPhase('grupos')">Voltar ao app</button></div></header>${content||`<div class="reportEmpty">Ainda não há conteúdo preenchido para imprimir.</div>`}</div>`;
}

function renderLocalMobileTools(){
  const existing=document.getElementById("localMobileTools");
  if(existing)return;
  const div=document.createElement("div");
  div.id="localMobileTools";
  div.className="localMobileTools";
  div.innerHTML=`
    <button onclick="goPhase('grupos')">⚽ Jogos</button>
    <button onclick="goPhase('diary')">📔 Diário</button>
    <button onclick="persist()">💾 Salvar</button>
    <button onclick="exportData()">⬇️ Backup</button>
    <button onclick="testarSalvamentoLocal()">🧪 Teste</button>
  `;
  const status=document.getElementById("localSaveStatus");
  if(status && status.parentNode) status.parentNode.insertBefore(div, status.nextSibling);
  else document.body.insertBefore(div, document.body.firstChild);
}

function render(){renderLocalMobileTools();renderStats();renderPhasebar();if(!activePhaseObj().unlock())activePhase="grupos";if(activePhase==="home")renderHome();else if(activePhase==="grupos")renderGroups();else if(activePhase==="teams")renderTeams();else if(activePhase==="diary")renderDiary();else if(activePhase==="api")renderApi();else if(activePhase==="report")renderReport();else if(activePhase==="scrapbook")renderScrapbookGuide();else renderKo(activePhaseObj());}
function renderGroups(){const st=standings();document.getElementById("main").innerHTML=`
  <div class="toolbar"><strong>Jogos da Copa</strong><button class="btn secondary" onclick="openAllGroups()">Abrir todos</button><button class="btn secondary" onclick="closeAllGroups()">Fechar todos</button><button class="btn secondary" onclick="exportData()">Exportar</button><button class="btn secondary" onclick="importData()">Importar</button><button class="btn green" onclick="goPhase('report')">Gerar livro PDF</button></div>
  <div class="notice info">Abra os grupos e registre cada jogo como uma página do álbum: placar, gols, MVP, escalações e detalhes da experiência.</div>
  <div class="groupList">${Object.keys(GROUPS).map(g=>groupCard(g,st[g])).join("")}</div>`;}
function groupCard(g,rows){const complete=groupComplete(g);const progress=completedGroupMatches(g);const open=openGroups.has(g);const teams=GROUPS[g].join(" • ");return `<section class="groupCard" id="grupo-${g}">
  <div class="groupHead" onclick="toggleGroup('${g}')"><div class="groupLetter">${g}</div><div><div class="groupTitle">Grupo ${g}</div><div class="small">${h(teams)}</div><div class="progressLine"><span style="width:${Math.round(progress/6*100)}%"></span></div></div><div class="status"><span class="pill ${complete?'green':'blue'}">${complete?'concluído':'em andamento'} ${progress}/6</span><span class="pill">${open?'▲ aberto':'▼ abrir'}</span></div></div>
  <div class="groupBody ${open?'':'hidden'}"><div class="groupInside"><div class="matchGrid">${fixturesOfGroup(g).map(renderGroupMatch).join("")}</div>${renderMiniTable(g,rows)}</div></div>
</section>`;}
function renderGroupMatch(m){
  const s=state.groupScores[m.id]||{};
  const pr=prob(m.a,m.b);
  const notes=state.matchNotes?.[m.id]||{};
  const has=hasScore(s);
  const status=has?"registrado":"aguardando";
  const scoreA=has?s.a:"";
  const scoreB=has?s.b:"";
  return `<article class="match gameCard ${has?'filled':''}">
    <div class="gameHero" style="background-image:linear-gradient(180deg,#00000005,#00000088),url('${venueImage(m.venue)}')">
      <div class="gameHeroTop">
        <span>Grupo ${m.group}</span>
        <span>Jogo ${String(m.id).padStart(2,"0")}</span>
      </div>
      <div class="gameHeroBottom">
        <b>${h(venueShort(m.venue))}</b>
        <small>${fmt(m.iso)} • ${h(m.venue)}</small>
      </div>
    </div>

    <div class="gameBody">
      <div class="gameTeams">
        <div class="gameTeam left"><span class="flagBig">${teamFlag(m.a)}</span><b>${h(m.a)}</b></div>
        <div class="gameScoreBox">
          <input class="score" type="number" min="0" value="${scoreA}" onchange="setGroupScore(${m.id},'a',this.value)" aria-label="Gols de ${h(m.a)}">
          <span>x</span>
          <input class="score" type="number" min="0" value="${scoreB}" onchange="setGroupScore(${m.id},'b',this.value)" aria-label="Gols de ${h(m.b)}">
        </div>
        <div class="gameTeam right"><span class="flagBig">${teamFlag(m.b)}</span><b>${h(m.b)}</b></div>
      </div>

      <div class="gameInfoLine">
        <span class="${has?'okTag':'waitTag'}">${has?'✅ Placar registrado':'🕒 Aguardando jogo'}</span>
        ${notes.mvp?`<span>⭐ MVP: ${h(notes.mvp)}</span>`:""}
        ${notes.rating?`<span>📔 ${"★".repeat(Number(notes.rating))}${"☆".repeat(5-Number(notes.rating))}</span>`:""}
        ${notes.photo?`<span>📷 Foto</span>`:""}
        ${notes.emotion?`<span>${emotionLabel(notes.emotion)}</span>`:""}
      </div>

      ${(notes.goalsA||notes.goalsB||notes.favoritePlayer||notes.bestMoment)?`<div class="gameMemorySummary">
        ${goalsCompact(notes)?`<div><b>Gols:</b> ${h(goalsCompact(notes))}</div>`:""}
        ${notes.favoritePlayer?`<div><b>Jogador favorito:</b> ${h(notes.favoritePlayer)}</div>`:""}
        ${notes.bestMoment?`<div><b>Melhor momento:</b> ${h(compactText(notes.bestMoment,90))}</div>`:""}
      </div>`:""}

      <div class="prob cinematicProb">
        <div><b>${pr.pa}%</b>${h(m.a)}${bar(pr.pa,"#16a34a")}</div>
        <div><b>${pr.pd}%</b>Empate${bar(pr.pd,"#f59e0b")}</div>
        <div><b>${pr.pb}%</b>${h(m.b)}${bar(pr.pb,"#2563eb")}</div>
      </div>

      ${renderExtras(m,m.a,m.b)}
    </div>
  </article>`;
}

function renderMiniTable(g,rows){const complete=groupComplete(g);return `<aside><div class="tableBox"><table><thead><tr><th>Seleção</th><th>P</th><th>J</th><th>SG</th><th>GP</th></tr></thead><tbody>${rows.map((r,i)=>`<tr class="${i<2?'rowDirect':i===2?'rowThird':''}"><td class="teamCell">${i+1}. ${h(r.team)}</td><td><b>${r.p}</b></td><td>${r.j}</td><td>${r.sg}</td><td>${r.gp}</td></tr>`).join("")}</tbody></table></div><div class="classBlock">${complete?`<div class="qualified">✅ 1º: ${h(rows[0].team)}</div><div class="qualified">✅ 2º: ${h(rows[1].team)}</div><div class="qualified third">⭐ 3º: ${h(rows[2].team)} entra na briga dos melhores terceiros</div>`:`<div class="qualified lock">🔒 Classificados aparecem quando os 6 jogos do grupo forem preenchidos.</div>`}</div></aside>`;}
function renderKo(phase){const matches=phase.matches;const subtitle=phase.id==="r32"?"Cruzamento-base liberado desde o início. Conforme os grupos forem concluídos, os nomes das seleções aparecem nos lugares corretos.":"Esta fase já mostra o caminho por vencedores dos jogos anteriores. Quando os placares forem preenchidos, os vencedores sobem automaticamente.";document.getElementById("main").innerHTML=`<div class="toolbar"><strong>${h(phase.title)}</strong><button class="btn secondary" onclick="goPhase('grupos')">Voltar aos grupos</button><button class="btn secondary" onclick="exportData()">Exportar</button></div><div class="notice ${phase.id==='r32'?'info':'ok'}">${subtitle}</div>${phase.id==='r32'?renderThirdsBox():''}<div class="koGrid">${matches.map(m=>renderKoMatch(m,phase)).join("")}</div>`;}
function renderThirdsBox(){const thirds=bestThirds(standings(),true);return `<h2 class="sectionTitle">Melhores terceiros já considerados</h2><div class="thirdGrid">${thirds.length?thirds.map((t,i)=>`<div class="rankItem"><div><b>#${i+1} ${h(t.team)}</b><div class="small">Grupo ${t.group} • ${t.p} pts • SG ${t.sg} • GP ${t.gp}</div></div><div style="font-size:26px;font-weight:1000">${t.p}</div></div>`).join(""):`<div class="notice">Nenhum grupo completo ainda.</div>`}</div>`;}
function renderKoMatch(m,phase){const a=resolveKoTeam(m,"a"),b=resolveKoTeam(m,"b");const real=isRealTeam(a)&&isRealTeam(b);const s=state.koScores[m.id]||{};const result=getKoResult(m.id);const tied=real&&hasScore(s)&&Number(s.a)===Number(s.b)&&!result.winner;const pr=real?prob(a,b):null;const label=m.label||`M${m.id}`;return `<article class="koCard">${renderMatchHero(m,`${label} • ${phase.short}`)}<div class="versus"><span class="${isRealTeam(a)?'':'placeholder'}">${h(a||m.a)}</span><span style="color:#94a3b8">x</span><span class="${isRealTeam(b)?'':'placeholder'}">${h(b||m.b)}</span></div><div class="teams"><div class="teamName teamA">${h(a||'-')}</div><input class="score" type="number" min="0" ${real?'':'disabled'} value="${s.a ?? ''}" onchange="setKoScore(${m.id},'a',this.value)"><div style="font-weight:1000;color:#94a3b8">x</div><input class="score" type="number" min="0" ${real?'':'disabled'} value="${s.b ?? ''}" onchange="setKoScore(${m.id},'b',this.value)"><div class="teamName teamB">${h(b||'-')}</div></div>${pr?`<div class="prob" style="grid-template-columns:1fr 1fr"><div><b>${pr.qa}%</b>${h(a)} passa${bar(pr.qa,"#16a34a")}</div><div><b>${pr.qb}%</b>${h(b)} passa${bar(pr.qb,"#2563eb")}</div></div>`:`<div class="small">A probabilidade aparece quando os dois times forem definidos.</div>`}${tied?`<div class="notice">Empate no mata-mata. Escolha quem passou nos pênaltis:</div><div class="choice"><button onclick="setTieChoice(${m.id},'${h(a)}')">Passou ${h(a)}</button><button onclick="setTieChoice(${m.id},'${h(b)}')">Passou ${h(b)}</button></div>`:''}${renderExtras(m,a||m.a,b||m.b)}${result.winner?`<div class="winnerBox">✅ Avança: ${h(result.winner)}</div>`:''}</article>`;}
function openAllGroups(){Object.keys(GROUPS).forEach(g=>openGroups.add(g));persist();renderGroups();}
function closeAllGroups(){openGroups.clear();persist();renderGroups();}
function fillFunGroups(){if(!confirm("Preencher jogos em branco da fase de grupos com placares aleatórios para brincar?"))return;FIXTURES.forEach(m=>{if(!hasScore(state.groupScores[m.id])){const pr=prob(m.a,m.b);let ga=Math.max(0,Math.round((strength(m.a)-65)/20+Math.random()*2.5));let gb=Math.max(0,Math.round((strength(m.b)-65)/20+Math.random()*2.5));const r=Math.random()*100;if(r<pr.pa&&ga<=gb)ga=gb+1;else if(r>100-pr.pb&&gb<=ga)gb=ga+1;state.groupScores[m.id]={a:ga,b:gb};}});clearDependentKo();persist();render();}
function clearAll(){if(confirm("Limpar todos os placares e escolhas?")){state=defaultState();openGroups=new Set(["A"]);persist();activePhase="grupos";render();}}
function clearKoFromPhase(id){const phase=PHASES.find(p=>p.id===id);if(!phase||!confirm("Limpar esta fase e todas as fases seguintes?"))return;const phaseOrder={r32:73,r16:89,qf:97,sf:101,finals:103};const min=phaseOrder[id]||73;Object.keys(state.koScores).forEach(k=>{if(Number(k)>=min)delete state.koScores[k];});Object.keys(state.tieChoices).forEach(k=>{if(Number(k)>=min)delete state.tieChoices[k];});Object.keys(state.officials||{}).forEach(k=>{if(Number(k)>=min)delete state.officials[k];});Object.keys(state.lineups||{}).forEach(k=>{if(Number(k)>=min)delete state.lineups[k];});Object.keys(state.matchNotes||{}).forEach(k=>{if(Number(k)>=min)delete state.matchNotes[k];});persist();render();}
function exportData(){const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="backup-completo-copa-2026-diario-fotos.json";a.click();URL.revokeObjectURL(a.href);updateLocalSaveStatus("⬇️ Backup completo baixado");}
function importData(){document.getElementById("fileInput").click();}
document.getElementById("fileInput").addEventListener("change",e=>{const file=e.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{try{state={...defaultState(),...JSON.parse(reader.result)};ensurePlayers();openGroups=new Set(state.openGroups||["A"]);persist();render();alert("Dados importados!");}catch(err){alert("Não consegui importar esse arquivo.");}};reader.readAsText(file);e.target.value="";});
bootApp();