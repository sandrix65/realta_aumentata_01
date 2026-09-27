import * as THREE from '../vendor/three.module.min.js';
import { poseFromCorners } from './pose.js';
import { costruisci } from './contenuto.js';

const CFG = window.SALA_CONFIG;
const $ = id => document.getElementById(id);
const parametri = new URLSearchParams(location.search);
const mioPosto = parametri.get('p') || '';
const idDispositivo = 'p-' + Math.random().toString(36).slice(2, 10);
const topic = k => `sala-ar/${CFG.stanza}/${k}`;
const nomeDi = p => (CFG.postazioni[p] && CFG.postazioni[p].nome) || `Postazione ${p}`;

if (mioPosto) {
  $('posto').textContent = `Postazione ${mioPosto}`;
  $('titolo').textContent = `${nomeDi(mioPosto)}, questa sala ha qualcosa da mostrarti.`;
}

// ---------- contenuti comuni (cambiano dalla regia) ----------
let testoComune = CFG.testo;
let logoTex = null;
const caricatore = new THREE.TextureLoader();
function caricaLogo(src) {
  caricatore.load(src, tex => {
    tex.colorSpace = THREE.SRGBColorSpace;
    const vecchio = logoTex;
    logoTex = tex;
    ricostruisci(true);
    if (vecchio) vecchio.dispose();
  }, undefined, () => { /* logo non disponibile: si mostra solo il testo */ });
}
caricaLogo(CFG.logo);

// ---------- 3D ----------
const video = $('video'), canvas = $('gl'), stage = $('stage');
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scena3d = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, 1, 0.01, 500);
const ancora = new THREE.Group();
ancora.matrixAutoUpdate = false;
scena3d.add(ancora);

let vw = 0, vh = 0, focale = 1;
function impagina() {
  if (!vw) return;
  const W = innerWidth, H = innerHeight, s = Math.max(W / vw, H / vh);
  const w = vw * s, h = vh * s;
  Object.assign(stage.style, { width: w + 'px', height: h + 'px', left: (W - w) / 2 + 'px', top: (H - h) / 2 + 'px' });
  renderer.setSize(w, h, false);
  focale = 0.8 * Math.max(vw, vh);
  camera.aspect = vw / vh;
  camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(vh / 2 / focale));
  camera.updateProjectionMatrix();
}
addEventListener('resize', impagina);

let contenuto = null, idAgganciato = null;
let inizioRivelazione = 0, rivelato = false;
function ricostruisci(riparti = true) {
  if (contenuto) { ancora.remove(contenuto.radice); contenuto.elimina(); contenuto = null; }
  if (!idAgganciato) return;
  contenuto = costruisci({ nome: nomeDi(idAgganciato), testo: testoComune, logo: logoTex });
  ancora.add(contenuto.radice);
  if (riparti) { inizioRivelazione = performance.now(); rivelato = false; }
}

// ---------- riconoscimento QR ----------
let rilevatore = null;
async function preparaRilevatore() {
  if ('BarcodeDetector' in window) {
    try {
      const formati = await BarcodeDetector.getSupportedFormats();
      if (formati.includes('qr_code')) rilevatore = new BarcodeDetector({ formats: ['qr_code'] });
    } catch (e) {}
  }
}
const fuori = document.createElement('canvas');
const fuoriCtx = fuori.getContext('2d', { willReadFrequently: true });

function idDaTesto(raw) {
  try { return new URL(raw).searchParams.get('p'); }
  catch (e) { const m = /[?&]p=([\w-]+)/.exec(raw); return m ? m[1] : null; }
}

async function rileva() {
  if (rilevatore) {
    try {
      const r = (await rilevatore.detect(video)).filter(x => x.cornerPoints && x.cornerPoints.length === 4 && idDaTesto(x.rawValue));
      if (!r.length) return null;
      const scelto = r.find(x => idDaTesto(x.rawValue) === mioPosto) || r[0];
      return { id: idDaTesto(scelto.rawValue), punti: scelto.cornerPoints.map(p => [p.x, p.y]) };
    } catch (e) { rilevatore = null; }
  }
  const k = Math.min(1, 640 / Math.max(vw, vh));
  const w = Math.round(vw * k), h = Math.round(vh * k);
  if (fuori.width !== w || fuori.height !== h) { fuori.width = w; fuori.height = h; }
  fuoriCtx.drawImage(video, 0, 0, w, h);
  const q = window.jsQR(fuoriCtx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: 'dontInvert' });
  if (!q) return null;
  const id = idDaTesto(q.data);
  if (!id) return null;
  const L = q.location;
  return { id, punti: [L.topLeftCorner, L.topRightCorner, L.bottomRightCorner, L.bottomLeftCorner].map(p => [p.x / k, p.y / k]) };
}

let angoli = null, ultimoVisto = -1e9, ultimaPerdita = -1e9;
function aggancia(r) {
  const lato = Math.hypot(r.punti[1][0] - r.punti[0][0], r.punti[1][1] - r.punti[0][1]);
  if (!angoli || r.id !== idAgganciato) angoli = r.punti.map(p => p.slice());
  else {
    const salto = Math.max(...r.punti.map((p, i) => Math.hypot(p[0] - angoli[i][0], p[1] - angoli[i][1])));
    const a = salto > lato * 0.25 ? 1 : 0.55;
    angoli = angoli.map((p, i) => [p[0] + (r.punti[i][0] - p[0]) * a, p[1] + (r.punti[i][1] - p[1]) * a]);
  }
  const m = poseFromCorners(angoli, focale, vw / 2, vh / 2);
  if (!m) return;
  ancora.matrix.set(...m);
  ancora.matrixWorldNeedsUpdate = true;
  if (r.id !== idAgganciato) { idAgganciato = r.id; ricostruisci(); }
  ultimoVisto = performance.now();
}

async function cicloRilevamento() {
  while (true) {
    if (vw && video.readyState >= 2) { const r = await rileva(); if (r) aggancia(r); }
    await new Promise(requestAnimationFrame);
  }
}

// ---------- rintocco e vibrazione alla comparsa ----------
let audio = null;
function sbloccaAudio() {
  try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); audio.resume(); } catch (e) {}
}
addEventListener('pointerdown', sbloccaAudio, { once: true });
function rintocco() {
  try { navigator.vibrate && navigator.vibrate(18); } catch (e) {}
  if (!audio || audio.state !== 'running') return;
  const t0 = audio.currentTime;
  [[523.25, 0], [783.99, 0.1], [1046.5, 0.2]].forEach(([f, d]) => {
    const o = audio.createOscillator(), g = audio.createGain();
    o.type = 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(0, t0 + d);
    g.gain.linearRampToValueAtTime(0.07, t0 + d + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + d + 1.6);
    o.connect(g).connect(audio.destination);
    o.start(t0 + d); o.stop(t0 + d + 1.7);
  });
}

// ---------- disegno ----------
let dissolvenza = 0, eraVisibile = false;
const hint = $('hint');
hint.textContent = 'Inquadra il codice sulla tua postazione';
function disegna(ora) {
  requestAnimationFrame(disegna);
  if (video.videoWidth && (video.videoWidth !== vw || video.videoHeight !== vh)) {
    vw = video.videoWidth; vh = video.videoHeight; impagina();
  }
  const visibile = ora - ultimoVisto < 450;
  if (visibile && !eraVisibile && ora - ultimaPerdita > 1500) { inizioRivelazione = ora; rivelato = false; }
  if (!visibile && eraVisibile) ultimaPerdita = ora;
  eraVisibile = visibile;
  if (visibile && !rivelato && contenuto) { rivelato = true; rintocco(); }

  dissolvenza += ((visibile ? 1 : 0) - dissolvenza) * (visibile ? 0.25 : 0.12);
  ancora.visible = dissolvenza > 0.01;
  if (contenuto) {
    contenuto.aggiorna((ora - inizioRivelazione) / 1000, ora / 1000);
    for (const m of contenuto.materiali) m.opacity = m.userData.base * m.userData.anim * dissolvenza;
  }
  hint.classList.toggle('visibile', ora - ultimoVisto > 900);
  renderer.render(scena3d, camera);
}

// ---------- sincronizzazione con la regia ----------
const conn = $('conn');
function statoConn(s, testo) { conn.dataset.stato = s; conn.textContent = testo; }
function collega() {
  if (!window.mqtt) { statoConn('off', 'Regia non raggiungibile'); return; }
  const client = window.mqtt.connect(CFG.broker, { clientId: idDispositivo, clean: true, reconnectPeriod: 2500, connectTimeout: 8000, keepalive: 30 });
  const presenza = () => client.connected && client.publish(topic('presenza'),
    JSON.stringify({ id: idDispositivo, p: mioPosto, vede: performance.now() - ultimoVisto < 1500 ? idAgganciato : null, t: Date.now() }));
  client.on('connect', () => { statoConn('on', 'Collegato alla sala'); client.subscribe([topic('testo'), topic('logo')]); presenza(); });
  client.on('reconnect', () => statoConn('attesa', 'In collegamento'));
  client.on('offline', () => statoConn('off', 'Collegamento perso, riprovo'));
  client.on('message', (t, msg) => {
    try {
      const d = JSON.parse(msg.toString());
      if (t === topic('testo') && typeof d.testo === 'string' && d.testo !== testoComune) { testoComune = d.testo; ricostruisci(true); }
      if (t === topic('logo')) caricaLogo(d.logo || CFG.logo);
    } catch (e) {}
  });
  setInterval(presenza, 4000);
}

// ---------- avvio ----------
const errore = $('errore');
let avviato = false;
async function avvia(daUtente) {
  if (avviato) return;
  $('avvia').disabled = true;
  errore.textContent = '';
  if (daUtente) sbloccaAudio();
  if (!window.isSecureContext) {
    errore.textContent = 'La fotocamera funziona solo su un indirizzo sicuro (https). Pubblica la cartella su un hosting con https.';
    $('avvia').disabled = false; return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
    });
    video.srcObject = stream;
    await video.play();
  } catch (e) {
    if (daUtente) {
      errore.textContent = e.name === 'NotAllowedError'
        ? 'Accesso alla fotocamera negato. Consentilo nelle impostazioni del browser per questo sito, poi ricarica la pagina.'
        : e.name === 'NotFoundError' ? 'Nessuna fotocamera trovata su questo dispositivo.'
        : 'Non riesco ad aprire la fotocamera. Se hai aperto il link da un\'altra app, aprilo in Safari o Chrome.';
    }
    $('avvia').disabled = false; return;
  }
  avviato = true;
  try { await navigator.wakeLock?.request('screen'); } catch (e) {}
  await Promise.all([
    document.fonts.load('150px "Instrument Serif"'),
    document.fonts.load('500 100px "Figtree"'),
  ]).catch(() => {});
  document.body.classList.add('attiva');
  await preparaRilevatore();
  requestAnimationFrame(disegna);
  cicloRilevamento();
}

$('avvia').addEventListener('click', () => avvia(true));
collega();
// Prova ad aprire subito la fotocamera: il telefono chiede il permesso e,
// se lo concede, l'inquadratura parte senza altri tocchi.
avvia(false);
