// Turbo Arena 3D - car soccer with jumping and aerials (three.js r128). 2v2: you + AI teammate vs 2 AI.
window.TURBO = typeof THREE !== 'undefined';
window.addEventListener('error', e => { const b = document.getElementById('banner'); if (b) { b.style.fontSize = '1.1rem'; b.style.color = '#fff'; b.textContent = 'Error: ' + e.message; } });
const $ = id => document.getElementById(id);
const HL = 800, HW = 500, HH = 520, GW = 320, GH = 200, GD = 120, MATCH = 180, CH = 18, BR = 40;
const TEAM = ['#3b82f6', '#ff7a18'];

// ---- Car roster (add more here!) ----
const CARS = [
  { name: 'Striker',   color: '#ff7a18', acc: 840, max: 760, turn: 3.4, mass: 1.0, bacc: 1200, desc: 'All-rounder' },
  { name: 'Bulldozer', color: '#9aa3b2', acc: 650, max: 680, turn: 2.6, mass: 1.9, bacc: 1100, desc: 'Heavy hitter' },
  { name: 'Comet',     color: '#22d3ee', acc: 940, max: 880, turn: 3.0, mass: 0.8, bacc: 1300, desc: 'Top speed' },
  { name: 'Drifter',   color: '#a855f7', acc: 810, max: 730, turn: 4.4, mass: 0.9, bacc: 1150, desc: 'Super agile' },
  { name: 'Toxic',     color: '#84cc16', acc: 890, max: 790, turn: 3.6, mass: 1.1, bacc: 1400, desc: 'Boost beast' },
  { name: 'Inferno',   color: '#ef4444', acc: 920, max: 820, turn: 3.2, mass: 1.2, bacc: 1250, desc: 'Fast and mean' },
];

// ---- Menu ----
let pick = 0;
const carsEl = $('cars');
CARS.forEach((c, i) => {
  const d = document.createElement('div');
  d.className = 'card'; d.tabIndex = 0; d.style.setProperty('--c', c.color);
  const bar = (l, v) => `<div class="bar"><span>${l}</span><div><i style="width:${v * 100}%"></i></div></div>`;
  d.innerHTML = `<div class="car"></div><h3>${c.name}</h3><small>${c.desc}</small>` +
    bar('Accel', c.acc / 940) + bar('Speed', c.max / 880) + bar('Turn', c.turn / 4.4) + bar('Weight', c.mass / 1.9);
  const sel = () => { pick = i; [...carsEl.children].forEach((e, j) => e.classList.toggle('sel', j === i)); };
  d.onclick = sel; d.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sel(); } };
  carsEl.appendChild(d);
  if (i === 0) sel();
});

// ---- Three.js scene ----
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
$('wrap').prepend(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b1c33); scene.fog = new THREE.Fog(0x0b1c33, 2000, 4800);
const cam = new THREE.PerspectiveCamera(78, 1, 5, 7000);
function resize() { renderer.setSize(innerWidth, innerHeight); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();
scene.add(new THREE.HemisphereLight(0xcfe4ff, 0x1b3a2a, 1.05));
const sun = new THREE.DirectionalLight(0xffffff, .7); sun.position.set(300, 800, 200); scene.add(sun);

function tex(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); return new THREE.CanvasTexture(c); }
const floorTex = tex(1600, 1000, (x, w, h) => {
  for (let i = 0; i < 16; i++) { x.fillStyle = i % 2 ? '#1c6b3a' : '#20803f'; x.fillRect(i * w / 16, 0, w / 16, h); }
  x.fillStyle = TEAM[0] + '55'; x.fillRect(0, h / 2 - 190, 150, 380); x.fillStyle = TEAM[1] + '55'; x.fillRect(w - 150, h / 2 - 190, 150, 380);
  x.strokeStyle = '#ffffffbb'; x.lineWidth = 6; x.strokeRect(3, 3, w - 6, h - 6);
  x.beginPath(); x.moveTo(w / 2, 0); x.lineTo(w / 2, h); x.stroke(); x.beginPath(); x.arc(w / 2, h / 2, 130, 0, 6.283); x.stroke();
});
const floor = new THREE.Mesh(new THREE.PlaneGeometry(2 * HL, 2 * HW), new THREE.MeshLambertMaterial({ map: floorTex }));
floor.rotation.x = -Math.PI / 2; scene.add(floor);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000), new THREE.MeshBasicMaterial({ color: 0x0a1422 }));
ground.rotation.x = -Math.PI / 2; ground.position.y = -2; scene.add(ground);

const glass = new THREE.MeshBasicMaterial({ color: 0x6aa8ff, transparent: true, opacity: .1, side: THREE.DoubleSide, depthWrite: false });
const edgeMat = new THREE.LineBasicMaterial({ color: 0x9fd0ff });
function box(x, y, z, sx, sy, sz, mat, edges) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat); m.position.set(x, y, z); scene.add(m);
  if (edges) { const l = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), edgeMat); l.position.copy(m.position); scene.add(l); }
  return m;
}
[-1, 1].forEach(s => {
  box(0, HH / 2, s * HW, 2 * HL, HH, 2, glass, 1);                                    // side walls
  box(s * HL, HH / 2, s * (HW + GW / 2) / 2, 2, HH, HW - GW / 2, glass, 1);           // end wall sides
  box(s * HL, (GH + HH) / 2, 0, 2, HH - GH, GW, glass, 1);                            // above goal
  const t = s < 0 ? 0 : 1, col = new THREE.Color(TEAM[t]);
  const net = new THREE.Mesh(new THREE.BoxGeometry(GD, GH, GW, 6, 8, 10), new THREE.MeshBasicMaterial({ color: col, wireframe: true, transparent: true, opacity: .35 }));
  net.position.set(s * (HL + GD / 2), GH / 2, 0); scene.add(net);
  const frame = new THREE.MeshBasicMaterial({ color: col });
  box(s * HL, GH / 2, -GW / 2, 8, GH, 8, frame); box(s * HL, GH / 2, GW / 2, 8, GH, 8, frame); box(s * HL, GH, 0, 8, 8, GW + 8, frame);
});
box(0, HH, 0, 2 * HL, 2, 2 * HW, glass, 1);                                           // ceiling
const crowd = tex(1024, 128, (x, w, h) => {
  x.fillStyle = '#10182a'; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 1400; i++) { x.fillStyle = ['#e0556b', '#4f8cff', '#f0c24a', '#cfd8ea', '#6fd18c'][i % 5]; x.fillRect(Math.random() * w, Math.random() * h, 3, 3); }
});
const standMat = new THREE.MeshBasicMaterial({ map: crowd, color: 0x9a9a9a });
[[0, -HW - 260, 0, 2 * HL + 800], [0, HW + 260, Math.PI, 2 * HL + 800], [-HL - GD - 260, 0, Math.PI / 2, 2 * HW + 600], [HL + GD + 260, 0, -Math.PI / 2, 2 * HW + 600]].forEach(([x, z, r, len]) => {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(len, 360), standMat);
  if (r === 0 || r === Math.PI) { m.position.set(x, 180, z); } else { m.position.set(x, 180, z); }
  m.rotation.y = r; scene.add(m);
});

const ballTex = tex(256, 128, (x, w, h) => {
  x.fillStyle = '#eef2fa'; x.fillRect(0, 0, w, h); x.fillStyle = '#2b3a55';
  for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) { x.beginPath(); x.arc(i * 46 + (j % 2) * 23, j * 46 + 20, 15, 0, 6.283); x.fill(); }
});
const ballMesh = new THREE.Mesh(new THREE.SphereGeometry(BR, 28, 20), new THREE.MeshLambertMaterial({ map: ballTex, emissive: 0x444a55 }));
scene.add(ballMesh);
const blobGeo = new THREE.CircleGeometry(1, 20);
function blob() { const m = new THREE.Mesh(blobGeo, new THREE.MeshBasicMaterial({ color: 0, transparent: true, opacity: .35, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.y = .8; scene.add(m); return m; }
const ballShadow = blob();

function carMesh(color, team) {
  const g = new THREE.Group(), M = c => new THREE.MeshLambertMaterial({ color: c });
  const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); g.add(m); return m; };
  add(new THREE.BoxGeometry(64, 14, 34), M(color), 0, -2, 0);
  add(new THREE.BoxGeometry(26, 12, 28), M(0x10151f), -4, 10, 0);
  add(new THREE.BoxGeometry(20, 2, 20), M(TEAM[team]), -4, 16.5, 0);
  add(new THREE.BoxGeometry(6, 3, 36), M(TEAM[team]), -30, 11, 0);
  const wg = new THREE.CylinderGeometry(9, 9, 8, 12), wm = M(0x15181f);
  [[20, 19], [20, -19], [-20, 19], [-20, -19]].forEach(([x, z]) => { const w = add(wg, wm, x, -9, z); w.rotation.x = Math.PI / 2; });
  const fl = add(new THREE.ConeGeometry(7, 46, 10), new THREE.MeshBasicMaterial({ color: 0xff9a2e }), -56, 0, 0);
  fl.rotation.z = Math.PI / 2; fl.visible = false; g.userData.flame = fl;
  g.rotation.order = 'YZX'; scene.add(g); return g;
}

// boost trail particles
const NP = 400, pp = new Float32Array(NP * 3), pv = new Float32Array(NP * 3), pl = new Float32Array(NP); let pi = 0;
for (let i = 0; i < NP; i++) pp[i * 3 + 1] = -999;
const pgeo = new THREE.BufferGeometry(); pgeo.setAttribute('position', new THREE.BufferAttribute(pp, 3));
const pts = new THREE.Points(pgeo, new THREE.PointsMaterial({ color: 0xffa030, size: 16, transparent: true, opacity: .85, blending: THREE.AdditiveBlending, depthWrite: false }));
pts.frustumCulled = false; scene.add(pts);
function emit(x, y, z, vx, vy, vz, l) { const i = pi++ % NP; pp.set([x, y, z], i * 3); pv.set([vx, vy, vz], i * 3); pl[i] = l; }

// ---- State ----
const keys = {};
let jumpQ = false, ballCam = true, snapCam = true;
let cars = [], ball, pads = [], score = [0, 0], timeLeft = MATCH, state = 'menu', stateT = 0, overtime = false;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const angDiff = (a, b) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };
const fwd = c => [Math.cos(c.yaw) * Math.cos(c.pitch), Math.sin(c.pitch), Math.sin(c.yaw) * Math.cos(c.pitch)];

function newMatch() {
  cars.forEach(c => { scene.remove(c.mesh); scene.remove(c.shadow); });
  pads.forEach(p => scene.remove(p.mesh));
  const others = CARS.filter((_, i) => i !== pick), rnd = () => others[Math.random() * others.length | 0];
  const mk = (def, team, role, human) => ({ ...def, team, role, human, r: 34, m: def.mass, x: 0, y: CH, z: 0, vx: 0, vy: 0, vz: 0, yaw: 0, pitch: 0, boost: 33, dj: false, grounded: true, boosting: false, mesh: carMesh(def.color, team), shadow: blob() });
  cars = [mk(CARS[pick], 0, 0, true), mk(rnd(), 0, 1, false), mk(rnd(), 1, 0, false), mk(rnd(), 1, 1, false)];
  ball = { x: 0, y: BR, z: 0, vx: 0, vy: 0, vz: 0, r: BR, m: .7 };
  pads = [];
  const P = (x, z, big) => {
    const mat = new THREE.MeshBasicMaterial({ color: big ? 0xffb347 : 0xffe08a, transparent: true });
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(big ? 36 : 22, big ? 36 : 22, 4, 24), mat); mesh.position.set(x, 2, z); scene.add(mesh);
    pads.push({ x, z, big, t: 0, mesh });
  };
  [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([a, b]) => P(a * (HL - 90), b * (HW - 90), 1));
  [[-500, -260], [-500, 260], [500, -260], [500, 260], [0, -330], [0, 330], [-250, 0], [250, 0], [0, 0]].forEach(([x, z]) => P(x, z, 0));
  score = [0, 0]; timeLeft = MATCH; overtime = false; updateScore(); kickoff();
}
function kickoff() {
  ball.x = ball.z = 0; ball.y = BR; ball.vx = ball.vy = ball.vz = 0;
  cars.forEach(c => {
    const s = c.team ? 1 : -1;
    c.x = s * (c.role ? 620 : 350); c.z = c.role ? (c.team ? -200 : 200) : 0; c.y = CH;
    c.yaw = c.team ? Math.PI : 0; c.pitch = 0; c.vx = c.vy = c.vz = 0; c.boost = 33;
  });
  state = 'count'; stateT = 3; snapCam = true;
}
$('start').addEventListener('click', () => { $('menu').classList.add('hidden'); $('wrap').classList.remove('hidden'); $('start').blur(); say(''); resize(); newMatch(); });
addEventListener('keydown', e => {
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code) && state !== 'menu') e.preventDefault();
  if (e.code === 'Space' && !e.repeat && state !== 'menu') jumpQ = true;
  if (e.code === 'KeyC') { ballCam = !ballCam; $('cam').textContent = ballCam ? 'BALL CAM' : 'CAR CAM'; }
  if (e.code === 'Escape' && state !== 'menu') { state = 'menu'; $('wrap').classList.add('hidden'); $('menu').classList.remove('hidden'); }
});
addEventListener('keyup', e => keys[e.code] = false);

// ---- Physics ----
function carStep(c, inp, dt) {
  const g = c.y <= CH + .5 && c.vy <= 0; c.grounded = g;
  const boosting = !!inp.boost && c.boost > 0; c.boosting = boosting;
  if (boosting) c.boost = Math.max(0, c.boost - 33 * dt);
  if (g) {
    c.dj = false;
    const fx = Math.cos(c.yaw), fz = Math.sin(c.yaw), rx = -fz, rz = fx, sp = c.vx * fx + c.vz * fz;
    c.yaw += inp.steer * c.turn * clamp(sp / 220, -1, 1) * dt;
    const a = inp.thr * c.acc * (inp.thr < 0 ? .7 : 1) + (boosting ? c.bacc : 0);
    c.vx += fx * a * dt; c.vz += fz * a * dt;
    const lat = c.vx * rx + c.vz * rz, gr = Math.min(1, 9 * dt); c.vx -= rx * lat * gr; c.vz -= rz * lat * gr;
    const dr = 1 - (inp.thr || boosting ? .12 : .9) * dt; c.vx *= dr; c.vz *= dr;
    const mx = c.max * (boosting ? 1.5 : 1), s = Math.hypot(c.vx, c.vz);
    if (s > mx) { const k = 1 + (mx / s - 1) * Math.min(1, 5 * dt); c.vx *= k; c.vz *= k; }
    c.pitch *= 1 - Math.min(1, 12 * dt); c.vy = 0; c.y = CH;
    if (inp.jump) { c.vy = 520; c.y = CH + 1; c.pitch = .3; }
  } else {
    c.yaw += inp.steer * 3 * dt;
    c.pitch = clamp(c.pitch + inp.pitch * 3.2 * dt, -1.45, 1.45);
    const f = fwd(c);
    if (boosting) { const b = c.bacc * 1.15 * dt; c.vx += f[0] * b; c.vy += f[1] * b; c.vz += f[2] * b; }
    if (inp.jump && !c.dj) { c.vy += 380; c.dj = true; }
    c.vy -= 900 * dt;
    const k = 1 - .1 * dt; c.vx *= k; c.vy *= k; c.vz *= k;
    const s = Math.hypot(c.vx, c.vy, c.vz); if (s > 1400) { const q = 1400 / s; c.vx *= q; c.vy *= q; c.vz *= q; }
  }
  c.x += c.vx * dt; c.y += c.vy * dt; c.z += c.vz * dt;
  if (c.y <= CH) { c.y = CH; if (c.vy < 0) c.vy = 0; }
  if (c.y > HH - 20) { c.y = HH - 20; c.vy = -Math.abs(c.vy) * .3; }
  if (c.x < -HL + 30) { c.x = -HL + 30; c.vx = Math.abs(c.vx) * .3; } if (c.x > HL - 30) { c.x = HL - 30; c.vx = -Math.abs(c.vx) * .3; }
  if (c.z < -HW + 30) { c.z = -HW + 30; c.vz = Math.abs(c.vz) * .3; } if (c.z > HW - 30) { c.z = HW - 30; c.vz = -Math.abs(c.vz) * .3; }
  if (boosting) { const f = fwd(c); for (let i = 0; i < 2; i++) emit(c.x - f[0] * 40, c.y - f[1] * 40, c.z - f[2] * 40, -f[0] * 160 + (Math.random() - .5) * 90, -f[1] * 160 + (Math.random() - .5) * 90, -f[2] * 160 + (Math.random() - .5) * 90, .35); }
}
function collide(a, b, e) {
  const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z, d = Math.hypot(dx, dy, dz), min = a.r + b.r;
  if (d >= min || d === 0) return false;
  const nx = dx / d, ny = dy / d, nz = dz / d, ia = 1 / a.m, ib = 1 / b.m, s = (min - d) / (ia + ib);
  a.x -= nx * s * ia; a.y -= ny * s * ia; a.z -= nz * s * ia; b.x += nx * s * ib; b.y += ny * s * ib; b.z += nz * s * ib;
  const rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny + (b.vz - a.vz) * nz;
  if (rel < 0) { const j = -(1 + e) * rel / (ia + ib); a.vx -= j * ia * nx; a.vy -= j * ia * ny; a.vz -= j * ia * nz; b.vx += j * ib * nx; b.vy += j * ib * ny; b.vz += j * ib * nz; }
  return true;
}
function hitBall(c) { // car = two spheres (nose + tail) so aerial hits feel right
  const f = fwd(c);
  for (const o of [16, -16]) {
    const t = { x: c.x + f[0] * o, y: c.y + f[1] * o, z: c.z + f[2] * o, vx: c.vx, vy: c.vy, vz: c.vz, r: 34, m: c.m }, ox = t.x, oy = t.y, oz = t.z;
    if (collide(t, ball, .85)) { c.x += t.x - ox; c.y += t.y - oy; c.z += t.z - oz; c.vx = t.vx; c.vy = t.vy; c.vz = t.vz; }
  }
}
function ballStep(dt) {
  const b = ball; b.vy -= 800 * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt;
  const k = 1 - .12 * dt; b.vx *= k; b.vy *= k; b.vz *= k;
  const sp = Math.hypot(b.vx, b.vy, b.vz); if (sp > 1500) { const q = 1500 / sp; b.vx *= q; b.vy *= q; b.vz *= q; }
  if (b.y < BR) { b.y = BR; if (b.vy < 0) { b.vy = -b.vy * .6; if (b.vy < 60) b.vy = 0; } b.vx *= 1 - .4 * dt; b.vz *= 1 - .4 * dt; }
  if (b.y > HH - BR) { b.y = HH - BR; b.vy = -Math.abs(b.vy) * .6; }
  const inG = Math.abs(b.z) < GW / 2 - BR * .2 && b.y < GH - BR * .2, lim = inG ? HL + GD - BR : HL - BR;
  if (b.x > lim) { b.x = lim; b.vx = -Math.abs(b.vx) * .7; } if (b.x < -lim) { b.x = -lim; b.vx = Math.abs(b.vx) * .7; }
  if (Math.abs(b.x) > HL) { // inside a goal pocket
    const zl = GW / 2 - BR; if (Math.abs(b.z) > zl) { b.z = Math.sign(b.z) * zl; b.vz = -Math.sign(b.z) * Math.abs(b.vz) * .6; }
    if (b.y > GH - BR) { b.y = GH - BR; b.vy = -Math.abs(b.vy) * .6; }
  } else if (Math.abs(b.z) > HW - BR) { b.z = Math.sign(b.z) * (HW - BR); b.vz = -Math.sign(b.z) * Math.abs(b.vz) * .75; }
}

// ---- Input / AI ----
function playerInput() {
  const k = keys, j = jumpQ; jumpQ = false;
  return { thr: (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0), steer: (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0),
    pitch: (k.KeyS || k.ArrowDown ? 1 : 0) - (k.KeyW || k.ArrowUp ? 1 : 0), boost: !!(k.ShiftLeft || k.ShiftRight), jump: j };
}
function aiInput(c) {
  const s = c.team ? 1 : -1, ox = s * HL, dx0 = ball.x + s * HL, dB = Math.hypot(ball.x - c.x, ball.z - c.z);
  let tx, tz;
  if (c.role === 0) {
    const d = Math.hypot(dx0, ball.z) || 1; tx = ball.x + dx0 / d * 70 + ball.vx * .2; tz = ball.z + ball.z / d * 70 + ball.vz * .2;
    if (dB < 220) { tx = ball.x + ball.vx * .25; tz = ball.z + ball.vz * .25; }
  } else {
    tx = (ball.x + ox * 2) / 3; tz = ball.z / 2;
    if (Math.hypot(ball.x - ox, ball.z) < 650 && dB < 450) { tx = ball.x; tz = ball.z; }
  }
  if (c.boost < 15) { let best = null, bd = 500; pads.forEach(p => { const d = Math.hypot(p.x - c.x, p.z - c.z); if (p.t <= 0 && d < bd) { bd = d; best = p; } }); if (best) { tx = best.x; tz = best.z; } }
  const diff = angDiff(c.yaw, Math.atan2(tz - c.z, tx - c.x)), dist = Math.hypot(tx - c.x, tz - c.z);
  return { steer: clamp(diff * 3, -1, 1), thr: Math.abs(diff) > 2.4 && dist < 300 ? -1 : 1, boost: Math.abs(diff) < .25 && dist > 350 && c.boost > 20,
    jump: c.grounded && dB < 150 && ball.y > 80 && Math.random() < .04, pitch: clamp(-c.pitch * 3, -1, 1) };
}

// ---- Game loop ----
const banner = $('banner');
function updateScore() { $('s0').textContent = score[0]; $('s1').textContent = score[1]; }
function say(t, c) { banner.style.fontSize = ''; banner.textContent = t; banner.style.color = c || '#fff'; }
function step(dt) {
  const frozen = state === 'count' || state === 'end', idle = { thr: 0, steer: 0, pitch: 0, boost: false, jump: false };
  cars.forEach(c => carStep(c, frozen ? idle : c.human ? playerInput() : aiInput(c), dt));
  for (let i = 0; i < cars.length; i++) for (let j = i + 1; j < cars.length; j++) collide(cars[i], cars[j], .4);
  ballStep(dt); cars.forEach(hitBall);
  pads.forEach(p => {
    if (p.t > 0) { p.t -= dt; return; }
    cars.forEach(c => { if (p.t <= 0 && c.boost < 100 && c.y < CH + 40 && Math.hypot(p.x - c.x, p.z - c.z) < (p.big ? 55 : 40)) { c.boost = Math.min(100, c.boost + (p.big ? 100 : 12)); p.t = p.big ? 10 : 4; } });
  });
}
const camPos = new THREE.Vector3(), camLook = new THREE.Vector3(), tp = new THREE.Vector3(), tl = new THREE.Vector3();
function updateCam(dt) {
  const c = cars[0]; let dx = c.x - ball.x, dz = c.z - ball.z; const d = Math.hypot(dx, dz);
  if (!ballCam || d < 80) { dx = -Math.cos(c.yaw); dz = -Math.sin(c.yaw); } else { dx /= d; dz /= d; }
  tp.set(c.x + dx * 270, c.y + 105 + (ballCam ? clamp(ball.y * .18, 0, 90) : 20), c.z + dz * 270);
  if (ballCam) tl.set(ball.x * .75 + c.x * .25, ball.y * .75 + c.y * .25 + 10, ball.z * .75 + c.z * .25); else tl.set(c.x - dx * 200, c.y + 30, c.z - dz * 200);
  const k = snapCam ? 1 : 1 - Math.exp(-9 * dt); snapCam = false;
  camPos.lerp(tp, k); camLook.lerp(tl, k);
  cam.position.set(clamp(camPos.x, -HL - 200, HL + 200), clamp(camPos.y, 25, 700), clamp(camPos.z, -HW - 200, HW + 200)); cam.lookAt(camLook);
}
function sync(dt) {
  cars.forEach(c => {
    c.mesh.position.set(c.x, c.y, c.z); c.mesh.rotation.y = -c.yaw; c.mesh.rotation.z = c.pitch;
    const fl = c.mesh.userData.flame; fl.visible = c.boosting; if (c.boosting) fl.scale.set(1, .7 + Math.random() * .6, 1);
    c.shadow.position.set(c.x, .8, c.z); c.shadow.scale.setScalar(38); c.shadow.material.opacity = clamp(.4 - (c.y - CH) / 900, .05, .4);
  });
  ballMesh.position.set(ball.x, ball.y, ball.z);
  const sp = Math.hypot(ball.vx, ball.vz); if (sp > 1) ballMesh.rotateOnWorldAxis(new THREE.Vector3(ball.vz / sp, 0, -ball.vx / sp), sp * dt / BR);
  ballShadow.position.set(ball.x, .8, ball.z); ballShadow.scale.setScalar(BR * 1.1); ballShadow.material.opacity = clamp(.4 - (ball.y - BR) / 900, .05, .4);
  pads.forEach(p => { p.mesh.material.opacity = p.t > 0 ? .2 : 1; });
  for (let i = 0; i < NP; i++) if (pl[i] > 0) { pl[i] -= dt; pp[i * 3] += pv[i * 3] * dt; pp[i * 3 + 1] += pv[i * 3 + 1] * dt; pp[i * 3 + 2] += pv[i * 3 + 2] * dt; if (pl[i] <= 0) pp[i * 3 + 1] = -999; }
  pgeo.attributes.position.needsUpdate = true;
}
let last = performance.now();
function loop(now) {
  const dt = Math.min(.033, (now - last) / 1000); last = now;
  if (state !== 'menu') {
    step(dt / 2); step(dt / 2);
    if (state === 'count') { stateT -= dt; say(Math.ceil(stateT) || 'GO!'); if (stateT <= 0) { state = 'play'; say(''); } }
    else if (state === 'play') {
      if (!overtime) timeLeft -= dt;
      if (timeLeft <= 0 && !overtime) { if (score[0] === score[1]) { overtime = true; say('OVERTIME!'); setTimeout(() => state === 'play' && say(''), 1500); } else endMatch(); }
      if (ball.x < -HL - BR) goal(1); else if (ball.x > HL + BR) goal(0);
    } else if (state === 'goal') { stateT -= dt; if (stateT <= 0) { if (overtime) endMatch(); else kickoff(); } }
    const m = Math.max(0, Math.ceil(timeLeft));
    $('time').textContent = overtime ? 'OT' : Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0');
    const pl0 = cars[0]; $('ring').style.setProperty('--p', pl0.boost); $('boostnum').textContent = Math.round(pl0.boost);
    sync(dt); updateCam(dt); renderer.render(scene, cam);
  }
  requestAnimationFrame(loop);
}
function goal(team) { score[team]++; updateScore(); state = 'goal'; stateT = 2.5; say('GOAL!', TEAM[team]); }
function endMatch() {
  state = 'end'; const w = score[0] > score[1] ? 0 : 1; say(w === 0 ? 'YOU WIN!' : 'DEFEAT', TEAM[w]);
  setTimeout(() => { if (state === 'end') { state = 'menu'; $('wrap').classList.add('hidden'); $('menu').classList.remove('hidden'); say(''); } }, 4000);
}
requestAnimationFrame(loop);
