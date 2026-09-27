// Contenuto in realtà aumentata mostrato sopra il QR della postazione.
// Dall'alto: logo (uguale per tutti), nome del partecipante (dal QR), scritta principale (uguale per tutti).
// Unità: 1 = lato del QR. X a destra, Y verso l'alto del codice, Z verso chi guarda.
import * as THREE from '../vendor/three.module.min.js';

const COLORI = { ottone: '#D9B26A', ottoneChiaro: '#F2D49A', avorio: '#F7ECD6' };
const SERIF = '"Instrument Serif", Georgia, serif';
const SANS = '"Figtree", "Segoe UI", system-ui, sans-serif';

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const easeOut = x => 1 - Math.pow(1 - clamp(x), 3);
const fase = (t, inizio, durata) => clamp((t - inizio) / durata);

let glowTex = null;
function textureGlow() {
  if (glowTex) return glowTex;
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(255,240,210,1)');
  grd.addColorStop(0.3, 'rgba(242,212,154,0.45)');
  grd.addColorStop(1, 'rgba(217,178,106,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  glowTex = new THREE.CanvasTexture(c);
  glowTex.colorSpace = THREE.SRGBColorSpace;
  glowTex.userData.condivisa = true;
  return glowTex;
}

function righe(ctx, testo, maxW) {
  const out = [];
  for (const par of String(testo).split('\n')) {
    let riga = '';
    for (const w of par.split(/\s+/)) {
      const prova = riga ? riga + ' ' + w : w;
      if (ctx.measureText(prova).width > maxW && riga) { out.push(riga); riga = w; } else riga = prova;
    }
    out.push(riga);
  }
  return out;
}

// Testo come sprite: sempre rivolto verso chi guarda
function scritta(str, o) {
  const px = o.px, lh = px * 1.15;
  const font = `${o.peso || 400} ${px}px ${o.serif ? SERIF : SANS}`;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.font = font;
  const lines = righe(ctx, str, o.maxW);
  const pad = px * 0.5;
  canvas.width = Math.ceil(Math.max(1, ...lines.map(l => ctx.measureText(l).width)) + pad * 2);
  canvas.height = Math.ceil(lines.length * lh + pad * 1.2);
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = o.colore;
  ctx.shadowColor = 'rgba(217,178,106,0.85)';
  ctx.shadowBlur = px * 0.2;
  lines.forEach((l, i) => ctx.fillText(l, canvas.width / 2, pad * 0.6 + lh * (i + 0.5)));
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false }));
  sprite.renderOrder = 10;
  const h = o.dim * canvas.height / lh;
  sprite.scale.set(h * canvas.width / canvas.height, h, 1);
  return sprite;
}

// dati: { nome, testo, logo (THREE.Texture | null) }
export function costruisci(dati) {
  const radice = new THREE.Group();
  const materiali = [];
  const M = (m, base = 1) => { m.transparent = true; m.userData.base = base; m.userData.anim = 0; materiali.push(m); return m; };
  const Z = 0.3;

  // Cornice di aggancio attorno al QR
  const cornice = new THREE.Group();
  const matC = M(new THREE.MeshBasicMaterial({ color: COLORI.ottoneChiaro, blending: THREE.AdditiveBlending, depthWrite: false }));
  const L = 0.26, S = 0.035, E = 0.6;
  for (const [sx, sy] of [[-1, 1], [1, 1], [1, -1], [-1, -1]]) {
    const a = new THREE.Mesh(new THREE.PlaneGeometry(L, S), matC); a.position.set(sx * (E - L / 2), sy * E, 0.01);
    const b = new THREE.Mesh(new THREE.PlaneGeometry(S, L), matC); b.position.set(sx * E, sy * (E - L / 2), 0.01);
    cornice.add(a, b);
  }
  radice.add(cornice);

  // Scritta principale (in basso, appena sopra il QR)
  const testo = scritta(dati.testo || ' ', { serif: true, px: 150, dim: 0.34, maxW: 1700, colore: COLORI.avorio });
  M(testo.material);
  let y = 0.72 + testo.scale.y / 2;
  testo.position.set(0, y, Z);
  const yTesto = y;
  y += testo.scale.y / 2;

  // Nome del partecipante, più piccolo, sopra la scritta
  const nome = scritta(dati.nome || '', { px: 100, peso: 500, dim: 0.14, maxW: 1600, colore: COLORI.ottoneChiaro });
  M(nome.material);
  y += 0.04 + nome.scale.y / 2;
  nome.position.set(0, y, Z);
  y += nome.scale.y / 2;

  // Logo, uguale per tutti, in cima
  let logo = null;
  if (dati.logo && dati.logo.image) {
    const img = dati.logo.image;
    const ratio = (img.width || 1) / (img.height || 1);
    let h = 0.75, w = h * ratio;
    if (w > 1.8) { w = 1.8; h = w / ratio; }
    logo = new THREE.Sprite(M(new THREE.SpriteMaterial({ map: dati.logo, depthWrite: false, depthTest: false })));
    logo.renderOrder = 11;
    logo.scale.set(w, h, 1);
    logo.userData.scala = logo.scale.clone();
    y += 0.18 + h / 2;
    logo.position.set(0, y, Z);
    y += h / 2;
  }

  // Alone di luce dietro a tutto il blocco
  const alone = new THREE.Sprite(M(new THREE.SpriteMaterial({ map: textureGlow(), blending: THREE.AdditiveBlending, depthWrite: false }), 0.45));
  alone.position.set(0, (0.72 + y) / 2, Z - 0.05);
  alone.scale.setScalar(Math.max(2.4, (y - 0.72) * 2.2));

  radice.add(alone, testo, nome);
  if (logo) radice.add(logo);

  return {
    radice,
    materiali,
    aggiorna(t, ora) {
      cornice.scale.setScalar(1 + 0.35 * (1 - easeOut(t / 0.6)));
      matC.userData.anim = t < 1.2 ? 1 : 0.3 + 0.12 * Math.sin(ora * 2.2);
      alone.material.userData.anim = easeOut(t / 1.2) * (0.8 + 0.2 * Math.sin(ora * 1.6));
      if (logo) {
        const e = easeOut(fase(t, 0.1, 0.9));
        logo.material.userData.anim = e;
        logo.scale.copy(logo.userData.scala).multiplyScalar(0.8 + 0.2 * e);
      }
      nome.material.userData.anim = easeOut(fase(t, 0.45, 0.8));
      const e = easeOut(fase(t, 0.7, 1.2));
      testo.position.y = yTesto - 0.25 * (1 - e);
      testo.material.userData.anim = e;
    },
    elimina() {
      radice.traverse(o => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          const map = o.material.map;
          if (map && !map.userData.condivisa && map !== dati.logo) map.dispose();
          o.material.dispose();
        }
      });
    },
  };
}
