// Calcolo della posizione e orientamento (posa) del QR code nello spazio,
// a partire dai 4 angoli rilevati nell'immagine della fotocamera.
// Sistema di riferimento del QR: lato = 1, centro nell'origine,
// X verso destra, Y verso l'alto del codice, Z uscente dal foglio.

const SRC = [[-0.5, 0.5], [0.5, 0.5], [0.5, -0.5], [-0.5, -0.5]]; // TL, TR, BR, BL

function solve(A, b) {
  const n = b.length;
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    if (Math.abs(A[p][c]) < 1e-12) return null;
    [A[c], A[p]] = [A[p], A[c]];
    [b[c], b[p]] = [b[p], b[c]];
    for (let r = c + 1; r < n; r++) {
      const k = A[r][c] / A[c][c];
      for (let j = c; j < n; j++) A[r][j] -= k * A[c][j];
      b[r] -= k * b[c];
    }
  }
  const x = new Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let s = b[r];
    for (let j = r + 1; j < n; j++) s -= A[r][j] * x[j];
    x[r] = s / A[r][r];
  }
  return x;
}

export function homography(src, dst) {
  const A = [], b = [];
  for (let i = 0; i < 4; i++) {
    const [X, Y] = src[i], [x, y] = dst[i];
    A.push([X, Y, 1, 0, 0, 0, -x * X, -x * Y]); b.push(x);
    A.push([0, 0, 0, X, Y, 1, -y * X, -y * Y]); b.push(y);
  }
  const h = solve(A, b);
  return h ? [...h, 1] : null;
}

const norm = v => Math.hypot(v[0], v[1], v[2]);
const scale = (v, k) => [v[0] * k, v[1] * k, v[2] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

// corners: [[u,v] x4] in pixel (TL, TR, BR, BL); f = lunghezza focale in pixel; cx, cy = centro immagine.
// Restituisce la matrice 4x4 (row-major) nel sistema di Three.js (y in alto, z verso chi guarda).
export function poseFromCorners(corners, f, cx, cy) {
  const dst = corners.map(([u, v]) => [(u - cx) / f, (v - cy) / f]);
  const H = homography(SRC, dst);
  if (!H) return null;
  let h1 = [H[0], H[3], H[6]], h2 = [H[1], H[4], H[7]], h3 = [H[2], H[5], H[8]];
  const l = 2 / (norm(h1) + norm(h2));
  let r1 = scale(h1, l), r2 = scale(h2, l), t = scale(h3, l);
  if (t[2] < 0) { r1 = scale(r1, -1); r2 = scale(r2, -1); t = scale(t, -1); }
  r1 = scale(r1, 1 / norm(r1));
  r2 = sub(r2, scale(r1, dot(r1, r2)));
  r2 = scale(r2, 1 / norm(r2));
  const r3 = cross(r1, r2);
  // Conversione da convenzione OpenCV (y giù, z avanti) a Three.js (y su, z indietro)
  return [
    r1[0], r2[0], r3[0], t[0],
    -r1[1], -r2[1], -r3[1], -t[1],
    -r1[2], -r2[2], -r3[2], -t[2],
    0, 0, 0, 1,
  ];
}
