import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// --- Scene & Camera Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1e242b);
scene.fog = new THREE.Fog(0x1e242b, 16, 48);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

for (let z = -10; z <= 10; z += 10) {
  const light = new THREE.PointLight(0xfff5e0, 0.85, 26);
  light.position.set(0, 5.5, z);
  light.castShadow = true;
  scene.add(light);

  const fixture = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 0.12, 0.8),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  fixture.position.set(0, 5.92, z);
  scene.add(fixture);
}

// --- Classroom Architecture (24m x 30m) ---
const roomWidth = 24;
const roomLength = 30;
const roomHeight = 6;

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(roomWidth, roomLength),
  new THREE.MeshStandardMaterial({ color: 0x4a5058, roughness: 0.85 })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

const ceiling = new THREE.Mesh(
  new THREE.PlaneGeometry(roomWidth, roomLength),
  new THREE.MeshStandardMaterial({ color: 0xeae6df })
);
ceiling.rotation.x = Math.PI / 2;
ceiling.position.y = roomHeight;
scene.add(ceiling);

const wallMat = new THREE.MeshStandardMaterial({ color: 0xd6cfc2 });
const frontWall = new THREE.Mesh(new THREE.BoxGeometry(roomWidth, roomHeight, 0.5), wallMat);
frontWall.position.set(0, roomHeight / 2, -roomLength / 2);
scene.add(frontWall);

const backWall = new THREE.Mesh(new THREE.BoxGeometry(roomWidth, roomHeight, 0.5), wallMat);
backWall.position.set(0, roomHeight / 2, roomLength / 2);
scene.add(backWall);

const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, roomHeight, roomLength), wallMat);
leftWall.position.set(-roomWidth / 2, roomHeight / 2, 0);
scene.add(leftWall);

const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, roomHeight, roomLength), wallMat);
rightWall.position.set(roomWidth / 2, roomHeight / 2, 0);
scene.add(rightWall);

// --- Classroom Details ---
const chalkboard = new THREE.Mesh(
  new THREE.BoxGeometry(9.5, 2.5, 0.2),
  new THREE.MeshStandardMaterial({ color: 0x1e3f20 })
);
chalkboard.position.set(-1.5, 3, -roomLength / 2 + 0.3);
scene.add(chalkboard);

const clockMesh = new THREE.Mesh(
  new THREE.CylinderGeometry(0.55, 0.55, 0.1, 24),
  new THREE.MeshStandardMaterial({ color: 0xffffff })
);
clockMesh.rotation.x = Math.PI / 2;
clockMesh.position.set(-1.5, 4.9, -roomLength / 2 + 0.3);
scene.add(clockMesh);

for (let z = -8; z <= 8; z += 8) {
  const win = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 2.5, 4),
    new THREE.MeshStandardMaterial({ color: 0x87ceeb, emissive: 0x1d3b58 })
  );
  win.position.set(-roomWidth / 2 + 0.25, 3.2, z);
  scene.add(win);
}

for (let z = -6; z <= 4; z += 10) {
  const shelf = new THREE.Mesh(
    new THREE.BoxGeometry(1, 3.5, 2.5),
    new THREE.MeshStandardMaterial({ color: 0x5c3a21 })
  );
  shelf.position.set(roomWidth / 2 - 0.7, 1.75, z);
  scene.add(shelf);
}

// --- Escape Route 1: Front Door ---
const exitDoor = new THREE.Mesh(
  new THREE.BoxGeometry(2.3, 3.8, 0.5),
  new THREE.MeshStandardMaterial({ color: 0x28a745 })
);
exitDoor.position.set(7.5, 1.9, -roomLength / 2 + 0.3);
scene.add(exitDoor);

const doorKnob = new THREE.Mesh(
  new THREE.SphereGeometry(0.12, 12, 12),
  new THREE.MeshStandardMaterial({ color: 0xf1c40f })
);
doorKnob.position.set(6.7, 1.8, -roomLength / 2 + 0.6);
scene.add(doorKnob);

// --- Escape Route 2: Air Vent ---
const vent = new THREE.Mesh(
  new THREE.BoxGeometry(0.4, 1.4, 1.6),
  new THREE.MeshStandardMaterial({ color: 0x7f8c8d, metalness: 0.6, roughness: 0.4 })
);
vent.position.set(roomWidth / 2 - 0.25, 0.85, 10.5);
scene.add(vent);

// --- Character Builders ---
function createStudent(shirtColor) {
  const student = new THREE.Group();

  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(0.58, 0.72, 0.34),
    new THREE.MeshStandardMaterial({ color: shirtColor })
  );
  torso.position.y = 1.02;
  torso.castShadow = true;
  student.add(torso);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.23, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xf1c27d })
  );
  head.position.y = 1.58;
  head.rotation.x = 0.35;
  student.add(head);

  const arm = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.5, 0.16),
    new THREE.MeshStandardMaterial({ color: shirtColor })
  );
  arm.position.set(0.32, 1.05, 0.22);
  arm.rotation.x = -0.8;
  student.add(arm);

  const pencil = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 0.25),
    new THREE.MeshStandardMaterial({ color: 0xf1c40f })
  );
  pencil.position.set(0.32, 0.95, 0.42);
  pencil.rotation.x = 0.5;
  student.add(pencil);

  return { group: student, arm };
}

function createTeacher() {
  const teacherGroup = new THREE.Group();

  const headPivot = new THREE.Group();
  headPivot.position.set(0, 2.0, 0);
  teacherGroup.add(headPivot);

  const loader = new GLTFLoader();
  loader.load('teacher.glb', (gltf) => {
    const model = gltf.scene;
    model.scale.set(1.5, 1.5, 1.5);
    model.position.y = 0;
    teacherGroup.add(model);
  }, undefined, (error) => {
    console.error('Error loading teacher.glb model:', error);
  });

  return { group: teacherGroup, headPivot };
}

// --- Desks, Drawers, Loot & Students ---
const deskMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b });
const drawerMat = new THREE.MeshStandardMaterial({ color: 0x6e441d });
const chairMat = new THREE.MeshStandardMaterial({ color: 0x2c3e50 });
const notebookMat = new THREE.MeshStandardMaterial({ color: 0xf8f9fa });
const shirtColors = [0x3498db, 0x9b59b6, 0xe67e22, 0x1abc9c, 0x7f8c8d, 0xe74c3c];

const colliders = [];
const desks = [];
const workingStudents = [];

const cols = [-7.5, -2.5, 2.5, 7.5];
const rows = [-5, -1, 3, 7, 11];

rows.forEach((z, rIdx) => {
  cols.forEach((x, cIdx) => {
    const desk = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.0, 1.3), deskMat);
    desk.position.set(x, 0.5, z);
    desk.castShadow = true;
    desk.receiveShadow = true;
    scene.add(desk);
    colliders.push({ x, z, w: 2.3, d: 1.5 });

    const notebook = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.04, 0.6), notebookMat);
    notebook.position.set(x, 1.02, z + 0.15);
    scene.add(notebook);

    const drawer = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.24, 0.9), drawerMat);
    drawer.position.set(x, 0.78, z + 0.15);
    scene.add(drawer);

    const chair = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.55, 0.8), chairMat);
    chair.position.set(x, 0.275, z + 0.95);
    scene.add(chair);

    const seatPos = new THREE.Vector3(x, 1.38, z + 0.95);
    const isPlayerStart = rIdx === 3 && cIdx === 1;
    const isOccupied = !isPlayerStart && (rIdx + cIdx) % 2 === 0;

    if (isOccupied) {
      const stu = createStudent(shirtColors[(rIdx + cIdx) % shirtColors.length]);
      stu.group.position.set(x, 0, z + 0.95);
      stu.group.rotation.y = Math.PI;
      scene.add(stu.group);
      workingStudents.push(stu);
    }

    desks.push({
      x,
      z,
      seatPos,
      occupied: isOccupied,
      drawerMesh: drawer,
      drawerOpen: false,
      looted: false,
      loot: 'EMPTY'
    });
  });
});

// --- Teacher Setup ---
const teacherDesk = new THREE.Mesh(
  new THREE.BoxGeometry(4.2, 1.1, 1.6),
  new THREE.MeshStandardMaterial({ color: 0x4a2e15 })
);
teacherDesk.position.set(2.2, 0.55, -10.5);
teacherDesk.castShadow = true;
scene.add(teacherDesk);
colliders.push({ x: 2.2, z: -10.5, w: 4.4, d: 1.8 });

const gradingStack = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 0.5), notebookMat);
gradingStack.position.set(2.2, 1.14, -10.5);
scene.add(gradingStack);

const teacherObj = createTeacher();
const teacher = teacherObj.group;
const teacherHead = teacherObj.headPivot;

const coneGeo = new THREE.ConeGeometry(5.2, 16, 32, 1, true);
coneGeo.translate(0, -8, 0);
coneGeo.rotateX(-Math.PI / 2);
const coneMat = new THREE.MeshBasicMaterial({
  color: 0xff2222,
  transparent: true,
  opacity: 0.18,
  side: THREE.DoubleSide
});
const visionCone = new THREE.Mesh(coneGeo, coneMat);
visionCone.position.set(0, 1.65, 0);
teacher.add(visionCone);

const teacherHome = new THREE.Vector3(2.2, 0, -12.0);
teacher.position.copy(teacherHome);
scene.add(teacher);

// --- Game State & Inventory ---
const controls = new PointerLockControls(camera, document.body);
let currentDesk = desks.find((d) => d.seatPos.x === -2.5 && d.seatPos.z === 7.95) || desks[0];
camera.position.copy(currentDesk.seatPos);

let isSeated = true;
let gameActive = false;
let isCutsceneActive = false;
let teacherState = 'GRADING';
let stateTimer = 4.0;
let distractionPos = null;
let unlockProgress = 0;
let strikes = 3; // 3 strikes allowed!

let inventory = {
  paper: 3,
  key: false,
  screwdriver: false
};

function distributeLoot() {
  desks.forEach((d) => {
    d.drawerOpen = false;
    d.looted = false;
    d.drawerMesh.position.z = d.z + 0.15;
    d.loot = 'EMPTY';
  });

  const freeDesks = desks.filter((d) => !d.occupied);
  freeDesks.sort(() => Math.random() - 0.5);

  if (freeDesks[0]) freeDesks[0].loot = 'KEY';
  if (freeDesks[1]) freeDesks[1].loot = 'SCREWDRIVER';
  if (freeDesks[2]) freeDesks[2].loot = 'PAPER';
  if (freeDesks[3]) freeDesks[3].loot = 'PAPER';
}

// --- Input Controls ---
const keys = {};
document.addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (!gameActive) return;

  if (e.code === 'Space') {
    if (isSeated) {
      isSeated = false;
      camera.position.set(currentDesk.seatPos.x + 1.35, 1.7, currentDesk.seatPos.z);
    } else {
      const nearbyDesk = getNearbyDesk(2.3);
      if (nearbyDesk && !nearbyDesk.occupied) {
        isSeated = true;
        currentDesk = nearbyDesk;
        camera.position.copy(nearbyDesk.seatPos);
      } else if (nearbyDesk && nearbyDesk.occupied) {
        showPrompt('That desk is occupied by another student!');
      }
    }
    updateHUD();
  }

  if (e.code === 'KeyF' && !isSeated) {
    const nearbyDesk = getNearbyDesk(2.6);
    if (nearbyDesk) {
      if (nearbyDesk.occupied) {
        showPrompt("Can't search a desk while someone is sitting there!");
        return;
      }

      nearbyDesk.drawerOpen = !nearbyDesk.drawerOpen;
      const targetZ = nearbyDesk.drawerOpen ? nearbyDesk.z + 0.65 : nearbyDesk.z + 0.15;
      
      let slideProgress = 0;
      const startZ = nearbyDesk.drawerMesh.position.z;
      function animateDrawer() {
        slideProgress += 0.1;
        nearbyDesk.drawerMesh.position.z = THREE.MathUtils.lerp(startZ, targetZ, slideProgress);
        if (slideProgress < 1.0) {
          requestAnimationFrame(animateDrawer);
        }
      }
      animateDrawer();

      if (nearbyDesk.drawerOpen && !nearbyDesk.looted) {
        nearbyDesk.looted = true;
        if (nearbyDesk.loot === 'KEY') {
          inventory.key = true;
          showPrompt('Found the FRONT DOOR KEY inside the desk drawer!');
        } else if (nearbyDesk.loot === 'SCREWDRIVER') {
          inventory.screwdriver = true;
          showPrompt('Found a SCREWDRIVER! (Use on the wall vent)');
        } else if (nearbyDesk.loot === 'PAPER') {
          inventory.paper += 2;
          showPrompt('Found 2 extra Paper Balls!');
        } else {
          showPrompt('The drawer is empty.');
        }
        updateHUD();
      } else if (!nearbyDesk.drawerOpen) {
        showPrompt('Closed the desk drawer.');
      }
    }
  }

  if (e.code === 'KeyT') {
    throwDistraction();
  }
});

document.addEventListener('keyup', (e) => (keys[e.code] = false));

function getNearbyDesk(maxDist) {
  let closest = null;
  let minD = maxDist;
  for (const d of desks) {
    const dist = camera.position.distanceTo(d.seatPos);
    if (dist < minD) {
      minD = dist;
      closest = d;
    }
  }
  return closest;
}

let promptTimeout;
function showPrompt(msg) {
  const el = document.getElementById('prompt-msg');
  el.textContent = msg;
  clearTimeout(promptTimeout);
  promptTimeout = setTimeout(() => {
    el.textContent = '';
  }, 3000);
}

const overlay = document.getElementById('overlay');
const startBtn = document.getElementById('start-btn');
startBtn.addEventListener('click', () => {
  if (strikes <= 0) {
    strikes = 3; // Reset strikes on full game restart
  }
  isCutsceneActive = false;
  resetGame();
  controls.lock();
});

controls.addEventListener('lock', () => {
  overlay.classList.add('hidden');
  gameActive = true;
});

controls.addEventListener('unlock', () => {
  if (gameActive && !isCutsceneActive) {
    overlay.classList.remove('hidden');
    document.getElementById('overlay-title').textContent = 'Paused';
    startBtn.textContent = 'Resume';
  }
});

function throwDistraction() {
  if (inventory.paper <= 0) {
    showPrompt('No paper balls left! Search desk drawers (F).');
    return;
  }
  inventory.paper--;
  updateHUD();

  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  const startPos = camera.position.clone();
  const target = startPos.clone().add(dir.multiplyScalar(10));
  target.x = THREE.MathUtils.clamp(target.x, -roomWidth / 2 + 1, roomWidth / 2 - 1);
  target.z = THREE.MathUtils.clamp(target.z, -roomLength / 2 + 1, roomLength / 2 - 1);
  target.y = 0.2;

  const paper = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.22, 0),
    new THREE.MeshStandardMaterial({ color: 0xffffff })
  );
  paper.position.copy(startPos);
  scene.add(paper);

  let flightProgress = 0;
  function animatePaper() {
    flightProgress += 0.04;
    paper.position.lerpVectors(startPos, target, flightProgress);
    paper.rotation.x += 0.2;
    paper.rotation.y += 0.2;

    if (flightProgress < 1.0) {
      requestAnimationFrame(animatePaper);
    } else {
      distractionPos = target;
      teacherState = 'WHITEBOARD_WRITING';
      stateTimer = 6.0;
      showPrompt('Paper ball landed! The teacher goes to write on the whiteboard.');
      setTimeout(() => scene.remove(paper), 6000);
    }
  }
  animatePaper();
}

function updateHUD() {
  const stateEl = document.getElementById('teacher-state');
  if (teacherState === 'GRADING') {
    stateEl.textContent = `Grading (Safe) | Strikes Left: ${strikes}/3`;
    stateEl.style.color = '#4dff88';
  } else if (teacherState === 'WATCHING') {
    stateEl.textContent = `SCANNING! | Strikes Left: ${strikes}/3`;
    stateEl.style.color = '#ff4d4d';
  } else {
    stateEl.textContent = `CAM 121: Writing on Whiteboard! | Strikes: ${strikes}/3`;
    stateEl.style.color = '#ffaa00';
  }

  document.getElementById('seat-status').innerHTML = isSeated
    ? 'State: Seated (Press <b>SPACE</b> to Stand)'
    : 'State: Standing! (Press <b>SPACE</b> at any empty desk to Sit | Press <b>F</b> to open/close drawers)';

  const items = [`Paper Balls (${inventory.paper}) [Press T to Throw]`];
  if (inventory.key) items.push('Door Key');
  if (inventory.screwdriver) items.push('Screwdriver');
  document.getElementById('inv-list').textContent = items.join(' | ');
}

function triggerCam121Cutscene() {
  if (isCutsceneActive) return;
  isCutsceneActive = true;
  gameActive = false;
  controls.unlock();

  strikes--; // Lose 1 strike out of 3

  // Teleport player temporarily into CAM 121 room coordinates
  camera.position.set(-40, 1.7, -40);
  camera.lookAt(0, 1.7, -40);

  overlay.classList.remove('hidden');

  if (strikes > 0) {
    document.getElementById('overlay-title').textContent = `BUSTED! Dragged to CAM 121 (${strikes} Strikes Left)`;
    document.getElementById('overlay-text').textContent = 
      `The teacher dragged you into CAM 121 and started writing aggressively on the whiteboard! You have ${strikes} strikes left before permanent detention failure. Click below to sneak back out.`;
    startBtn.textContent = 'Sneak Back to Classroom';
  } else {
    document.getElementById('overlay-title').textContent = 'PERMANENT DETENTION! (Game Over)';
    document.getElementById('overlay-text').textContent = 
      'You got caught 3 times! The teacher locked you in CAM 121 forever. Game over!';
    startBtn.textContent = 'Play Again';
  }
}

function endGame(title, text) {
  gameActive = false;
  controls.unlock();
  overlay.classList.remove('hidden');
  document.getElementById('overlay-title').textContent = title;
  document.getElementById('overlay-text').textContent = text;
  startBtn.textContent = 'Play Again';
}

function resetGame() {
  if (strikes <= 0) {
    strikes = 3;
  }
  distributeLoot();
  inventory = { paper: 3, key: false, screwdriver: false };
  isSeated = true;
  currentDesk = desks.find((d) => !d.occupied && d.z === 7) || desks[0];
  camera.position.copy(currentDesk.seatPos);

  teacher.position.copy(teacherHome);
  teacher.rotation.set(0, 0, 0);
  teacherHead.rotation.x = 0.45;
  teacherState = 'GRADING';
  stateTimer = 4.0;
  unlockProgress = 0;
  document.getElementById('unlock-bar').style.width = '0%';
  updateHUD();
}

function checkDeskCollision(nextX, nextZ) {
  for (const box of colliders) {
    if (
      Math.abs(nextX - box.x) < box.w / 2 + 0.3 &&
      Math.abs(nextZ - box.z) < box.d / 2 + 0.3
    ) {
      return true;
    }
  }
  return false;
}

// --- Main Game Loop ---
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  const elapsed = clock.elapsedTime;

  workingStudents.forEach((stu, i) => {
    stu.arm.rotation.z = Math.sin(elapsed * 8 + i) * 0.12;
  });

  if (gameActive) {
    if (!isSeated) {
      const prevX = camera.position.x;
      const prevZ = camera.position.z;
      const speed = 4.5 * delta;

      if (keys['KeyW']) controls.moveForward(speed);
      if (keys['KeyS']) controls.moveForward(-speed);
      if (keys['KeyA']) controls.moveRight(-speed);
      if (keys['KeyD']) controls.moveRight(speed);

      camera.position.x = THREE.MathUtils.clamp(camera.position.x, -roomWidth / 2 + 0.8, roomWidth / 2 - 0.8);
      camera.position.z = THREE.MathUtils.clamp(camera.position.z, -roomLength / 2 + 0.8, roomLength / 2 - 0.8);

      if (checkDeskCollision(camera.position.x, camera.position.z)) {
        camera.position.x = prevX;
        camera.position.z = prevZ;
      }
    }

    stateTimer -= delta;
    if (teacherState === 'GRADING') {
      visionCone.visible = false;
      teacherHead.rotation.x = THREE.MathUtils.lerp(teacherHead.rotation.x, 0.5, delta * 5);
      teacher.position.lerp(teacherHome, delta * 2);
      teacher.lookAt(2.2, 0, 0);
      if (stateTimer <= 0) {
        teacherState = 'WATCHING';
        stateTimer = 4.5;
      }
    } else if (teacherState === 'WATCHING') {
      visionCone.visible = true;
      teacherHead.rotation.x = THREE.MathUtils.lerp(teacherHead.rotation.x, -0.05, delta * 5);
      teacher.position.x = 2.2 + Math.sin(elapsed * 0.8) * 3.0;
      teacher.rotation.y = Math.sin(elapsed * 1.4) * 0.75;
      if (stateTimer <= 0) {
        teacherState = 'GRADING';
        stateTimer = 4.0;
      }
    } else if (teacherState === 'WHITEBOARD_WRITING') {
      visionCone.visible = true;
      // Teacher goes to whiteboard and writes aggressively!
      const whiteboardPos = new THREE.Vector3(-1.5, 0, -roomLength / 2 + 1.2);
      teacher.position.lerp(whiteboardPos, delta * 3.0);
      teacher.lookAt(-1.5, 2.0, -roomLength / 2);

      teacherHead.rotation.x = Math.sin(elapsed * 15) * 0.08 + 0.2; 
      teacher.rotation.y = Math.sin(elapsed * 20) * 0.05;

      if (stateTimer <= 0) {
        teacherState = 'GRADING';
        stateTimer = 4.0;
        showPrompt('Teacher finishes writing and resumes supervision...');
      }
    }
    updateHUD();

    if (!isSeated && visionCone.visible) {
      const toPlayer = new THREE.Vector3().subVectors(camera.position, teacher.position);
      const distance = toPlayer.length();
      toPlayer.normalize();

      const teacherForward = new THREE.Vector3(0, 0, 1).applyQuaternion(teacher.quaternion);
      const angle = teacherForward.angleTo(toPlayer);

      if (distance < 15.5 && angle < 0.42) {
        triggerCam121Cutscene();
      }
    }

    const distToDoor = camera.position.distanceTo(exitDoor.position);
    const distToVent = camera.position.distanceTo(vent.position);
    const barContainer = document.getElementById('unlock-bar-container');

    if (!isSeated && distToDoor < 3.0) {
      barContainer.classList.remove('hidden');
      if (!inventory.key) {
        showPrompt('Locked! Find the Door Key inside a desk drawer.');
      } else if (keys['KeyE']) {
        unlockProgress += delta * 40;
        document.getElementById('unlock-bar').style.width = `${unlockProgress}%`;
        if (unlockProgress >= 100) {
          endGame('You Escaped!', 'You unlocked the front door right past the teacher!');
        }
      }
    } else if (!isSeated && distToVent < 2.8) {
      barContainer.classList.remove('hidden');
      if (!inventory.screwdriver) {
        showPrompt('Screwed shut! Find a Screwdriver inside a desk drawer.');
      } else if (keys['KeyE']) {
        unlockProgress += delta * 40;
        document.getElementById('unlock-bar').style.width = `${unlockProgress}%`;
        if (unlockProgress >= 100) {
          endGame('You Escaped!', 'You unscrewed the air vent and crawled out of detention!');
        }
      }
    } else {
      barContainer.classList.add('hidden');
      unlockProgress = 0;
      document.getElementById('unlock-bar').style.width = '0%';
    }
  }

  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
