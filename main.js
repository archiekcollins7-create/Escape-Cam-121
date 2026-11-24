import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// --- Scene & Camera Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1e242b);
scene.fog = new THREE.Fog(0x1e242b, 15, 45);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
scene.add(ambientLight);

for (let z = -10; z <= 10; z += 10) {
  const light = new THREE.PointLight(0xfff5e0, 0.9, 25);
  light.position.set(0, 5.5, z);
  light.castShadow = true;
  scene.add(light);

  const fixture = new THREE.Mesh(
    new THREE.BoxGeometry(3, 0.15, 0.8),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  fixture.position.set(0, 5.9, z);
  scene.add(fixture);
}

// --- Big Room Architecture (24m wide x 30m long) ---
const roomWidth = 24;
const roomLength = 30;
const roomHeight = 6;

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(roomWidth, roomLength),
  new THREE.MeshStandardMaterial({ color: 0x4a5058, roughness: 0.8 })
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
  new THREE.BoxGeometry(10, 2.5, 0.2),
  new THREE.MeshStandardMaterial({ color: 0x1e3f20 })
);
chalkboard.position.set(0, 3, -roomLength / 2 + 0.3);
scene.add(chalkboard);

for (let z = -8; z <= 8; z += 8) {
  const windowFrame = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 2.5, 4),
    new THREE.MeshStandardMaterial({ color: 0x87ceeb, emissive: 0x224466 })
  );
  windowFrame.position.set(-roomWidth / 2 + 0.25, 3.2, z);
  scene.add(windowFrame);
}

for (let z = -6; z <= 6; z += 6) {
  const shelf = new THREE.Mesh(
    new THREE.BoxGeometry(1, 3.5, 2.5),
    new THREE.MeshStandardMaterial({ color: 0x5c3a21 })
  );
  shelf.position.set(roomWidth / 2 - 0.7, 1.75, z);
  scene.add(shelf);
}

const exitDoor = new THREE.Mesh(
  new THREE.BoxGeometry(2.4, 3.8, 0.6),
  new THREE.MeshStandardMaterial({ color: 0x28a745 })
);
exitDoor.position.set(0, 1.9, roomLength / 2 - 0.1);
scene.add(exitDoor);

// --- Helper Function to Build Characters ---
function createPerson(shirtColor, pantsColor) {
  const person = new THREE.Group();

  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.75, 0.35),
    new THREE.MeshStandardMaterial({ color: shirtColor })
  );
  torso.position.y = 1.05;
  torso.castShadow = true;
  person.add(torso);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.24, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xf1c27d })
  );
  head.position.y = 1.65;
  head.castShadow = true;
  person.add(head);

  const legs = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.7, 0.35),
    new THREE.MeshStandardMaterial({ color: pantsColor })
  );
  legs.position.y = 0.35;
  person.add(legs);

  return person;
}

// --- Desks & Other Detention Students ---
const deskMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b });
const chairMat = new THREE.MeshStandardMaterial({ color: 0x2c3e50 });
const shirtColors = [0x3498db, 0x9b59b6, 0xe67e22, 0x1abc9c, 0x95a5a6, 0xf1c40f];
const colliders = [];

const playerRow = 3;
const playerCol = 1;
let playerSeatPos = new THREE.Vector3();

const cols = [-7.5, -2.5, 2.5, 7.5];
const rows = [-6, -2, 2, 6, 10];

rows.forEach((z, rIdx) => {
  cols.forEach((x, cIdx) => {
    const desk = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.0, 1.3), deskMat);
    desk.position.set(x, 0.5, z);
    desk.castShadow = true;
    desk.receiveShadow = true;
    scene.add(desk);
    colliders.push({ x, z, w: 2.3, d: 1.5 });

    const chair = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.55, 0.8), chairMat);
    chair.position.set(x, 0.275, z + 0.9);
    scene.add(chair);

    if (rIdx === playerRow && cIdx === playerCol) {
      playerSeatPos.set(x, 1.35, z + 0.9);
    } else if ((rIdx + cIdx) % 2 === 0) {
      const color = shirtColors[(rIdx + cIdx) % shirtColors.length];
      const student = createPerson(color, 0x2c3e50);
      student.position.set(x, 0, z + 0.9);
      student.rotation.y = Math.PI;
      scene.add(student);
    }
  });
});

// --- Main Teacher & Teacher's Desk ---
const teacherDesk = new THREE.Mesh(
  new THREE.BoxGeometry(4.2, 1.1, 1.6),
  new THREE.MeshStandardMaterial({ color: 0x4a2e15 })
);
teacherDesk.position.set(0, 0.55, -10.5);
teacherDesk.castShadow = true;
scene.add(teacherDesk);
colliders.push({ x: 0, z: -10.5, w: 4.4, d: 1.8 });

const teacher = createPerson(0xb03a2e, 0x1c2833);
teacher.scale.set(1.15, 1.15, 1.15);

const coneGeo = new THREE.ConeGeometry(4.8, 14, 32, 1, true);
coneGeo.translate(0, -7, 0);
coneGeo.rotateX(-Math.PI / 2);
const coneMat = new THREE.MeshBasicMaterial({
  color: 0xff2222,
  transparent: true,
  opacity: 0.18,
  side: THREE.DoubleSide
});
const visionCone = new THREE.Mesh(coneGeo, coneMat);
visionCone.position.set(0, 1.5, 0);
teacher.add(visionCone);

const teacherHome = new THREE.Vector3(0, 0, -12);
teacher.position.copy(teacherHome);
scene.add(teacher);

// --- Player & Controls ---
const controls = new PointerLockControls(camera, document.body);
camera.position.copy(playerSeatPos);

let isSeated = true;
let gameActive = false;
let teacherState = 'GRADING';
let stateTimer = 3.5;
let distractionPos = null;
let unlockProgress = 0;

const keys = {};
document.addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (!gameActive) return;

  if (e.code === 'Space') {
    if (isSeated) {
      isSeated = false;
      camera.position.set(playerSeatPos.x + 1.4, 1.7, playerSeatPos.z);
    } else if (camera.position.distanceTo(playerSeatPos) < 2.4) {
      isSeated = true;
      camera.position.copy(playerSeatPos);
    }
    updateHUD();
  }

  if (e.code === 'KeyT') {
    throwDistraction();
  }
});

document.addEventListener('keyup', (e) => (keys[e.code] = false));

const overlay = document.getElementById('overlay');
const startBtn = document.getElementById('start-btn');
startBtn.addEventListener('click', () => {
  resetGame();
  controls.lock();
});

controls.addEventListener('lock', () => {
  overlay.classList.add('hidden');
  gameActive = true;
});

controls.addEventListener('unlock', () => {
  if (gameActive) {
    overlay.classList.remove('hidden');
    document.getElementById('overlay-title').textContent = 'Paused';
    startBtn.textContent = 'Resume';
  }
});

function throwDistraction() {
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  const target = camera.position.clone().add(dir.multiplyScalar(9));
  target.x = THREE.MathUtils.clamp(target.x, -roomWidth / 2 + 1, roomWidth / 2 - 1);
  target.z = THREE.MathUtils.clamp(target.z, -roomLength / 2 + 1, roomLength / 2 - 1);
  target.y = 0.2;

  const paper = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.22, 0),
    new THREE.MeshStandardMaterial({ color: 0xffffff })
  );
  paper.position.copy(target);
  scene.add(paper);

  distractionPos = target;
  teacherState = 'DISTRACTED';
  stateTimer = 5.5;
  setTimeout(() => scene.remove(paper), 5500);
}

function updateHUD() {
  const stateEl = document.getElementById('teacher-state');
  stateEl.textContent =
    teacherState === 'GRADING'
      ? 'Grading Papers (Safe)'
      : teacherState === 'WATCHING'
      ? 'WATCHING THE ROOM!'
      : 'Checking Distraction...';
  stateEl.style.color = teacherState === 'WATCHING' ? '#ff4d4d' : '#4dff88';

  document.getElementById('seat-status').innerHTML = isSeated
    ? 'State: Seated (Press <b>SPACE</b> to Stand)'
    : 'State: Standing! (Press <b>SPACE</b> near your desk to Sit)';
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
  isSeated = true;
  camera.position.copy(playerSeatPos);
  teacher.position.copy(teacherHome);
  teacher.rotation.set(0, 0, 0);
  teacherState = 'GRADING';
  stateTimer = 3.5;
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
      teacher.position.lerp(teacherHome, delta * 2);
      teacher.lookAt(0, 0, 0);
      if (stateTimer <= 0) {
        teacherState = 'WATCHING';
        stateTimer = 4.5;
      }
    } else if (teacherState === 'WATCHING') {
      visionCone.visible = true;
      teacher.position.x = Math.sin(clock.elapsedTime * 0.8) * 3.5;
      teacher.rotation.y = Math.sin(clock.elapsedTime * 1.4) * 0.75;
      if (stateTimer <= 0) {
        teacherState = 'GRADING';
        stateTimer = 3.5;
      }
    } else if (teacherState === 'DISTRACTED' && distractionPos) {
      visionCone.visible = true;
      teacher.lookAt(distractionPos.x, 0, distractionPos.z);
      if (teacher.position.distanceTo(distractionPos) > 1.8) {
        teacher.position.lerp(new THREE.Vector3(distractionPos.x, 0, distractionPos.z), delta * 1.8);
      }
      if (stateTimer <= 0) {
        teacherState = 'GRADING';
        stateTimer = 3;
      }
    }
    updateHUD();

    if (!isSeated && visionCone.visible) {
      const toPlayer = new THREE.Vector3().subVectors(camera.position, teacher.position);
      const distance = toPlayer.length();
      toPlayer.normalize();

      const teacherForward = new THREE.Vector3(0, 0, 1).applyQuaternion(teacher.quaternion);
      const angle = teacherForward.angleTo(toPlayer);

      if (distance < 14 && angle < 0.42) {
        endGame('Caught!', 'The main teacher spotted you out of your seat!');
      }
    }

    const distToDoor = camera.position.distanceTo(exitDoor.position);
    const barContainer = document.getElementById('unlock-bar-container');
    if (!isSeated && distToDoor < 3.0) {
      barContainer.classList.remove('hidden');
      if (keys['KeyE']) {
        unlockProgress += delta * 38;
        document.getElementById('unlock-bar').style.width = `${unlockProgress}%`;
        if (unlockProgress >= 100) {
          endGame('You Escaped!', 'You snuck past the teacher and escaped detention!');
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
