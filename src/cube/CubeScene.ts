import * as THREE from 'three';
import { FACE_DEF, NORMAL, ROT_DEF, faceletIndex, isRotation, type Face, type Vec } from './model';

/** eixo, camada e sentido de um giro de face ou do cubo inteiro (camada 0 = o cubo todo, para x/y/z) */
function moveDef(m: string): { axis: 0 | 1 | 2; layer: number; dir: 1 | -1; whole: boolean } {
  if (isRotation(m)) return { ...ROT_DEF[m[0] as 'x'], layer: 0, whole: true };
  return { ...FACE_DEF[m[0] as Face], whole: false };
}

/**
 * Desenho 3D do cubo. As peças ficam sempre no lugar; o que muda são as cores dos adesivos.
 * Um giro é animado girando a camada e, ao final, a camada volta à posição e os adesivos
 * são repintados com o novo estado. Assim qualquer estado (inclusive lido da câmera) pode ser mostrado.
 */
export const STICKER_COLORS: Record<Face, string> = {
  U: '#F8F9FC', D: '#FFE714', F: '#1DB863', B: '#2F6BF0', R: '#F2453D', L: '#FF8216',
};
const AXES = ['x', 'y', 'z'] as const;
const AXV = [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1)];

interface StickerMesh extends THREE.Mesh { userData: { face: Face; index: number } }

export interface SceneOptions {
  onMove?: (move: string) => void;
  /** se o dedo pode girar faces neste momento */
  canTurn?: () => boolean;
}

export class CubeScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  private view = new THREE.Group();
  private root = new THREE.Group();
  private cubies: THREE.Group[] = [];
  private stickers: StickerMesh[] = [];
  private arrow: THREE.Group | null = null;
  private arrowMat = new THREE.MeshBasicMaterial({ color: '#FF2E88' });
  private anim: { pivot: THREE.Group; axis: 0 | 1 | 2; angle: number; t0: number; dur: number; done: () => void } | null = null;
  private queue: (() => void)[] = [];
  private yaw = 0.0; private pitch = 0; private tYaw = 0; private tPitch = 0;
  private right = new THREE.Vector3(1, 0, 0);
  private qy = new THREE.Quaternion(); private qp = new THREE.Quaternion();
  private drag: { x: number; y: number; yaw: number; pitch: number; hit: THREE.Intersection | null; decided: boolean } | null = null;
  private raf = 0;
  private ro: ResizeObserver;
  private ray = new THREE.Raycaster();
  idleSpin = false;
  private grey = new Set<string>();
  private colors: Record<Face, Face[]> | null = null;

  constructor(private canvas: HTMLCanvasElement, private opts: SceneOptions = {}) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    this.scene.add(new THREE.AmbientLight(0xffffff, 1.6));
    const sun = new THREE.DirectionalLight(0xffffff, 1.4); sun.position.set(4, 8, 6); this.scene.add(sun);
    const fill = new THREE.DirectionalLight(0xffffff, 1.1); fill.position.set(-2, -8, 5); this.scene.add(fill);
    this.scene.add(this.view); this.view.add(this.root);
    this.build();
    this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(canvas);
    this.bindPointer();
    this.resize();
    const loop = (now: number) => { this.frame(now); this.raf = requestAnimationFrame(loop); };
    this.raf = requestAnimationFrame(loop);
  }

  dispose() {
    cancelAnimationFrame(this.raf); this.ro.disconnect(); this.renderer.dispose();
  }

  private build() {
    const bodyGeo = new THREE.BoxGeometry(0.97, 0.97, 0.97);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x15171d, roughness: 0.55 });
    const s = new THREE.Shape(), h = 0.42, r = 0.11;
    s.moveTo(-h + r, -h); s.lineTo(h - r, -h); s.quadraticCurveTo(h, -h, h, -h + r); s.lineTo(h, h - r); s.quadraticCurveTo(h, h, h - r, h);
    s.lineTo(-h + r, h); s.quadraticCurveTo(-h, h, -h, h - r); s.lineTo(-h, -h + r); s.quadraticCurveTo(-h, -h, -h + r, -h);
    const stickerGeo = new THREE.ShapeGeometry(s, 5);
    for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) {
      if (!x && !y && !z) continue;
      const g = new THREE.Group(); g.position.set(x, y, z);
      g.add(new THREE.Mesh(bodyGeo, bodyMat));
      (Object.keys(NORMAL) as Face[]).forEach(f => {
        const n = NORMAL[f];
        if (n[0] && n[0] !== x) return; if (n[1] && n[1] !== y) return; if (n[2] && n[2] !== z) return;
        const m = new THREE.Mesh(stickerGeo, new THREE.MeshStandardMaterial({ color: STICKER_COLORS[f], roughness: 0.35, emissive: 0xffffff, emissiveIntensity: 0 })) as unknown as StickerMesh;
        const nv = new THREE.Vector3(...n);
        m.position.copy(nv.clone().multiplyScalar(0.488));
        m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), nv);
        m.userData = { face: f, index: faceletIndex(f, [x, y, z]) };
        g.add(m); this.stickers.push(m);
      });
      this.root.add(g); this.cubies.push(g);
    }
  }

  /** pinta os adesivos com o estado atual */
  paint(f: Record<Face, Face[]>) {
    this.colors = f;
    for (const s of this.stickers) {
      const c = f[s.userData.face][s.userData.index];
      const mat = s.material as THREE.MeshStandardMaterial;
      mat.color.set(this.grey.has(`${s.userData.face}${s.userData.index}`) ? '#7C828E' : STICKER_COLORS[c]);
    }
  }

  /** adesivos a mostrar em cinza ("não importa agora"), como "F4", "U7" */
  setGrey(keys: string[]) { this.grey = new Set(keys); if (this.colors) this.paint(this.colors); }

  /** anima um giro; ao terminar, repinta com o estado seguinte */
  turn(move: string, next: Record<Face, Face[]>, dur = 240, grey?: string[]): Promise<void> {
    return new Promise(res => {
      const start = () => {
        const d = moveDef(move);
        const pivot = new THREE.Group(); this.root.add(pivot);
        this.cubies.filter(c => d.whole || Math.round(c.position[AXES[d.axis]]) === d.layer).forEach(c => pivot.attach(c));
        if (this.arrow && d.whole) this.arrow.visible = false;
        let angle = d.dir * Math.PI / 2;
        if (move.endsWith("'")) angle = -angle;
        if (move.endsWith('2')) { angle *= 2; dur *= 1.4; }
        if (d.whole) dur *= 1.8;
        if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) dur = 60;
        this.anim = { pivot, axis: d.axis, angle, t0: performance.now(), dur, done: () => {
          pivot.rotation.set(0, 0, 0); pivot.updateMatrixWorld(true);
          [...pivot.children].forEach(c => this.root.attach(c));
          this.root.remove(pivot);
          if (grey) this.grey = new Set(grey);
          this.paint(next); this.anim = null; res();
          const nx = this.queue.shift(); if (nx) nx();
        } };
      };
      if (this.anim) this.queue.push(start); else start();
    });
  }

  /** seta rosa contornando a camada do próximo giro (ou some, com null) */
  hint(move: string | null) {
    if (this.arrow) { this.root.remove(this.arrow); this.arrow.traverse(o => (o as THREE.Mesh).geometry?.dispose()); this.arrow = null; }
    for (const s of this.stickers) (s.material as THREE.MeshStandardMaterial).emissiveIntensity = 0;
    if (!move) return;
    const d = moveDef(move), ax = AXES[d.axis];
    const sg = d.dir * (move.endsWith("'") ? -1 : 1);
    const [bu, bv] = ({ x: ['y', 'z'], y: ['z', 'x'], z: ['x', 'y'] } as const)[ax];
    this.root.updateMatrixWorld(true);
    const camL = this.root.worldToLocal(this.camera.position.clone());
    const phiC = Math.atan2(camL[bv], camL[bu]);
    const H = d.whole ? 1.75 : 1.62, span = move.endsWith('2') ? 1.6 : 1.05, pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 32; i++) {
      const phi = phiC - sg * span + sg * 2 * span * i / 32, c = Math.cos(phi), sn = Math.sin(phi);
      const k = H / Math.max(Math.abs(c), Math.abs(sn)) * (1 + 0.08 * Math.min(Math.abs(c), Math.abs(sn)));
      const v = new THREE.Vector3(); v[ax] = d.layer; v[bu] = k * c; v[bv] = k * sn; pts.push(v);
    }
    const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.085, 10, false), this.arrowMat);
    const end = pts[pts.length - 1], dir = end.clone().sub(pts[pts.length - 2]).normalize();
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.52, 18), this.arrowMat);
    cone.position.copy(end).add(dir.clone().multiplyScalar(0.2));
    cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    this.arrow = new THREE.Group(); this.arrow.add(tube, cone); this.root.add(this.arrow);
  }

  /** volta à vista padrão: branco em cima, verde na frente */
  /** olhar de cima (padrão) ou espiando a base */
  look(base: boolean) { this.tPitch = base ? -0.9 : 0; }

  resetView() { this.tYaw = Math.round(this.yaw / (Math.PI * 2)) * Math.PI * 2; this.tPitch = 0; }

  private resize() {
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    const dist = 11.6 / Math.pow(Math.min(1, this.camera.aspect), 0.85);
    this.camera.position.set(0.55, 0.45, 0.7).normalize().multiplyScalar(dist);
    this.camera.lookAt(0, 0, 0); this.camera.updateProjectionMatrix();
    this.right.crossVectors(new THREE.Vector3(0, 1, 0), this.camera.position).normalize();
  }

  private frame(now: number) {
    if (this.anim) {
      const a = this.anim, t = Math.min(1, (now - a.t0) / a.dur);
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      a.pivot.rotation[AXES[a.axis]] = a.angle * e;
      if (t >= 1) a.done();
    }
    if (this.idleSpin && !this.drag) this.tYaw += 0.004;
    this.yaw += (this.tYaw - this.yaw) * 0.14; this.pitch += (this.tPitch - this.pitch) * 0.14;
    // gira em volta do eixo vertical e inclina em volta do eixo "direita da tela": o cubo nunca fica torto
    this.qy.setFromAxisAngle(AXV[1], this.yaw);
    this.qp.setFromAxisAngle(this.right, this.pitch);
    this.view.quaternion.copy(this.qp).multiply(this.qy);
    if (this.arrow) this.arrowMat.color.setHSL(0.92, 1, 0.55 + 0.08 * Math.sin(now / 200));
    this.renderer.render(this.scene, this.camera);
  }

  private bindPointer() {
    const c = this.canvas;
    c.style.touchAction = 'none';
    c.addEventListener('pointerdown', e => {
      const r = c.getBoundingClientRect();
      const ndc = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      this.ray.setFromCamera(ndc, this.camera);
      const hit = this.opts.canTurn?.() ? this.ray.intersectObjects(this.cubies, true)[0] ?? null : null;
      this.drag = { x: e.clientX, y: e.clientY, yaw: this.tYaw, pitch: this.tPitch, hit, decided: false };
      c.setPointerCapture(e.pointerId);
    });
    c.addEventListener('pointermove', e => {
      const d = this.drag; if (!d) return;
      const dx = e.clientX - d.x, dy = e.clientY - d.y;
      if (d.hit) {
        if (!d.decided && Math.hypot(dx, dy) > 9) {
          d.decided = true;
          const m = this.moveFromDrag(d.hit, dx, dy);
          if (m) this.opts.onMove?.(m);
        }
        return;
      }
      this.tYaw = d.yaw + dx * 0.012;
      this.tPitch = Math.max(-1.0, Math.min(0.9, d.pitch + dy * 0.008));
    });
    // ao soltar, a vista se ajeita sozinha: de quarto em quarto de volta, e reta ou espiando a base
    const end = () => {
      if (this.drag && !this.drag.hit) {
        const q = Math.PI / 2;
        this.tYaw = Math.round(this.tYaw / q) * q;
        this.tPitch = this.tPitch < -0.45 ? -0.9 : 0;
      }
      this.drag = null;
    };
    c.addEventListener('pointerup', end); c.addEventListener('pointercancel', end);
  }

  /** descobre o giro pelo arraste: testa os eixos possíveis e vê qual movimento na tela combina com o dedo */
  private moveFromDrag(hit: THREE.Intersection, dx: number, dy: number): string | null {
    let cubie: THREE.Object3D = hit.object;
    while (cubie.parent && !this.cubies.includes(cubie as THREE.Group)) cubie = cubie.parent;
    const vq = new THREE.Quaternion(); this.root.getWorldQuaternion(vq);
    const n = hit.face!.normal.clone().transformDirection(hit.object.matrixWorld).applyQuaternion(vq.clone().invert());
    let best: { ax: 0 | 1 | 2; dot: number } | null = null;
    for (const ax of [0, 1, 2] as const) {
      if (Math.abs(n.getComponent(ax)) > 0.5) continue;
      const aW = AXV[ax].clone().applyQuaternion(vq);
      const vel = new THREE.Vector3().crossVectors(aW, hit.point).multiplyScalar(0.15);
      const s1 = hit.point.clone().project(this.camera), s2 = hit.point.clone().add(vel).project(this.camera);
      const sx = s2.x - s1.x, sy = -(s2.y - s1.y), len = Math.hypot(sx, sy);
      if (len < 1e-6) continue;
      const dot = (sx * dx + sy * dy) / (len * Math.hypot(dx, dy));
      if (!best || Math.abs(dot) > Math.abs(best.dot)) best = { ax, dot };
    }
    if (!best) return null;
    const layer = Math.round(cubie.position.getComponent(best.ax));
    if (!layer) return null; // camada do meio: não usada no método
    const face = (Object.keys(FACE_DEF) as Face[]).find(f => FACE_DEF[f].axis === best!.ax && FACE_DEF[f].layer === layer)!;
    return (best.dot > 0 ? 1 : -1) === FACE_DEF[face].dir ? face : face + "'";
  }
}

export type { Vec };
