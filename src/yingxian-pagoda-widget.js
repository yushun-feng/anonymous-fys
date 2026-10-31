import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

/**
 * High-detail stylized reconstruction of 应县木塔 (Fogong Temple Sakyamuni Pagoda).
 * Octagonal Liao-dynasty pavilion-style timber pagoda: procedural meshes + canvas materials.
 * Educational / browse showcase — not a surveyed scan of the monument.
 */

const TWO_PI = Math.PI * 2;
const SIDES = 8;

function canUseWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

function track(list, ...items) {
  for (const item of items) if (item) list.push(item);
}

function makeLabel(text) {
  const el = document.createElement('div');
  el.className = 'pagoda-label';
  el.textContent = text;
  const obj = new CSS2DObject(el);
  obj.center.set(0.5, 1.2);
  return obj;
}

function octagonPoints(radius, y = 0) {
  const pts = [];
  for (let i = 0; i < SIDES; i += 1) {
    const a = (i / SIDES) * TWO_PI - Math.PI / SIDES;
    pts.push(new THREE.Vector3(Math.cos(a) * radius, y, Math.sin(a) * radius));
  }
  return pts;
}

function octagonShape(radius) {
  const shape = new THREE.Shape();
  const pts = octagonPoints(radius);
  shape.moveTo(pts[0].x, pts[0].z);
  for (let i = 1; i < pts.length; i += 1) shape.lineTo(pts[i].x, pts[i].z);
  shape.closePath();
  return shape;
}

function makeCanvasTexture(draw, size = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  draw(ctx, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

function woodTexture() {
  return makeCanvasTexture((ctx, size) => {
    ctx.fillStyle = '#8a5a32';
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 48; i += 1) {
      const x = (i / 48) * size + Math.sin(i * 1.7) * 2;
      ctx.strokeStyle = `rgba(${60 + (i % 5) * 8},${35 + (i % 3) * 6},${18},0.35)`;
      ctx.lineWidth = 1 + (i % 3);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      for (let y = 0; y <= size; y += 8) {
        ctx.lineTo(x + Math.sin(y * 0.08 + i) * 3, y);
      }
      ctx.stroke();
    }
  }, 256);
}

function tileTexture() {
  return makeCanvasTexture((ctx, size) => {
    ctx.fillStyle = '#5c6168';
    ctx.fillRect(0, 0, size, size);
    const rows = 16;
    const cols = 12;
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const x = (c / cols) * size + (r % 2 ? size / cols / 2 : 0);
        const y = (r / rows) * size;
        const w = size / cols;
        const h = size / rows;
        ctx.fillStyle = r % 2 ? '#6a7078' : '#545960';
        ctx.fillRect(x, y, w - 1, h - 1);
        ctx.strokeStyle = 'rgba(30,32,36,0.45)';
        ctx.strokeRect(x, y, w - 1, h - 1);
      }
    }
  }, 256);
}

function plasterTexture() {
  return makeCanvasTexture((ctx, size) => {
    ctx.fillStyle = '#efe6d6';
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 900; i += 1) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      ctx.fillStyle = `rgba(180,170,150,${0.04 + Math.random() * 0.08})`;
      ctx.fillRect(x, y, 2, 2);
    }
  }, 128);
}

function stoneTexture() {
  return makeCanvasTexture((ctx, size) => {
    ctx.fillStyle = '#8d9096';
    ctx.fillRect(0, 0, size, size);
    for (let y = 0; y < size; y += 18) {
      for (let x = 0; x < size; x += 28) {
        const ox = (Math.floor(y / 18) % 2) * 14;
        ctx.strokeStyle = 'rgba(50,52,58,0.35)';
        ctx.strokeRect(x + ox, y, 26, 16);
        ctx.fillStyle = `rgba(${130 + (x % 20)},${132 + (y % 15)},${138},0.25)`;
        ctx.fillRect(x + ox + 1, y + 1, 24, 14);
      }
    }
  }, 256);
}

function mat(disposables, opts) {
  const m = new THREE.MeshStandardMaterial(opts);
  track(disposables, m);
  return m;
}

function addMesh(parent, geo, material, disposables, pos, rot) {
  track(disposables, geo);
  const mesh = new THREE.Mesh(geo, material);
  if (pos) mesh.position.copy(pos);
  if (rot) mesh.rotation.set(rot.x || 0, rot.y || 0, rot.z || 0);
  parent.add(mesh);
  return mesh;
}

/** Single dougong (bracket set) under eaves — stylized stepped brackets. */
function makeDougong(disposables, woodMat, scale = 1) {
  const g = new THREE.Group();
  const beam = new THREE.BoxGeometry(0.55 * scale, 0.08 * scale, 0.16 * scale);
  addMesh(g, beam, woodMat, disposables);

  for (let i = 0; i < 3; i += 1) {
    const w = (0.42 - i * 0.08) * scale;
    const arm = new THREE.BoxGeometry(w, 0.06 * scale, 0.12 * scale);
    addMesh(g, arm, woodMat, disposables, new THREE.Vector3(0, 0.08 * scale + i * 0.07 * scale, 0.06 * scale + i * 0.04 * scale));
  }

  const cap = new THREE.BoxGeometry(0.18 * scale, 0.1 * scale, 0.18 * scale);
  addMesh(g, cap, woodMat, disposables, new THREE.Vector3(0, 0.28 * scale, 0.02 * scale));
  return g;
}

/**
 * One visible storey: columns, plaster walls, balcony, dougong, hip roof with upturned corners.
 */
function buildStorey(disposables, mats, {
  y,
  radius,
  height,
  eaveOverhang,
  roofRise,
  showBalcony,
  detail,
}) {
  const group = new THREE.Group();
  group.position.y = y;

  // Floor / ceiling deck
  const deckShape = octagonShape(radius + 0.08);
  const deckGeo = new THREE.ExtrudeGeometry(deckShape, { depth: 0.12, bevelEnabled: false });
  deckGeo.rotateX(-Math.PI / 2);
  addMesh(group, deckGeo, mats.wood, disposables, new THREE.Vector3(0, 0, 0));

  // Inner wall shell (slightly inset) — thin panels per side
  const wallR = radius * 0.82;
  const wallH = height * 0.72;
  for (let i = 0; i < SIDES; i += 1) {
    const a0 = (i / SIDES) * TWO_PI - Math.PI / SIDES;
    const a1 = ((i + 1) / SIDES) * TWO_PI - Math.PI / SIDES;
    const x0 = Math.cos(a0) * wallR;
    const z0 = Math.sin(a0) * wallR;
    const x1 = Math.cos(a1) * wallR;
    const z1 = Math.sin(a1) * wallR;
    const mid = new THREE.Vector3((x0 + x1) / 2, wallH / 2, (z0 + z1) / 2);
    const len = Math.hypot(x1 - x0, z1 - z0);
    const ang = Math.atan2(z1 - z0, x1 - x0);
    const panel = new THREE.BoxGeometry(len * 0.98, wallH, 0.08);
    const panelMesh = addMesh(group, panel, mats.plaster, disposables, mid, { y: -ang });

    // Lattice window / door recess on alternate faces
    if (i % 2 === 0) {
      const win = new THREE.BoxGeometry(len * 0.45, wallH * 0.42, 0.05);
      const winMat = i === 0 ? mats.door : mats.lattice;
      addMesh(
        group,
        win,
        winMat,
        disposables,
        new THREE.Vector3(mid.x * 1.02, wallH * 0.48, mid.z * 1.02),
        { y: -ang },
      );
    } else {
      // Two lattice panes
      for (const t of [-0.22, 0.22]) {
        const lx = mid.x + Math.cos(ang) * len * t;
        const lz = mid.z + Math.sin(ang) * len * t;
        const pane = new THREE.BoxGeometry(len * 0.28, wallH * 0.38, 0.04);
        addMesh(
          group,
          pane,
          mats.lattice,
          disposables,
          new THREE.Vector3(lx * 1.02, wallH * 0.5, lz * 1.02),
          { y: -ang },
        );
      }
    }
    void panelMesh;
  }

  // Perimeter columns (outer ring) — Yingxian has rich colonnade
  const colR = radius * 0.96;
  const colGeo = new THREE.CylinderGeometry(0.07, 0.08, wallH, Math.max(10, detail));
  track(disposables, colGeo);
  for (let i = 0; i < SIDES; i += 1) {
    const a = (i / SIDES) * TWO_PI - Math.PI / SIDES;
    const col = new THREE.Mesh(colGeo, mats.vermilion);
    col.position.set(Math.cos(a) * colR, wallH / 2, Math.sin(a) * colR);
    group.add(col);

    // Mid-edge columns for denser look
    const aMid = a + Math.PI / SIDES;
    const col2 = new THREE.Mesh(colGeo, mats.vermilion);
    col2.position.set(Math.cos(aMid) * colR, wallH / 2, Math.sin(aMid) * colR);
    group.add(col2);
  }

  // Balcony floor + railing on upper storeys
  if (showBalcony) {
    const balR = radius + 0.22;
    const balShape = octagonShape(balR);
    const hole = octagonShape(radius * 0.9);
    balShape.holes.push(hole);
    const balGeo = new THREE.ExtrudeGeometry(balShape, { depth: 0.07, bevelEnabled: false });
    balGeo.rotateX(-Math.PI / 2);
    addMesh(group, balGeo, mats.wood, disposables, new THREE.Vector3(0, wallH * 0.02, 0));

    const railH = 0.28;
    const postGeo = new THREE.CylinderGeometry(0.025, 0.025, railH, 8);
    track(disposables, postGeo);
    for (let i = 0; i < SIDES * 3; i += 1) {
      const a = (i / (SIDES * 3)) * TWO_PI;
      const post = new THREE.Mesh(postGeo, mats.vermilion);
      post.position.set(Math.cos(a) * balR * 0.98, railH / 2 + 0.05, Math.sin(a) * balR * 0.98);
      group.add(post);
    }
    // Handrail ring (approx as thin boxes per side)
    for (let i = 0; i < SIDES; i += 1) {
      const a0 = (i / SIDES) * TWO_PI - Math.PI / SIDES;
      const a1 = ((i + 1) / SIDES) * TWO_PI - Math.PI / SIDES;
      const x0 = Math.cos(a0) * balR * 0.98;
      const z0 = Math.sin(a0) * balR * 0.98;
      const x1 = Math.cos(a1) * balR * 0.98;
      const z1 = Math.sin(a1) * balR * 0.98;
      const len = Math.hypot(x1 - x0, z1 - z0);
      const ang = Math.atan2(z1 - z0, x1 - x0);
      const rail = new THREE.BoxGeometry(len, 0.04, 0.04);
      addMesh(
        group,
        rail,
        mats.wood,
        disposables,
        new THREE.Vector3((x0 + x1) / 2, railH + 0.04, (z0 + z1) / 2),
        { y: -ang },
      );
    }
  }

  // Head beam ring under eaves
  const beamY = wallH + 0.05;
  for (let i = 0; i < SIDES; i += 1) {
    const a0 = (i / SIDES) * TWO_PI - Math.PI / SIDES;
    const a1 = ((i + 1) / SIDES) * TWO_PI - Math.PI / SIDES;
    const r = radius + 0.05;
    const x0 = Math.cos(a0) * r;
    const z0 = Math.sin(a0) * r;
    const x1 = Math.cos(a1) * r;
    const z1 = Math.sin(a1) * r;
    const len = Math.hypot(x1 - x0, z1 - z0);
    const ang = Math.atan2(z1 - z0, x1 - x0);
    const beam = new THREE.BoxGeometry(len * 1.02, 0.12, 0.18);
    addMesh(
      group,
      beam,
      mats.wood,
      disposables,
      new THREE.Vector3((x0 + x1) / 2, beamY, (z0 + z1) / 2),
      { y: -ang },
    );

    // Dougong at corners and mid-edges — face outward along the wall normal.
    const dens = detail >= 14 ? 3 : 2;
    for (let k = 0; k < dens; k += 1) {
      const t = (k + 0.5) / dens;
      const px = x0 + (x1 - x0) * t;
      const pz = z0 + (z1 - z0) * t;
      const dg = makeDougong(disposables, mats.wood, 0.85);
      const outward = Math.atan2(pz, px);
      dg.position.set(px * 1.015, beamY + 0.1, pz * 1.015);
      dg.rotation.y = -outward + Math.PI;
      group.add(dg);
    }
  }

  // Hip roof with upturned corners
  const roofGroup = new THREE.Group();
  roofGroup.position.y = beamY + 0.22;
  group.add(roofGroup);

  const eaveR = radius + eaveOverhang;
  const apexR = radius * 0.55;
  const segments = Math.max(24, detail * 2);

  // Roof skin as triangular fan from ridge octagon to eave octagon
  const positions = [];
  const uvs = [];
  const indices = [];
  const eavePts = [];
  const ridgePts = [];
  for (let i = 0; i <= SIDES; i += 1) {
    const a = (i / SIDES) * TWO_PI - Math.PI / SIDES;
    eavePts.push(new THREE.Vector3(Math.cos(a) * eaveR, 0.05, Math.sin(a) * eaveR));
    ridgePts.push(new THREE.Vector3(Math.cos(a) * apexR, roofRise, Math.sin(a) * apexR));
  }

  // Subdivide each sector for smoother curvature + slight concave eave curve
  let v = 0;
  for (let i = 0; i < SIDES; i += 1) {
    for (let s = 0; s < segments / SIDES; s += 1) {
      const t0 = s / (segments / SIDES);
      const t1 = (s + 1) / (segments / SIDES);
      const a0 = ((i + t0) / SIDES) * TWO_PI - Math.PI / SIDES;
      const a1 = ((i + t1) / SIDES) * TWO_PI - Math.PI / SIDES;

      const lerpEave = (a) => {
        // Slight droop toward mid-edge for soft eave curve
        const edgeT = Math.abs(((a + Math.PI / SIDES) % (TWO_PI / SIDES)) / (TWO_PI / SIDES) - 0.5) * 2;
        const droop = (1 - edgeT) * 0.08;
        return new THREE.Vector3(Math.cos(a) * eaveR, 0.02 + droop, Math.sin(a) * eaveR);
      };
      const lerpRidge = (a) => new THREE.Vector3(Math.cos(a) * apexR, roofRise, Math.sin(a) * apexR);

      const e0 = lerpEave(a0);
      const e1 = lerpEave(a1);
      const r0 = lerpRidge(a0);
      const r1 = lerpRidge(a1);

      // Quad as two tris
      for (const p of [e0, e1, r1, e0, r1, r0]) {
        positions.push(p.x, p.y, p.z);
      }
      for (let k = 0; k < 6; k += 1) {
        uvs.push((i + (k % 3 === 1 || k === 2 || k === 4 ? t1 : t0)) / SIDES, k < 3 ? 0 : 1);
        indices.push(v + k);
      }
      v += 6;
    }
  }

  const roofGeo = new THREE.BufferGeometry();
  roofGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  roofGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  roofGeo.setIndex(indices);
  roofGeo.computeVertexNormals();
  addMesh(roofGroup, roofGeo, mats.tile, disposables);

  // Ridge boards
  for (let i = 0; i < SIDES; i += 1) {
    const a0 = (i / SIDES) * TWO_PI - Math.PI / SIDES;
    const a1 = ((i + 1) / SIDES) * TWO_PI - Math.PI / SIDES;
    const p0 = new THREE.Vector3(Math.cos(a0) * apexR, roofRise + 0.03, Math.sin(a0) * apexR);
    const p1 = new THREE.Vector3(Math.cos(a1) * apexR, roofRise + 0.03, Math.sin(a1) * apexR);
    const len = p0.distanceTo(p1);
    const mid = p0.clone().add(p1).multiplyScalar(0.5);
    const ridge = new THREE.BoxGeometry(len, 0.06, 0.08);
    const mesh = addMesh(roofGroup, ridge, mats.wood, disposables, mid);
    mesh.lookAt(p1);
    mesh.rotateY(Math.PI / 2);
  }

  // Upturned corner rafters (翼角)
  for (let i = 0; i < SIDES; i += 1) {
    const a = (i / SIDES) * TWO_PI - Math.PI / SIDES;
    const base = new THREE.Vector3(Math.cos(a) * (radius + 0.1), 0.1, Math.sin(a) * (radius + 0.1));
    const tip = new THREE.Vector3(
      Math.cos(a) * (eaveR + 0.35),
      0.28,
      Math.sin(a) * (eaveR + 0.35),
    );
    const len = base.distanceTo(tip);
    const rafter = new THREE.BoxGeometry(0.06, 0.05, len);
    const mid = base.clone().add(tip).multiplyScalar(0.5);
    const m = addMesh(roofGroup, rafter, mats.wood, disposables, mid);
    m.lookAt(tip);

    // Corner ornament tip
    const tipOrb = new THREE.SphereGeometry(0.06, 10, 8);
    addMesh(roofGroup, tipOrb, mats.accent, disposables, tip);
  }

  // Rafters under eaves (radial)
  const rafterCount = SIDES * (detail >= 14 ? 5 : 3);
  const rafGeo = new THREE.BoxGeometry(0.04, 0.035, eaveOverhang * 0.95);
  track(disposables, rafGeo);
  for (let i = 0; i < rafterCount; i += 1) {
    const a = (i / rafterCount) * TWO_PI;
    const m = new THREE.Mesh(rafGeo, mats.wood);
    const rr = radius + eaveOverhang * 0.45;
    m.position.set(Math.cos(a) * rr, 0.08, Math.sin(a) * rr);
    m.rotation.y = -a;
    roofGroup.add(m);
  }

  return { group, topY: y + beamY + roofRise + 0.25, radius: apexR };
}

function buildSteeple(disposables, mats, y, radius) {
  const g = new THREE.Group();
  g.position.y = y;

  const base = new THREE.CylinderGeometry(radius * 0.85, radius * 1.05, 0.18, 16);
  addMesh(g, base, mats.metal, disposables, new THREE.Vector3(0, 0.1, 0));

  // Stacked discs (相轮)
  let h = 0.28;
  for (let i = 0; i < 9; i += 1) {
    const r = radius * (0.7 - i * 0.045);
    const disc = new THREE.CylinderGeometry(r, r * 1.05, 0.07, 20);
    addMesh(g, disc, mats.metal, disposables, new THREE.Vector3(0, h, 0));
    h += 0.11;
  }

  const shaft = new THREE.CylinderGeometry(0.05, 0.06, 0.55, 12);
  addMesh(g, shaft, mats.metal, disposables, new THREE.Vector3(0, h + 0.2, 0));

  const flame = new THREE.SphereGeometry(0.14, 16, 12);
  addMesh(g, flame, mats.accent, disposables, new THREE.Vector3(0, h + 0.55, 0));
  const jewel = new THREE.SphereGeometry(0.08, 12, 10);
  addMesh(g, jewel, mats.metal, disposables, new THREE.Vector3(0, h + 0.72, 0));

  return g;
}

function buildYingxianPagoda(disposables, { compact = false } = {}) {
  const root = new THREE.Group();
  const detail = compact ? 10 : 16;

  const woodMap = woodTexture();
  const tileMap = tileTexture();
  const plasterMap = plasterTexture();
  const stoneMap = stoneTexture();
  track(disposables, woodMap, tileMap, plasterMap, stoneMap);
  woodMap.repeat.set(2, 2);
  tileMap.repeat.set(4, 4);
  stoneMap.repeat.set(3, 2);

  const mats = {
    wood: mat(disposables, { map: woodMap, roughness: 0.72, metalness: 0.05, color: 0xffffff }),
    tile: mat(disposables, { map: tileMap, roughness: 0.85, metalness: 0.08, color: 0xffffff }),
    plaster: mat(disposables, { map: plasterMap, roughness: 0.9, metalness: 0.0, color: 0xffffff }),
    stone: mat(disposables, { map: stoneMap, roughness: 0.88, metalness: 0.05, color: 0xffffff }),
    vermilion: mat(disposables, { color: 0xb33a2e, roughness: 0.45, metalness: 0.12 }),
    door: mat(disposables, { color: 0x5c2a1a, roughness: 0.55, metalness: 0.05 }),
    lattice: mat(disposables, { color: 0x2c333c, roughness: 0.5, metalness: 0.1 }),
    metal: mat(disposables, { color: 0x4a4e54, roughness: 0.35, metalness: 0.75 }),
    accent: mat(disposables, {
      color: 0xc9a227,
      roughness: 0.35,
      metalness: 0.65,
      emissive: 0x3a2a08,
      emissiveIntensity: 0.15,
    }),
  };

  // Stone platform (台基)
  const platformR = 4.6;
  const platShape = octagonShape(platformR);
  const platGeo = new THREE.ExtrudeGeometry(platShape, { depth: 0.55, bevelEnabled: false });
  platGeo.rotateX(-Math.PI / 2);
  addMesh(root, platGeo, mats.stone, disposables, new THREE.Vector3(0, 0, 0));

  // Stepped base ring
  const baseShape = octagonShape(platformR * 0.92);
  const baseGeo = new THREE.ExtrudeGeometry(baseShape, { depth: 0.22, bevelEnabled: false });
  baseGeo.rotateX(-Math.PI / 2);
  addMesh(root, baseGeo, mats.stone, disposables, new THREE.Vector3(0, 0.55, 0));

  // South stair
  for (let i = 0; i < 5; i += 1) {
    const step = new THREE.BoxGeometry(1.6 - i * 0.05, 0.11, 0.35);
    addMesh(
      root,
      step,
      mats.stone,
      disposables,
      new THREE.Vector3(0, 0.06 + i * 0.11, platformR - 0.2 - i * 0.28),
    );
  }

  // Five diminishing exterior storeys (应县木塔外观五层)
  // Approximate relative radii inspired by published proportions (stylized, not surveyed).
  const storeys = [
    { radius: 3.55, height: 2.35, eave: 1.15, rise: 0.85, balcony: false },
    { radius: 3.15, height: 1.85, eave: 1.05, rise: 0.78, balcony: true },
    { radius: 2.75, height: 1.7, eave: 0.95, rise: 0.72, balcony: true },
    { radius: 2.35, height: 1.55, eave: 0.85, rise: 0.66, balcony: true },
    { radius: 1.95, height: 1.4, eave: 0.75, rise: 0.6, balcony: true },
  ];

  let y = 0.78;
  let last = null;
  for (let i = 0; i < storeys.length; i += 1) {
    const s = storeys[i];
    // Dark mezzanine band (暗层 hint) between storeys
    if (i > 0) {
      const mezR = s.radius * 1.02;
      const mezShape = octagonShape(mezR);
      const mezGeo = new THREE.ExtrudeGeometry(mezShape, { depth: 0.35, bevelEnabled: false });
      mezGeo.rotateX(-Math.PI / 2);
      addMesh(root, mezGeo, mats.wood, disposables, new THREE.Vector3(0, y, 0));
      // Short columns on mezzanine
      const mCol = new THREE.CylinderGeometry(0.05, 0.055, 0.32, 8);
      track(disposables, mCol);
      for (let k = 0; k < SIDES; k += 1) {
        const a = (k / SIDES) * TWO_PI - Math.PI / SIDES;
        const c = new THREE.Mesh(mCol, mats.vermilion);
        c.position.set(Math.cos(a) * mezR * 0.95, y + 0.18, Math.sin(a) * mezR * 0.95);
        root.add(c);
      }
      y += 0.38;
    }

    last = buildStorey(disposables, mats, {
      y,
      radius: s.radius,
      height: s.height,
      eaveOverhang: s.eave,
      roofRise: s.rise,
      showBalcony: s.balcony,
      detail,
    });
    root.add(last.group);
    y = last.topY;
  }

  root.add(buildSteeple(disposables, mats, y + 0.05, last.radius * 0.9));

  // Ground plaque label float
  const label = makeLabel('应县木塔 · 佛宫寺释迦塔');
  label.position.set(0, y + 2.2, 0);
  root.add(label);

  return root;
}

function makeGround(disposables) {
  const g = new THREE.Group();
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x6e7a68,
    roughness: 0.95,
    metalness: 0.0,
  });
  track(disposables, groundMat);
  const ground = new THREE.CircleGeometry(18, 48);
  const mesh = new THREE.Mesh(ground, groundMat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = -0.02;
  g.add(mesh);
  track(disposables, ground);

  // Soft mist disks
  const mistMat = new THREE.MeshBasicMaterial({
    color: 0xc5d0c0,
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
  });
  track(disposables, mistMat);
  const mist = new THREE.CircleGeometry(14, 32);
  const mistMesh = new THREE.Mesh(mist, mistMat);
  mistMesh.rotation.x = -Math.PI / 2;
  mistMesh.position.y = 0.01;
  g.add(mistMesh);
  track(disposables, mist);
  return g;
}

/**
 * Mount Yingxian Wooden Pagoda showcase into `container`.
 * Returns `{ dispose }` for tear-down on route change.
 */
export function mountYingxianPagodaWidget(container, { compact = false } = {}) {
  const shell = document.createElement('section');
  shell.className = `pagoda-widget${compact ? ' pagoda-widget--compact' : ''}`;
  shell.innerHTML = `
    <div class="pagoda-widget__stage" role="img" aria-label="可交互的应县木塔三维展台"></div>
    <p class="pagoda-widget__fallback" hidden>当前环境无法使用 WebGL，已跳过三维展台展示。</p>
  `;
  container.appendChild(shell);

  const stage = shell.querySelector('.pagoda-widget__stage');
  const fallback = shell.querySelector('.pagoda-widget__fallback');

  if (!canUseWebGL()) {
    stage.hidden = true;
    fallback.hidden = false;
    return {
      dispose() {
        shell.remove();
      },
    };
  }

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xb7c4d2);
  scene.fog = new THREE.Fog(0xb7c4d2, 22, 48);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 120);
  camera.position.set(compact ? 11 : 13.5, compact ? 8 : 9.5, compact ? 11 : 13.5);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  stage.appendChild(renderer.domElement);

  const labelRenderer = new CSS2DRenderer();
  labelRenderer.domElement.className = 'pagoda-widget__labels';
  stage.appendChild(labelRenderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.enablePan = false;
  controls.minDistance = compact ? 7 : 6;
  controls.maxDistance = compact ? 28 : 36;
  controls.maxPolarAngle = Math.PI * 0.48;
  controls.target.set(0, compact ? 5 : 6, 0);
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.45;

  scene.add(new THREE.AmbientLight(0xdde6f0, 0.55));
  const hemi = new THREE.HemisphereLight(0xe8f0ff, 0x6a7058, 0.55);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff2dd, 1.25);
  sun.position.set(12, 22, 8);
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0x9eb7ff, 0.35);
  fill.position.set(-10, 8, -6);
  scene.add(fill);

  const disposables = [];
  let disposed = false;

  scene.add(makeGround(disposables));
  const pagoda = buildYingxianPagoda(disposables, { compact });
  scene.add(pagoda);

  let raf = 0;
  let visible = true;

  const resize = () => {
    if (disposed) return;
    const width = Math.max(stage.clientWidth, 1);
    const height = Math.max(stage.clientHeight, 1);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    labelRenderer.setSize(width, height);
  };

  const ro = new ResizeObserver(resize);
  ro.observe(stage);
  resize();

  const io =
    typeof IntersectionObserver === 'function'
      ? new IntersectionObserver(
          ([entry]) => {
            visible = entry?.isIntersecting ?? true;
          },
          { threshold: 0.05 },
        )
      : null;
  io?.observe(stage);

  // Pause auto-rotate while user drags
  let userControl = false;
  controls.addEventListener('start', () => {
    userControl = true;
    controls.autoRotate = false;
  });
  controls.addEventListener('end', () => {
    userControl = false;
    setTimeout(() => {
      if (!disposed && !userControl) controls.autoRotate = true;
    }, 2500);
  });

  const tick = () => {
    if (disposed) return;
    raf = requestAnimationFrame(tick);
    if (!visible) return;
    controls.update();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
  };
  raf = requestAnimationFrame(tick);

  return {
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io?.disconnect();
      controls.dispose();
      for (const d of disposables) d.dispose?.();
      renderer.dispose();
      renderer.domElement.remove();
      labelRenderer.domElement.remove();
      shell.remove();
    },
  };
}
