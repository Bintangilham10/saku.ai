"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Saku Bot — a real 3D robot mascot sitting on a money vault (brankas), built
 * with Three.js. Glossy cream/emerald robot with a dark visor + glowing emerald
 * chevron eyes and a gold antenna coin, perched on a deep-emerald safe with a
 * gold dial and coin emblem. The head turns to follow the cursor (eyes glow
 * shift too), with idle hover, antenna bob, and orbiting gold coins. Disposed
 * on unmount, respects prefers-reduced-motion.
 */
export default function HeroMascot() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof window === "undefined") return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const w = () => container.clientWidth || 1;
    const h = () => container.clientHeight || 1;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, w() / h(), 0.1, 100);
    camera.position.set(0, 0.85, 9.2);
    camera.lookAt(0, 0.05, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w(), h());
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    container.appendChild(renderer.domElement);

    // ---- Lighting ----
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const key = new THREE.DirectionalLight(0xfff2dc, 2.6);
    key.position.set(3, 6, 6);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x2ecc8f, 1.6);
    rim.position.set(-5, 2, -3);
    scene.add(rim);
    const fill = new THREE.PointLight(0xf5b937, 0.8, 40);
    fill.position.set(2, -2, 5);
    scene.add(fill);

    // ---- Material + geometry bookkeeping ----
    const geos: THREE.BufferGeometry[] = [];
    const mats: THREE.Material[] = [];
    const track = <T extends THREE.BufferGeometry>(g: T) => {
      geos.push(g);
      return g;
    };
    const trackM = <T extends THREE.Material>(m: T) => {
      mats.push(m);
      return m;
    };

    const shell = trackM(
      new THREE.MeshPhysicalMaterial({
        color: 0xf3eee4,
        metalness: 0.45,
        roughness: 0.28,
        clearcoat: 1,
        clearcoatRoughness: 0.2,
      }),
    );
    const emerald = trackM(
      new THREE.MeshStandardMaterial({
        color: 0x109868,
        metalness: 0.5,
        roughness: 0.35,
      }),
    );
    const visorMat = trackM(
      new THREE.MeshPhysicalMaterial({
        color: 0x14201c,
        metalness: 0.3,
        roughness: 0.08,
        clearcoat: 1,
        clearcoatRoughness: 0.06,
      }),
    );
    const eyeMat = trackM(
      new THREE.MeshStandardMaterial({
        color: 0x2ee6a8,
        emissive: 0x2ee6a8,
        emissiveIntensity: 1.8,
        roughness: 0.4,
      }),
    );
    const gold = trackM(
      new THREE.MeshStandardMaterial({
        color: 0xf5b937,
        metalness: 0.95,
        roughness: 0.22,
        emissive: 0x3a2600,
        emissiveIntensity: 0.3,
      }),
    );
    const safeBody = trackM(
      new THREE.MeshStandardMaterial({
        color: 0x1f4d3f,
        metalness: 0.7,
        roughness: 0.4,
      }),
    );
    const safeDoor = trackM(
      new THREE.MeshStandardMaterial({
        color: 0x2a6553,
        metalness: 0.7,
        roughness: 0.35,
      }),
    );
    const steel = trackM(
      new THREE.MeshStandardMaterial({
        color: 0xcfd6d3,
        metalness: 0.9,
        roughness: 0.3,
      }),
    );

    const mascot = new THREE.Group();
    mascot.position.y = -0.2;
    scene.add(mascot);

    // ===================== SAFE (brankas) =====================
    const safe = new THREE.Group();
    safe.position.y = -1.55;
    mascot.add(safe);

    const safeBox = new THREE.Mesh(track(new THREE.BoxGeometry(2.7, 2.1, 2.0)), safeBody);
    safe.add(safeBox);

    // Door panel (inset, slightly lighter) on +z face
    const door = new THREE.Mesh(track(new THREE.BoxGeometry(2.1, 1.6, 0.12)), safeDoor);
    door.position.set(0, 0, 1.0);
    safe.add(door);

    // Gold trim frame around the door
    const frameGeoH = track(new THREE.BoxGeometry(2.2, 0.1, 0.16));
    const frameGeoV = track(new THREE.BoxGeometry(0.1, 1.7, 0.16));
    const fTop = new THREE.Mesh(frameGeoH, gold);
    fTop.position.set(0, 0.82, 1.02);
    const fBot = new THREE.Mesh(frameGeoH, gold);
    fBot.position.set(0, -0.82, 1.02);
    const fL = new THREE.Mesh(frameGeoV, gold);
    fL.position.set(-1.07, 0, 1.02);
    const fR = new THREE.Mesh(frameGeoV, gold);
    fR.position.set(1.07, 0, 1.02);
    safe.add(fTop, fBot, fL, fR);

    // Combination dial (steel ring + gold knob + spokes)
    const dialRing = new THREE.Mesh(
      track(new THREE.TorusGeometry(0.34, 0.07, 18, 36)),
      steel,
    );
    dialRing.position.set(0, -0.18, 1.08);
    safe.add(dialRing);
    const knob = new THREE.Mesh(
      track(new THREE.CylinderGeometry(0.18, 0.18, 0.18, 28)),
      gold,
    );
    knob.rotation.x = Math.PI / 2;
    knob.position.set(0, -0.18, 1.16);
    safe.add(knob);
    const spokeGeo = track(new THREE.BoxGeometry(0.06, 0.5, 0.06));
    for (let i = 0; i < 3; i++) {
      const sp = new THREE.Mesh(spokeGeo, steel);
      sp.position.set(0, -0.18, 1.2);
      sp.rotation.z = (i / 3) * Math.PI;
      safe.add(sp);
    }

    // Gold coin emblem above the dial
    const emblem = new THREE.Mesh(
      track(new THREE.CylinderGeometry(0.26, 0.26, 0.06, 30)),
      gold,
    );
    emblem.rotation.x = Math.PI / 2;
    emblem.position.set(0, 0.5, 1.06);
    safe.add(emblem);

    // Feet
    const footGeo = track(new THREE.CylinderGeometry(0.16, 0.16, 0.2, 16));
    [
      [-1.0, -1.6],
      [1.0, -1.6],
      [-1.0, 0.7],
      [1.0, 0.7],
    ].forEach(([x, z]) => {
      const ft = new THREE.Mesh(footGeo, steel);
      ft.position.set(x, -1.15, z);
      safe.add(ft);
    });

    // Small coin stacks beside the safe
    const stackCoinGeo = track(new THREE.CylinderGeometry(0.26, 0.26, 0.1, 28));
    [-1.85, 1.85].forEach((x, idx) => {
      const n = 4 - idx;
      for (let i = 0; i < n; i++) {
        const coin = new THREE.Mesh(stackCoinGeo, gold);
        coin.position.set(x, -2.05 + i * 0.11, 0.6 - idx * 0.4);
        mascot.add(coin);
      }
    });

    // ===================== ROBOT (sitting on the safe) =====================
    const robot = new THREE.Group();
    robot.position.y = 0.05; // sits on top of the safe
    mascot.add(robot);

    // Torso
    const torso = new THREE.Mesh(track(new THREE.SphereGeometry(0.85, 40, 40)), shell);
    torso.scale.set(0.92, 1.0, 0.85);
    torso.position.set(0, 0.15, 0);
    robot.add(torso);
    // Emerald chest light
    const chestLight = new THREE.Mesh(
      track(new THREE.CylinderGeometry(0.16, 0.16, 0.06, 24)),
      eyeMat,
    );
    chestLight.rotation.x = Math.PI / 2;
    chestLight.position.set(0, 0.2, 0.72);
    robot.add(chestLight);

    // Arms (resting on knees)
    const armGeo = track(new THREE.CapsuleGeometry(0.16, 0.5, 8, 16));
    const handGeo = track(new THREE.SphereGeometry(0.2, 20, 20));
    [-1, 1].forEach((s) => {
      const arm = new THREE.Mesh(armGeo, shell);
      arm.position.set(s * 0.72, -0.05, 0.35);
      arm.rotation.z = s * 0.5;
      arm.rotation.x = -0.5;
      robot.add(arm);
      const hand = new THREE.Mesh(handGeo, emerald);
      hand.position.set(s * 0.62, -0.5, 0.78);
      robot.add(hand);
    });

    // Legs dangling over the front edge of the safe
    const thighGeo = track(new THREE.CapsuleGeometry(0.2, 0.42, 8, 16));
    const shinGeo = track(new THREE.CapsuleGeometry(0.17, 0.6, 8, 16));
    const footRGeo = track(new THREE.BoxGeometry(0.34, 0.2, 0.5));
    [-1, 1].forEach((s) => {
      const thigh = new THREE.Mesh(thighGeo, shell);
      thigh.position.set(s * 0.42, -0.5, 0.98);
      thigh.rotation.x = Math.PI / 2;
      robot.add(thigh);
      const shin = new THREE.Mesh(shinGeo, emerald);
      shin.position.set(s * 0.42, -1.08, 1.32);
      robot.add(shin);
      const foot = new THREE.Mesh(footRGeo, shell);
      foot.position.set(s * 0.42, -1.42, 1.46);
      robot.add(foot);
    });

    // ---- Head group (follows cursor) ----
    const head = new THREE.Group();
    head.position.set(0, 1.15, 0.05);
    robot.add(head);

    const skull = new THREE.Mesh(track(new THREE.SphereGeometry(0.62, 40, 40)), shell);
    skull.scale.set(1.08, 0.98, 1.0);
    head.add(skull);

    // Dark glossy visor band
    const visor = new THREE.Mesh(track(new THREE.SphereGeometry(0.5, 40, 40)), visorMat);
    visor.scale.set(1.12, 0.62, 0.55);
    visor.position.set(0, 0.04, 0.42);
    head.add(visor);

    // Glowing emerald chevron eyes
    const eyeGeo = track(new THREE.TorusGeometry(0.13, 0.04, 14, 32, Math.PI));
    const eyeGroup = new THREE.Group();
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.22, 0.04, 0.74);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.22, 0.04, 0.74);
    eyeGroup.add(eyeL, eyeR);
    head.add(eyeGroup);

    // Side ear discs
    const earGeo = track(new THREE.CylinderGeometry(0.16, 0.16, 0.12, 24));
    [-1, 1].forEach((s) => {
      const ear = new THREE.Mesh(earGeo, emerald);
      ear.rotation.z = Math.PI / 2;
      ear.position.set(s * 0.66, 0.02, 0);
      head.add(ear);
    });

    // Antenna + gold coin ball
    const stalk = new THREE.Mesh(
      track(new THREE.CylinderGeometry(0.03, 0.03, 0.45, 12)),
      steel,
    );
    stalk.position.set(0, 0.72, 0);
    head.add(stalk);
    const antBall = new THREE.Mesh(track(new THREE.SphereGeometry(0.13, 24, 24)), gold);
    antBall.position.set(0, 0.98, 0);
    head.add(antBall);

    // Orbiting gold coins
    const coinGeo = track(new THREE.CylinderGeometry(0.12, 0.12, 0.03, 24));
    const coins: THREE.Mesh[] = [];
    for (let i = 0; i < 6; i++) {
      const c = new THREE.Mesh(coinGeo, gold);
      const a = (i / 6) * Math.PI * 2;
      c.position.set(Math.cos(a) * 3.0, Math.sin(a) * 1.7 + 0.6, -1.4 - Math.random());
      c.rotation.x = Math.PI / 2;
      mascot.add(c);
      coins.push(c);
    }

    // ===================== BANK ENVIRONMENT (marble floor, vault pillars) =====================
    const bankFloorMat = trackM(
      new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        roughness: 0.15,
        metalness: 0.4,
      }),
    );
    const bankFloor = new THREE.Mesh(track(new THREE.CylinderGeometry(24, 24, 0.15, 36)), bankFloorMat);
    bankFloor.position.y = -2.68;
    mascot.add(bankFloor);

    // Classical Bank Pillars in background
    const pillarStone = trackM(
      new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        roughness: 0.35,
        metalness: 0.1,
      }),
    );
    [-3.2, 3.2].forEach((px) => {
      const pGroup = new THREE.Group();
      pGroup.position.set(px, 0.5, -3.8);
      mascot.add(pGroup);

      const pBase = new THREE.Mesh(track(new THREE.BoxGeometry(1.2, 0.6, 1.2)), pillarStone);
      pBase.position.y = -2.9;
      const pCol = new THREE.Mesh(track(new THREE.CylinderGeometry(0.45, 0.45, 6.2, 20)), pillarStone);
      pCol.position.y = 0.2;
      const pCap = new THREE.Mesh(track(new THREE.BoxGeometry(1.3, 0.5, 1.3)), pillarStone);
      pCap.position.y = 3.3;
      pGroup.add(pBase, pCol, pCap);
    });

    // Reinforced Vault Wall in background (super wide & blended to prevent cutoff)
    const vaultWallMat = trackM(
      new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        metalness: 0.8,
        roughness: 0.45,
      }),
    );
    const vaultWall = new THREE.Mesh(track(new THREE.BoxGeometry(32, 10, 0.2)), vaultWallMat);
    vaultWall.position.set(0, 1.0, -4.6);
    mascot.add(vaultWall);

    // ===================== GOLD VAULT STACK & AI SECURITY CRYSTAL (Kiri Maskot) =====================
    const goldVaultGroup = new THREE.Group();
    goldVaultGroup.position.set(-2.5, -2.1, -1.0);
    goldVaultGroup.rotation.y = 0.45;
    mascot.add(goldVaultGroup);

    const goldMat = trackM(new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.18, metalness: 0.85 }));
    const palletMat = trackM(new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 }));

    // Steel pallet base
    const pallet = new THREE.Mesh(track(new THREE.BoxGeometry(1.6, 0.15, 1.2)), palletMat);
    pallet.position.y = 0.075;
    goldVaultGroup.add(pallet);

    // Stack of gold bars (pyramid formation)
    const barGeo = track(new THREE.BoxGeometry(0.38, 0.12, 0.22));
    [
      [-0.4, 0.2, -0.25], [0, 0.2, -0.25], [0.4, 0.2, -0.25],
      [-0.4, 0.2, 0.25],  [0, 0.2, 0.25],  [0.4, 0.2, 0.25]
    ].forEach(([bx, by, bz]) => {
      const bar = new THREE.Mesh(barGeo, goldMat);
      bar.position.set(bx, by, bz);
      goldVaultGroup.add(bar);
    });
    [
      [-0.2, 0.32, 0], [0.2, 0.32, 0], [0, 0.32, -0.2]
    ].forEach(([bx, by, bz]) => {
      const bar = new THREE.Mesh(barGeo, goldMat);
      bar.position.set(bx, by, bz);
      bar.rotation.y = 0.2;
      goldVaultGroup.add(bar);
    });
    const topBar = new THREE.Mesh(barGeo, goldMat);
    topBar.position.set(0, 0.44, 0);
    topBar.rotation.y = -0.3;
    goldVaultGroup.add(topBar);

    // Floating AI Security Crystal above the gold stack
    const crystalMat = trackM(new THREE.MeshStandardMaterial({ color: 0x2ee6a8, roughness: 0.1, metalness: 0.2, emissive: 0x109868, emissiveIntensity: 1 }));
    const securityCrystal = new THREE.Mesh(track(new THREE.OctahedronGeometry(0.35)), crystalMat);
    securityCrystal.position.set(0, 1.3, 0);
    goldVaultGroup.add(securityCrystal);

    const crystalLight = new THREE.PointLight(0x2ee6a8, 6, 8);
    crystalLight.position.set(0, 1.3, 0);
    goldVaultGroup.add(crystalLight);

    // ===================== POLICE CAR (mobil polisi dengan lampu bergerak) =====================
    const policeGroup = new THREE.Group();
    policeGroup.position.set(2.3, -2.1, -1.0);
    policeGroup.rotation.y = -0.55;
    mascot.add(policeGroup);

    const carPaint = trackM(new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2, metalness: 0.5 }));
    const carDark = trackM(new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1 }));
    const carBlue = trackM(new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.3 }));

    const carBody = new THREE.Mesh(track(new THREE.BoxGeometry(2.5, 0.65, 1.25)), carPaint);
    carBody.position.y = 0.48;
    policeGroup.add(carBody);

    const carCabin = new THREE.Mesh(track(new THREE.BoxGeometry(1.4, 0.55, 1.08)), carDark);
    carCabin.position.set(-0.1, 1.05, 0);
    policeGroup.add(carCabin);

    const policeStripe = new THREE.Mesh(track(new THREE.BoxGeometry(2.52, 0.2, 1.27)), carBlue);
    policeStripe.position.y = 0.45;
    policeGroup.add(policeStripe);

    // Wheels
    const wheelGeo = track(new THREE.CylinderGeometry(0.32, 0.32, 0.24, 18));
    const wheelMat = trackM(new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.8 }));
    [
      [-0.75, 0.58],
      [0.75, 0.58],
      [-0.75, -0.58],
      [0.75, -0.58],
    ].forEach(([wx, wz]) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(wx, 0.32, wz);
      policeGroup.add(wheel);
    });

    // Siren Bar & Beacon Beams
    const sirenBar = new THREE.Mesh(track(new THREE.BoxGeometry(0.6, 0.08, 0.28)), carDark);
    sirenBar.position.set(-0.1, 1.36, 0);
    policeGroup.add(sirenBar);

    const sirenRedMat = trackM(new THREE.MeshStandardMaterial({ color: 0xff1111, emissive: 0xff1111, emissiveIntensity: 4 }));
    const sirenBlueMat = trackM(new THREE.MeshStandardMaterial({ color: 0x1144ff, emissive: 0x1144ff, emissiveIntensity: 4 }));

    const sirenRedMesh = new THREE.Mesh(track(new THREE.BoxGeometry(0.24, 0.12, 0.22)), sirenRedMat);
    sirenRedMesh.position.set(-0.25, 1.45, 0);
    const sirenBlueMesh = new THREE.Mesh(track(new THREE.BoxGeometry(0.24, 0.12, 0.22)), sirenBlueMat);
    sirenBlueMesh.position.set(0.05, 1.45, 0);
    policeGroup.add(sirenRedMesh, sirenBlueMesh);

    // Dynamic Siren Lights
    const policeLightR = new THREE.PointLight(0xff1111, 10, 16);
    policeLightR.position.set(-0.25, 1.6, 0);
    const policeLightB = new THREE.PointLight(0x1144ff, 10, 16);
    policeLightB.position.set(0.05, 1.6, 0);
    policeGroup.add(policeLightR, policeLightB);

    // ---- Pointer + animation ----
    // NDC relative to the canvas (not the window) so lasers land on the cursor.
    const pointer = { x: 0, y: 0 };
    const onPointer = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    };
    window.addEventListener("pointermove", onPointer);

    const intro = { v: 0 };
    const clock = new THREE.Clock();
    let raf = 0;

    // Full-viewport layout: anchor the robot left on desktop so the lasers can
    // reach the cursor anywhere across the whole page.
    let baseScale = 1;
    const layout = () => {
      const aspect = w() / h();
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
      renderer.setSize(w(), h());
      const halfH =
        Math.tan((camera.fov * Math.PI) / 180 / 2) * camera.position.z;
      const halfW = halfH * aspect;
      if (aspect >= 1) {
        mascot.position.set(-halfW * 0.4, -0.2, 0);
        baseScale = 1.05;
      } else {
        mascot.position.set(0, -0.6, 0);
        baseScale = 0.78;
      }
    };
    layout();

    const render = () => {
      const t = clock.getElapsedTime();
      intro.v += (1 - intro.v) * 0.04;

      const ty = pointer.x * 0.7;
      const tx = -pointer.y * 0.4;
      head.rotation.y += (ty - head.rotation.y) * 0.09;
      head.rotation.x += (tx - head.rotation.x) * 0.09;
      eyeGroup.position.x = pointer.x * 0.04;
      eyeGroup.position.y = pointer.y * 0.03;

      robot.rotation.y = pointer.x * 0.12;
      robot.position.y = 0.05 + Math.sin(t * 1.4) * 0.04;
      antBall.position.x = Math.sin(t * 2.2) * 0.04;
      mascot.scale.setScalar(baseScale * (0.62 + intro.v * 0.4));

      const pulse = 1.4 + Math.sin(t * 3) * 0.5;
      eyeMat.emissiveIntensity = pulse;

      coins.forEach((c, i) => {
        c.rotation.z += 0.02 + i * 0.002;
        c.position.y += Math.sin(t * 1.2 + i) * 0.002;
      });

      // Police car siren strobing animation (lampu bergerak)
      const sirenStrobe = Math.sin(t * 16) > 0;
      policeLightR.intensity = sirenStrobe ? 15 : 0;
      policeLightB.intensity = !sirenStrobe ? 15 : 0;
      sirenRedMat.emissiveIntensity = sirenStrobe ? 5 : 0.2;
      sirenBlueMat.emissiveIntensity = !sirenStrobe ? 5 : 0.2;
      policeGroup.position.y = -2.1 + Math.sin(t * 28) * 0.007; // Engine idle vibration

      // Animate AI Security Crystal over the gold pile
      securityCrystal.rotation.y = t * 1.5;
      securityCrystal.position.y = 1.3 + Math.sin(t * 3) * 0.1;
      crystalLight.intensity = 4 + Math.sin(t * 5) * 2;

      renderer.render(scene, camera);
      if (!prefersReduced) raf = requestAnimationFrame(render);
    };
    render();

    const onResize = () => layout();
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("resize", onResize);
      geos.forEach((g) => g.dispose());
      mats.forEach((m) => m.dispose());
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 z-20 h-full w-full"
      aria-hidden
    />
  );
}
