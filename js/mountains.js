import * as THREE from 'three';

/* ---------- tiny seeded 2D value-noise (no external deps) ---------- */
function makeNoise2D(seed = 1337) {
  const perm = new Uint8Array(512);
  let s = seed;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];

  const fade = t => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp = (a, b, t) => a + t * (b - a);
  const grad = (hash, x, y) => {
    const h = hash & 7;
    const u = h < 4 ? x : y;
    const v = h < 4 ? y : x;
    return ((h & 1) ? -u : u) + ((h & 2) ? -2 * v : 2 * v);
  };

  return function noise2D(x, y) {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x), yf = y - Math.floor(y);
    const u = fade(xf), v = fade(yf);
    const aa = perm[X + perm[Y]], ab = perm[X + perm[Y + 1]];
    const ba = perm[X + 1 + perm[Y]], bb = perm[X + 1 + perm[Y + 1]];
    const x1 = lerp(grad(aa, xf, yf), grad(ba, xf - 1, yf), u);
    const x2 = lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u);
    return (lerp(x1, x2, v) + 1) / 2;
  };
}

function fbm(noise2D, x, y, octaves = 5) {
  let total = 0, amp = 1, freq = 1, max = 0;
  for (let i = 0; i < octaves; i++) {
    total += noise2D(x * freq, y * freq) * amp;
    max += amp;
    amp *= 0.5;
    freq *= 2.05;
  }
  return total / max;
}

/* ---------- named peaks of the Wasatch, roughly west-to-east feel ---------- */
const PEAK_FACTS = [
  { name: 'Mount Olympus', fact: 'Rising 9,026 feet directly above Salt Lake City, its granite face is the valley’s most recognizable skyline landmark.' },
  { name: 'Twin Peaks', fact: 'Two 11,000-foot summits above Cottonwood Heights, visible from nearly every seat in the Jazz’s arena downtown.' },
  { name: 'Lone Peak', fact: 'An 11,253-foot granite spire, the northern anchor of the Lone Peak Wilderness, first protected in 1978 — a year before the Jazz arrived.' },
  { name: 'Mount Timpanogos', fact: 'At 11,752 feet, "Timp" is the second-highest peak in the range and a training climb for generations of Utahns.' },
  { name: 'Grandeur Peak', fact: 'A modest 8,299-foot summit overlooking the valley — the mountain most Salt Lake City kids climb first.' },
];

export const mountainScene = { camera: null, activePeaks: [] };

const canvas = document.getElementById('mountain-canvas');
const hero = document.getElementById('hero');
const tooltip = document.getElementById('peak-tooltip');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x160a29);
scene.fog = new THREE.FogExp2(0x1a0e30, 0.016);

const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 500);
camera.position.set(0, 9, 46);
mountainScene.camera = camera;

/* lights */
const sun = new THREE.DirectionalLight(0xffd9a0, 1.4);
sun.position.set(-30, 40, 20);
scene.add(sun);
scene.add(new THREE.AmbientLight(0x6a4fa8, 0.65));
const rim = new THREE.DirectionalLight(0x8b5cf6, 0.5);
rim.position.set(20, 10, -30);
scene.add(rim);

/* sky gradient dome */
{
  const skyGeo = new THREE.SphereGeometry(300, 24, 16);
  const skyMat = new THREE.ShaderMaterial({
    uniforms: {
      top: { value: new THREE.Color(0x0c0714) },
      bottom: { value: new THREE.Color(0x5a2f8f) },
    },
    vertexShader: `varying vec3 vPos; void main(){ vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `
      varying vec3 vPos;
      uniform vec3 top; uniform vec3 bottom;
      void main() {
        float h = normalize(vPos).y * 0.5 + 0.5;
        gl_FragColor = vec4(mix(bottom, top, pow(h, 0.7)), 1.0);
      }`,
    side: THREE.BackSide,
  });
  scene.add(new THREE.Mesh(skyGeo, skyMat));
}

/* stars */
{
  const starCount = 700;
  const positions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const r = 150 + Math.random() * 120;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI * 0.5;
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = Math.abs(r * Math.cos(phi)) * 0.6 + 20;
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta) - 40;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5, transparent: true, opacity: 0.6 });
  scene.add(new THREE.Points(geo, mat));
}

/* ---------- build a mountain ridge layer ---------- */
function buildRidge({ seed, width, depth, segX, segZ, zPos, baseHeight, ampScale, colorLow, colorHigh, snowLine }) {
  const noise2D = makeNoise2D(seed);
  const geo = new THREE.PlaneGeometry(width, depth, segX, segZ);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const cLow = new THREE.Color(colorLow);
  const cHigh = new THREE.Color(colorHigh);
  const cSnow = new THREE.Color(0xf5f0ff);

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const edgeFade = Math.max(0, 1 - Math.abs(z / (depth / 2)) * 1.15);
    let h = fbm(noise2D, x * 0.045, z * 0.09, 5) * ampScale * edgeFade;
    h += Math.max(0, fbm(noise2D, x * 0.02 + 100, 4.2, 4) * ampScale * 0.5) * edgeFade;
    h = Math.max(h, 0);
    pos.setY(i, baseHeight + h);

    const t = THREE.MathUtils.clamp(h / (ampScale * 0.9), 0, 1);
    let col;
    if (h > snowLine) {
      const snowT = THREE.MathUtils.clamp((h - snowLine) / (ampScale * 0.25), 0, 1);
      col = cHigh.clone().lerp(cSnow, snowT);
    } else {
      col = cLow.clone().lerp(cHigh, t);
    }
    colors[i * 3] = col.r;
    colors[i * 3 + 1] = col.g;
    colors[i * 3 + 2] = col.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0, flatShading: false });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.z = zPos;
  scene.add(mesh);
  return { mesh, noise2D, ampScale, baseHeight, width, depth };
}

const farRidge = buildRidge({
  seed: 7, width: 420, depth: 160, segX: 140, segZ: 60, zPos: -70,
  baseHeight: 2, ampScale: 30, colorLow: 0x2c1a4d, colorHigh: 0x6a4fa8, snowLine: 21,
});
const midRidge = buildRidge({
  seed: 42, width: 360, depth: 140, segX: 160, segZ: 70, zPos: -30,
  baseHeight: 0, ampScale: 24, colorLow: 0x241238, colorHigh: 0x54308a, snowLine: 16,
});
const nearRidge = buildRidge({
  seed: 99, width: 320, depth: 130, segX: 180, segZ: 80, zPos: 6,
  baseHeight: -2, ampScale: 17, colorLow: 0x120a1f, colorHigh: 0x2f1a4f, snowLine: 12,
});

/* valley floor */
{
  const floorGeo = new THREE.PlaneGeometry(500, 200, 1, 1);
  floorGeo.rotateX(-Math.PI / 2);
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x0e0819, roughness: 1 });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.position.y = -3.2;
  floor.position.z = 20;
  scene.add(floor);
}

/* ---------- interactive peak markers ---------- */
const peakMarkers = [];
const raycaster = new THREE.Raycaster();
const pointerNDC = new THREE.Vector2();

function samplePeaks(ridge, count, labelPool) {
  const { noise2D, ampScale, baseHeight, width, depth } = ridge;
  const found = [];
  for (let i = 0; i < 400 && found.length < count; i++) {
    const x = (Math.random() - 0.5) * width * 0.7;
    const z = (Math.random() - 0.5) * depth * 0.5;
    const edgeFade = Math.max(0, 1 - Math.abs(z / (depth / 2)) * 1.15);
    let h = fbm(noise2D, x * 0.045, z * 0.09, 5) * ampScale * edgeFade;
    h += Math.max(0, fbm(noise2D, x * 0.02 + 100, 4.2, 4) * ampScale * 0.5) * edgeFade;
    if (h > ampScale * 0.62) {
      found.push(new THREE.Vector3(x, baseHeight + h + 1.2, ridge.mesh.position.z + z));
    }
  }
  found.sort((a, b) => b.x - a.x);
  return found.slice(0, count).map((pos, i) => ({ pos, info: labelPool[i % labelPool.length] }));
}

const markerGeo = new THREE.SphereGeometry(0.55, 12, 12);
const markerMat = new THREE.MeshBasicMaterial({ color: 0xf9a01b, transparent: true, opacity: 0.85 });

function scatterMarkers() {
  const picks = samplePeaks(farRidge, PEAK_FACTS.length, PEAK_FACTS);
  picks.forEach(({ pos, info }) => {
    const m = new THREE.Mesh(markerGeo, markerMat.clone());
    m.position.copy(pos);
    m.userData.info = info;
    scene.add(m);
    peakMarkers.push(m);
  });
}
scatterMarkers();

/* ---------- responsive sizing ---------- */
function resize() {
  const w = hero.clientWidth, h = hero.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
resize();
window.addEventListener('resize', resize);

/* ---------- mouse parallax + scroll dolly ---------- */
let mouseX = 0, mouseY = 0;
let targetRotY = 0, targetRotX = 0;
let baseCamPos = new THREE.Vector3(0, 9, 46);

hero.addEventListener('mousemove', (e) => {
  const rect = hero.getBoundingClientRect();
  mouseX = (e.clientX - rect.left) / rect.width - 0.5;
  mouseY = (e.clientY - rect.top) / rect.height - 0.5;
  targetRotY = mouseX * 0.35;
  targetRotX = mouseY * 0.12;

  pointerNDC.x = mouseX * 2;
  pointerNDC.y = -mouseY * 2;
});

hero.addEventListener('mouseleave', () => { targetRotY = 0; targetRotX = 0; });

hero.addEventListener('click', (e) => {
  const rect = hero.getBoundingClientRect();
  pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  pointerNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointerNDC, camera);
  const hits = raycaster.intersectObjects(peakMarkers);
  if (hits.length) {
    const info = hits[0].object.userData.info;
    tooltip.innerHTML = `<strong>${info.name}</strong>${info.fact}`;
    tooltip.style.left = `${e.clientX - rect.left}px`;
    tooltip.style.top = `${e.clientY - rect.top - 18}px`;
    tooltip.classList.remove('hidden');
    clearTimeout(tooltip._t);
    tooltip._t = setTimeout(() => tooltip.classList.add('hidden'), 6000);
  } else {
    tooltip.classList.add('hidden');
  }
});

let scrollProgress = 0;
function updateScrollProgress() {
  const rect = hero.getBoundingClientRect();
  const p = THREE.MathUtils.clamp(-rect.top / (rect.height * 0.9), 0, 1);
  scrollProgress = p;
}
window.addEventListener('scroll', updateScrollProgress, { passive: true });
updateScrollProgress();

/* ---------- pause render loop when hero offscreen ---------- */
let heroVisible = true;
const io = new IntersectionObserver((entries) => { heroVisible = entries[0].isIntersecting; }, { threshold: 0 });
io.observe(hero);

const clock = new THREE.Clock();
let markerPulse = 0;

function animate() {
  requestAnimationFrame(animate);
  if (!heroVisible) return;
  const dt = clock.getDelta();
  const t = clock.getElapsedTime();

  camera.position.x = baseCamPos.x + Math.sin(t * 0.06) * 3;
  camera.position.y = baseCamPos.y - scrollProgress * 6 + Math.sin(t * 0.08) * 0.4;
  camera.position.z = baseCamPos.z - scrollProgress * 30;

  camera.rotation.y += (targetRotY - camera.rotation.y) * 0.04;
  camera.rotation.x += (targetRotX - camera.rotation.x) * 0.04;
  camera.lookAt(0 + targetRotY * 8, 6, -40);

  scene.fog.density = 0.016 + scrollProgress * 0.03;

  markerPulse += dt;
  peakMarkers.forEach((m, i) => {
    const s = 1 + Math.sin(markerPulse * 2 + i) * 0.15;
    m.scale.setScalar(s);
    m.material.opacity = 0.55 + Math.sin(markerPulse * 2 + i) * 0.25;
  });

  renderer.render(scene, camera);
}
animate();

export function hideLoader() {
  const loader = document.getElementById('loader');
  if (loader) loader.classList.add('hidden');
}
requestAnimationFrame(() => requestAnimationFrame(hideLoader));
