// Turbo Arena - top-down car soccer. 2v2: you + 1 AI teammate vs 2 AI.
const $ = id => document.getElementById(id);
const cv = $('game'), g = cv.getContext('2d');
const W = 1200, H = 700, GD = 70, GH = 250, MATCH = 180;
cv.width = W + GD * 2; cv.height = H;

// ---- Car roster (add more here!) ----
const CARS = [
  { name: 'Striker',   color: '#ff7a18', acc: 620, max: 560, turn: 3.4, mass: 1.0, bacc: 900,  desc: 'All-rounder' },
  { name: 'Bulldozer', color: '#9aa3b2', acc: 480, max: 500, turn: 2.6, mass: 1.9, bacc: 800,  desc: 'Heavy hitter' },
  { name: 'Comet',     color: '#22d3ee', acc: 700, max: 650, turn: 3.0, mass: 0.8, bacc: 1000, desc: 'Top speed' },
  { name: 'Drifter',   color: '#a855f7', acc: 600, max: 540, turn: 4.4, mass: 0.9, bacc: 850,  desc: 'Super agile' },
  { name: 'Toxic',     color: '#84cc16', acc: 660, max: 580, turn: 3.6, mass: 1.1, bacc: 1100, desc: 'Boost beast' },
  { name: 'Inferno',   color: '#ef4444', acc: 680, max: 600, turn: 3.2, mass: 1.2, bacc: 950,  desc: 'Fast and mean' },
];
const TEAM = ['#3b82f6', '#ff7a18'];

// ---- Menu ----
let pick = 0;
const carsEl = $('cars');
CARS.forEach((c, i) => {
  const d = document.createElement('div');
  d.className = 'card'; d.tabIndex = 0; d.style.setProperty('--c', c.color);
  const bar = (l, v) => `<div class="bar"><span>${l}</span><div><i style="width:${v * 100}%"></i></div></div>`;
  d.innerHTML = `<div class="car"></div><h3>${c.name}</h3><small>${c.desc}</small>` +
    bar('Accel', c.acc / 700) + bar('Speed', c.max / 650) + bar('Turn', c.turn / 4.4) + bar('Weight', c.mass / 1.9);
  const sel = () => { pick = i; [...carsEl.children].forEach((e, j) => e.classList.toggle('sel', j === i)); };
  d.onclick = sel; d.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sel(); } };
  carsEl.appendChild(d);
  if (i === 0) sel();
});

// ---- State ----
const keys = {};
let cars = [], ball, pads = [], parts = [], score = [0, 0], timeLeft = MATCH, state = 'menu', stateT = 0, overtime = false;

function mkCar(def, team, role, human) {
  return { ...def, team, role, human, r: 24, m: def.mass, x: 0, y: 0, vx: 0, vy: 0, a: 0, boost: 33 };
}
function newMatch() {
  const others = CARS.filter((_, i) => i !== pick);
  const rnd = () => others[Math.random() * others.length | 0];
  cars = [mkCar(CARS[pick], 0, 0, true), mkCar(rnd(), 0, 1, false), mkCar(rnd(), 1, 0, false), mkCar(rnd(), 1, 1, false)];
  ball = { x: W / 2, y: H / 2, vx: 0, vy: 0, r: 26, m: 0.7, rot: 0 };
  const P = (x, y, big) => ({ x, y, big, t: 0 });
  pads = [P(70, 70, 1), P(70, H - 70, 1), P(W - 70, 70, 1), P(W - 70, H - 70, 1),
    P(W * .25, H * .2), P(W * .25, H * .8), P(W * .75, H * .2), P(W * .75, H * .8),
    P(W * .5, H * .12), P(W * .5, H * .88), P(W * .4, H / 2), P(W * .6, H / 2), P(W * .5, H / 2 - 120), P(W * .5, H / 2 + 120)];
  score = [0, 0]; timeLeft = MATCH; overtime = false; updateScore();
  kickoff();
}
function kickoff() {
  ball.x = W / 2; ball.y = H / 2; ball.vx = ball.vy = 0;
  cars.forEach(c => {
    c.x = c.team ? W - 260 : 260; c.y = H / 2 + (c.role ? 130 : 0);
    if (c.role) c.x = c.team ? W - 140 : 140;
    c.a = c.team ? Math.PI : 0; c.vx = c.vy = 0; c.boost = 33;
  });
  state = 'count'; stateT = 3;
}
$('start').onclick = () => { $('menu').classList.add('hidden'); $('wrap').classList.remove('hidden'); newMatch(); };
addEventListener('keydown', e => {
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  if (e.code === 'Escape' && state !== 'menu') { state = 'menu'; $('wrap').classList.add('hidden'); $('menu').classList.remove('hidden'); }
});
addEventListener('keyup', e => keys[e.code] = false);

// ---- Physics ----
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const angDiff = (a, b) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };

function driveCar(c, inp, dt) {
  const fx = Math.cos(c.a), fy = Math.sin(c.a), rx = -fy, ry = fx;
  const sp = c.vx * fx + c.vy * fy;
  const boosting = inp.boost && c.boost > 0;
  c.a += inp.steer * c.turn * (inp.drift ? 1.35 : 1) * clamp(sp / 180, -1, 1) * dt;
  let acc = inp.thr * c.acc;
  if (boosting) { acc += c.bacc; c.boost = Math.max(0, c.boost - 33 * dt); }
  if (inp.thr < 0) acc = inp.thr * c.acc * 0.7;
  c.vx += fx * acc * dt; c.vy += fy * acc * dt;
  const lat = c.vx * rx + c.vy * ry, grip = inp.drift ? 1.5 : 9;
  c.vx -= rx * lat * Math.min(1, grip * dt); c.vy -= ry * lat * Math.min(1, grip * dt);
  const drag = 1 - (inp.thr || boosting ? 0.15 : 0.9) * dt;
  c.vx *= drag; c.vy *= drag;
  const max = c.max * (boosting ? 1.55 : 1), s = Math.hypot(c.vx, c.vy);
  if (s > max) { const k = 1 + (max / s - 1) * Math.min(1, 5 * dt); c.vx *= k; c.vy *= k; }
  c.x += c.vx * dt; c.y += c.vy * dt;
  if (c.x < c.r) { c.x = c.r; c.vx = Math.abs(c.vx) * .3; }
  if (c.x > W - c.r) { c.x = W - c.r; c.vx = -Math.abs(c.vx) * .3; }
  if (c.y < c.r) { c.y = c.r; c.vy = Math.abs(c.vy) * .3; }
  if (c.y > H - c.r) { c.y = H - c.r; c.vy = -Math.abs(c.vy) * .3; }
  if (boosting && Math.random() < .8) parts.push({ x: c.x - fx * 26, y: c.y - fy * 26, vx: -fx * 120 + (Math.random() - .5) * 60, vy: -fy * 120 + (Math.random() - .5) * 60, l: .35, c: '#ffa63d' });
}

function collide(a, b, e) {
  const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), min = a.r + b.r;
  if (d >= min || d === 0) return;
  const nx = dx / d, ny = dy / d, ia = 1 / a.m, ib = 1 / b.m, ov = min - d;
  a.x -= nx * ov * ia / (ia + ib); a.y -= ny * ov * ia / (ia + ib);
  b.x += nx * ov * ib / (ia + ib); b.y += ny * ov * ib / (ia + ib);
  const rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
  if (rel < 0) {
    const j = -(1 + e) * rel / (ia + ib);
    a.vx -= j * ia * nx; a.vy -= j * ia * ny; b.vx += j * ib * nx; b.vy += j * ib * ny;
    if (b === ball || a === ball) burst(ball.x, ball.y, '#fff', Math.min(10, -rel / 60 | 0));
  }
}
function burst(x, y, c, n) {
  for (let i = 0; i < n; i++) { const t = Math.random() * 6.28, s = 60 + Math.random() * 160; parts.push({ x, y, vx: Math.cos(t) * s, vy: Math.sin(t) * s, l: .5, c }); }
}

function updateBall(dt) {
  const b = ball;
  b.x += b.vx * dt; b.y += b.vy * dt;
  b.vx *= 1 - .25 * dt; b.vy *= 1 - .25 * dt;
  const s = Math.hypot(b.vx, b.vy); if (s > 1300) { b.vx *= 1300 / s; b.vy *= 1300 / s; }
  b.rot += (b.vx + b.vy) * dt / b.r * .5;
  const inG = Math.abs(b.y - H / 2) < GH / 2 - b.r * .5;
  const lo = inG ? -GD + b.r : b.r, hi = inG ? W + GD - b.r : W - b.r;
  if (b.x < lo) { b.x = lo; b.vx = Math.abs(b.vx) * .8; }
  if (b.x > hi) { b.x = hi; b.vx = -Math.abs(b.vx) * .8; }
  if (b.y < b.r) { b.y = b.r; b.vy = Math.abs(b.vy) * .8; }
  if (b.y > H - b.r) { b.y = H - b.r; b.vy = -Math.abs(b.vy) * .8; }
  if (b.x < 0 || b.x > W) { // inside a goal pocket: side walls
    const t = H / 2 - GH / 2 + b.r, u = H / 2 + GH / 2 - b.r;
    if (b.y < t) { b.y = t; b.vy = Math.abs(b.vy) * .8; }
    if (b.y > u) { b.y = u; b.vy = -Math.abs(b.vy) * .8; }
  }
}

// ---- AI ----
function aiInput(c) {
  const own = { x: c.team ? W : 0, y: H / 2 }, opp = { x: c.team ? 0 : W, y: H / 2 };
  let tx, ty;
  const dBall = Math.hypot(ball.x - c.x, ball.y - c.y);
  if (c.role === 0) {
    const dx = ball.x - opp.x, dy = ball.y - opp.y, d = Math.hypot(dx, dy) || 1;
    tx = ball.x + dx / d * 50; ty = ball.y + dy / d * 50;
    if (dBall < 170) { tx = ball.x + ball.vx * .25; ty = ball.y + ball.vy * .25; }
  } else {
    tx = (ball.x + own.x * 2) / 3; ty = (ball.y + own.y) / 2;
    if (Math.hypot(ball.x - own.x, ball.y - own.y) < 420 && dBall < 300) { tx = ball.x; ty = ball.y; }
  }
  // grab a nearby big pad when low on boost
  if (c.boost < 15) {
    let best = null, bd = 380;
    pads.forEach(p => { const d = Math.hypot(p.x - c.x, p.y - c.y); if (p.t <= 0 && d < bd) { bd = d; best = p; } });
    if (best) { tx = best.x; ty = best.y; }
  }
  const diff = angDiff(c.a, Math.atan2(ty - c.y, tx - c.x)), dist = Math.hypot(tx - c.x, ty - c.y);
  return { steer: clamp(diff * 3, -1, 1), thr: Math.abs(diff) > 2.4 && dist < 250 ? -1 : 1, boost: Math.abs(diff) < .25 && dist > 260 && c.boost > 20, drift: Math.abs(diff) > 1.3 && dist > 200 };
}
function playerInput() {
  const k = keys;
  return {
    thr: (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0),
    steer: (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0),
    boost: !!k.Space, drift: !!(k.ShiftLeft || k.ShiftRight)
  };
}

// ---- Game loop ----
const banner = $('banner');
function updateScore() { $('s0').textContent = score[0]; $('s1').textContent = score[1]; }
function say(t, c) { banner.textContent = t; banner.style.color = c || '#fff'; }
function step(dt) {
  cars.forEach(c => driveCar(c, state === 'count' || state === 'end' ? { thr: 0, steer: 0 } : c.human ? playerInput() : aiInput(c), dt));
  for (let i = 0; i < cars.length; i++) for (let j = i + 1; j < cars.length; j++) collide(cars[i], cars[j], .4);
  updateBall(dt);
  cars.forEach(c => collide(c, ball, .75));
  pads.forEach(p => {
    if (p.t > 0) { p.t -= dt; return; }
    cars.forEach(c => { if (p.t <= 0 && Math.hypot(p.x - c.x, p.y - c.y) < (p.big ? 44 : 32) && c.boost < 100) { c.boost = Math.min(100, c.boost + (p.big ? 100 : 12)); p.t = p.big ? 10 : 4; } });
  });
}
let last = performance.now();
function loop(now) {
  const dt = Math.min(.033, (now - last) / 1000); last = now;
  if (state !== 'menu') {
    step(dt / 2); step(dt / 2);
    parts.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.l -= dt; }); parts = parts.filter(p => p.l > 0);
    if (state === 'count') {
      stateT -= dt; say(Math.ceil(stateT) || 'GO!'); if (stateT <= 0) { state = 'play'; say(''); }
    } else if (state === 'play') {
      if (!overtime) timeLeft -= dt;
      if (timeLeft <= 0 && !overtime) { if (score[0] === score[1]) { overtime = true; say('OVERTIME!'); setTimeout(() => state === 'play' && say(''), 1500); } else endMatch(); }
      if (ball.x + ball.r < 0) goal(1); else if (ball.x - ball.r > W) goal(0);
    } else if (state === 'goal') {
      stateT -= dt; if (stateT <= 0) { if (overtime) endMatch(); else kickoff(); }
    } else if (state === 'end') {
      stateT -= dt;
    }
    const m = Math.max(0, Math.ceil(timeLeft));
    $('time').textContent = overtime ? 'OT' : Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0');
    const pl = cars[0]; if (pl) { $('boost').firstChild.style.width = pl.boost + '%'; $('bval').textContent = Math.round(pl.boost); }
    draw();
  }
  requestAnimationFrame(loop);
}
function goal(team) {
  score[team]++; updateScore(); state = 'goal'; stateT = 2.5;
  say('GOAL!', TEAM[team]); burst(ball.x < 0 ? 0 : W, ball.y, TEAM[team], 60);
}
function endMatch() {
  state = 'end'; stateT = 4; const w = score[0] > score[1] ? 0 : 1;
  say(w === 0 ? 'YOU WIN!' : 'DEFEAT', TEAM[w]);
  setTimeout(() => { if (state === 'end') { state = 'menu'; $('wrap').classList.add('hidden'); $('menu').classList.remove('hidden'); say(''); } }, 4000);
}

// ---- Rendering ----
function draw() {
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height);
  g.translate(GD, 0);
  // turf stripes
  for (let i = 0; i < 12; i++) { g.fillStyle = i % 2 ? '#0f3a33' : '#124439'; g.fillRect(i * W / 12, 0, W / 12 + 1, H); }
  // goals
  [0, 1].forEach(t => {
    const x = t ? W : -GD; g.fillStyle = TEAM[t] + '55'; g.fillRect(x, H / 2 - GH / 2, GD, GH);
    g.strokeStyle = TEAM[t] + '88'; g.lineWidth = 1;
    for (let i = 0; i <= GD; i += 14) { g.beginPath(); g.moveTo(x + i, H / 2 - GH / 2); g.lineTo(x + i, H / 2 + GH / 2); g.stroke(); }
    for (let i = 0; i <= GH; i += 14) { g.beginPath(); g.moveTo(x, H / 2 - GH / 2 + i); g.lineTo(x + GD, H / 2 - GH / 2 + i); g.stroke(); }
  });
  // lines
  g.strokeStyle = '#ffffff55'; g.lineWidth = 3;
  g.beginPath(); g.moveTo(W / 2, 0); g.lineTo(W / 2, H); g.stroke();
  g.beginPath(); g.arc(W / 2, H / 2, 110, 0, 6.28); g.stroke();
  g.strokeRect(0, H / 2 - GH / 2 - 40, 150, GH + 80); g.strokeRect(W - 150, H / 2 - GH / 2 - 40, 150, GH + 80);
  // walls (gaps at goals)
  g.strokeStyle = '#9fc2ff'; g.lineWidth = 6; g.lineCap = 'round';
  const gt = H / 2 - GH / 2, gb = H / 2 + GH / 2;
  g.beginPath(); g.moveTo(0, gt); g.lineTo(0, 0); g.lineTo(W, 0); g.lineTo(W, gt);
  g.moveTo(W, gb); g.lineTo(W, H); g.lineTo(0, H); g.lineTo(0, gb); g.stroke();
  // pads
  pads.forEach(p => {
    const R = p.big ? 24 : 15, on = p.t <= 0;
    g.globalAlpha = on ? 1 : .25; g.fillStyle = p.big ? '#ffb347' : '#ffd98a';
    g.shadowColor = '#ff9a1f'; g.shadowBlur = on ? 18 : 0;
    g.beginPath(); g.arc(p.x, p.y, R, 0, 6.28); g.fill();
    g.shadowBlur = 0; g.fillStyle = '#7a3d00'; g.beginPath(); g.arc(p.x, p.y, R * .55, 0, 6.28); g.fill(); g.globalAlpha = 1;
  });
  // particles
  parts.forEach(p => { g.globalAlpha = Math.max(0, p.l * 2); g.fillStyle = p.c; g.beginPath(); g.arc(p.x, p.y, 4, 0, 6.28); g.fill(); }); g.globalAlpha = 1;
  // cars
  cars.forEach(c => {
    g.save(); g.translate(c.x, c.y);
    g.strokeStyle = TEAM[c.team]; g.lineWidth = 4; g.globalAlpha = .9; g.beginPath(); g.arc(0, 0, 31, 0, 6.28); g.stroke(); g.globalAlpha = 1;
    g.rotate(c.a);
    g.fillStyle = c.color; g.beginPath(); g.roundRect(-26, -14, 52, 28, 8); g.fill();
    g.fillStyle = '#0b1220cc'; g.beginPath(); g.roundRect(-4, -10, 16, 20, 4); g.fill();
    g.fillStyle = '#fff'; g.fillRect(22, -11, 4, 6); g.fillRect(22, 5, 4, 6);
    g.restore();
    if (c.human) { g.fillStyle = '#fff'; g.beginPath(); g.moveTo(c.x, c.y - 44); g.lineTo(c.x - 8, c.y - 56); g.lineTo(c.x + 8, c.y - 56); g.fill(); }
  });
  // ball
  g.save(); g.translate(ball.x, ball.y); g.rotate(ball.rot);
  g.shadowColor = '#fff'; g.shadowBlur = 14; g.fillStyle = '#f4f7ff'; g.beginPath(); g.arc(0, 0, ball.r, 0, 6.28); g.fill(); g.shadowBlur = 0;
  g.fillStyle = '#1b2535'; for (let i = 0; i < 3; i++) { g.rotate(2.09); g.beginPath(); g.arc(ball.r * .55, 0, ball.r * .22, 0, 6.28); g.fill(); }
  g.restore();
}
requestAnimationFrame(loop);
