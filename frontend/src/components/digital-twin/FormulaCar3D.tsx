import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { CornerPosition, CornerRiskState, CornerTyreState } from "../../types";

interface FormulaCar3DProps {
  tyres: Record<CornerPosition, CornerTyreState>;
  selectedPosition: CornerPosition;
  onSelectPosition: (position: CornerPosition) => void;
  onHoverPosition: (position: CornerPosition | null, screenPos?: { x: number; y: number }) => void;
}

type CameraViewMode = "ISO" | "TOP" | "SIDE";

const CAMERA_PRESETS: Record<CameraViewMode, THREE.Vector3> = {
  ISO: new THREE.Vector3(7.5, 6.0, 7.5),
  TOP: new THREE.Vector3(0.0, 11.5, 0.1),
  SIDE: new THREE.Vector3(10.0, 2.5, 0.0),
};

const WHEEL_CENTERS: Record<CornerPosition, THREE.Vector3> = {
  FL: new THREE.Vector3(1.85, 0.45, -2.5),
  FR: new THREE.Vector3(-1.85, 0.45, -2.5),
  RL: new THREE.Vector3(1.95, 0.52, 2.65),
  RR: new THREE.Vector3(-1.95, 0.52, 2.65),
};

/**
 * Procedural F1 track texture generator with asphalt grain,
 * alternating red/white Silverstone kerbs, boundary lines, and telemetry dashed lines.
 */
function createTrackTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    // 1. Dark high-contrast motorsport asphalt base
    ctx.fillStyle = "#0c0f16";
    ctx.fillRect(0, 0, 512, 1024);

    // 2. Dark racing rubber groove (underneath car trajectory)
    const grooveGrad = ctx.createLinearGradient(120, 0, 392, 0);
    grooveGrad.addColorStop(0, "rgba(5, 7, 10, 0)");
    grooveGrad.addColorStop(0.3, "rgba(4, 5, 8, 0.7)");
    grooveGrad.addColorStop(0.5, "rgba(2, 3, 5, 0.85)");
    grooveGrad.addColorStop(0.7, "rgba(4, 5, 8, 0.7)");
    grooveGrad.addColorStop(1, "rgba(5, 7, 10, 0)");
    ctx.fillStyle = grooveGrad;
    ctx.fillRect(120, 0, 272, 1024);

    // 3. High-Visibility Silverstone Kerbs (Alternating Vivid Red & Crisp White)
    // Placed right in the camera view alongside the wheels
    const kerbWidth = 52;
    const kerbSegmentH = 64; // 16 alternating red/white teeth
    for (let y = 0; y < 1024; y += kerbSegmentH) {
      const isRed = (y / kerbSegmentH) % 2 === 0;
      ctx.fillStyle = isRed ? "#E10600" : "#FFFFFF";

      // Left Track Kerb (x ≈ -4.2 in 3D world units)
      ctx.fillRect(60, y, kerbWidth, kerbSegmentH);
      // Right Track Kerb (x ≈ +4.2 in 3D world units)
      ctx.fillRect(512 - 60 - kerbWidth, y, kerbWidth, kerbSegmentH);
    }

    // 4. Bright Solid White Kerb Boundary Lines
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(60 + kerbWidth, 0, 6, 1024);
    ctx.fillRect(512 - 60 - kerbWidth - 6, 0, 6, 1024);

    // 5. Crisp White Dashed Lane Guide Markings (Immediately outside Left & Right Wheels)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
    ctx.lineWidth = 5;
    ctx.setLineDash([56, 40]);
    // Left Lane Dash (x ≈ -2.2)
    ctx.beginPath();
    ctx.moveTo(175, 0);
    ctx.lineTo(175, 1024);
    ctx.stroke();

    // Right Lane Dash (x ≈ +2.2)
    ctx.beginPath();
    ctx.moveTo(337, 0);
    ctx.lineTo(337, 1024);
    ctx.stroke();

    // 6. Glowing Cyan Forward Velocity Chevrons (>>>) along Centerline
    ctx.strokeStyle = "#00E5FF";
    ctx.lineWidth = 4;
    ctx.setLineDash([]); // solid lines for chevrons
    for (let y = 20; y < 1024; y += 96) {
      ctx.beginPath();
      // Arrow pointing forward (-Y in texture)
      ctx.moveTo(236, y + 24);
      ctx.lineTo(256, y);
      ctx.lineTo(276, y + 24);
      ctx.stroke();
    }

    // 7. Transverse Telemetry Speed Distance Bars
    ctx.strokeStyle = "rgba(0, 229, 255, 0.45)";
    ctx.lineWidth = 2;
    for (let y = 0; y < 1024; y += 128) {
      ctx.beginPath();
      ctx.moveTo(120, y);
      ctx.lineTo(392, y);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 10);
  return texture;
}

export const FormulaCar3D: React.FC<FormulaCar3DProps> = ({
  tyres,
  selectedPosition,
  onSelectPosition,
  onHoverPosition,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraMode, setCameraMode] = useState<CameraViewMode>("ISO");
  const [isRotating, setIsRotating] = useState<boolean>(true);

  // References for Three.js animation and interaction
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const wheelsGroupRef = useRef<Record<CornerPosition, THREE.Group | null>>({
    FL: null,
    FR: null,
    RL: null,
    RR: null,
  });
  const warningRingsRef = useRef<Record<CornerPosition, THREE.Mesh | null>>({
    FL: null,
    FR: null,
    RL: null,
    RR: null,
  });
  const wheelMeshesListRef = useRef<{ mesh: THREE.Mesh; position: CornerPosition }[]>([]);
  const targetCamPosRef = useRef<THREE.Vector3>(CAMERA_PRESETS.ISO.clone());
  const targetCamLookRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0.4, 0));
  const hoveredPosRef = useRef<CornerPosition | null>(null);

  // Update camera target based on camera mode and selected wheel
  const handleCameraChange = useCallback((mode: CameraViewMode) => {
    setCameraMode(mode);
    targetCamPosRef.current.copy(CAMERA_PRESETS[mode]);
    targetCamLookRef.current.set(0, 0.4, 0);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color("#08090B");
    scene.fog = new THREE.FogExp2("#08090B", 0.035);

    // 2. Camera setup
    const width = container.clientWidth;
    const height = container.clientHeight;
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.copy(CAMERA_PRESETS.ISO);
    camera.lookAt(0, 0.4, 0);
    cameraRef.current = camera;

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // 4. Lighting System
    const ambientLight = new THREE.AmbientLight("#222733", 1.8);
    scene.add(ambientLight);

    const mainKeyLight = new THREE.DirectionalLight("#FFFFFF", 2.4);
    mainKeyLight.position.set(8, 12, 6);
    mainKeyLight.castShadow = true;
    mainKeyLight.shadow.mapSize.width = 1024;
    mainKeyLight.shadow.mapSize.height = 1024;
    mainKeyLight.shadow.camera.near = 0.5;
    mainKeyLight.shadow.camera.far = 25;
    mainKeyLight.shadow.bias = -0.001;
    scene.add(mainKeyLight);

    const rimLight = new THREE.DirectionalLight("#00E5FF", 1.2);
    rimLight.position.set(-8, 5, -8);
    scene.add(rimLight);

    const pitRedLight = new THREE.PointLight("#E10600", 1.5, 12);
    pitRedLight.position.set(0, 3, 4);
    scene.add(pitRedLight);

    // 5. Track Ground Plane with Animated F1 Track Texture & Telemetry Flow
    const runoffGeo = new THREE.PlaneGeometry(64, 80);
    const runoffMat = new THREE.MeshStandardMaterial({
      color: "#06080B",
      roughness: 0.95,
      metalness: 0.1,
    });
    const runoff = new THREE.Mesh(runoffGeo, runoffMat);
    runoff.rotation.x = -Math.PI / 2;
    runoff.position.y = -0.015;
    runoff.receiveShadow = true;
    scene.add(runoff);

    const trackTexture = createTrackTexture();
    const groundGeo = new THREE.PlaneGeometry(16, 80);
    const groundMat = new THREE.MeshStandardMaterial({
      map: trackTexture,
      roughness: 0.75,
      metalness: 0.15,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    scene.add(ground);

    // Moving Telemetry Ground Grid
    const gridHelper = new THREE.GridHelper(40, 40, "#1F2937", "#0D1117");
    gridHelper.position.y = 0.001;
    scene.add(gridHelper);

    // High-Visibility Aerodynamic Speed Streaks Rushing Backward
    const streaksGroup = new THREE.Group();
    scene.add(streaksGroup);
    const streakCount = 32;
    const streakData: { mesh: THREE.Line; speed: number }[] = [];
    const streakPalette = ["#00E5FF", "#FFFFFF", "#FFB000", "#E10600", "#00E676"];
    for (let i = 0; i < streakCount; i++) {
      const streakGeo = new THREE.BufferGeometry();
      const len = 3.5 + Math.random() * 5.0;
      streakGeo.setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, len)]);
      const color = streakPalette[i % streakPalette.length];
      const streakMat = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.65 + Math.random() * 0.35,
      });
      const streakMesh = new THREE.Line(streakGeo, streakMat);
      const side = Math.random() > 0.5 ? 1 : -1;
      streakMesh.position.x = side * (2.2 + Math.random() * 6.0);
      streakMesh.position.y = 0.15 + Math.random() * 1.8;
      streakMesh.position.z = -35 + Math.random() * 70;
      streaksGroup.add(streakMesh);
      streakData.push({ mesh: streakMesh, speed: 52 + Math.random() * 36 });
    }

    // Subtle Trackside Distance Telemetry Markers
    const markersGroup = new THREE.Group();
    scene.add(markersGroup);
    const markerGeo = new THREE.BoxGeometry(0.12, 0.4, 0.12);
    const markerMat = new THREE.MeshBasicMaterial({ color: "#00E5FF", transparent: true, opacity: 0.4 });
    const trackMarkers: THREE.Mesh[] = [];
    for (let i = 0; i < 8; i++) {
      const marker = new THREE.Mesh(markerGeo, markerMat);
      const side = i % 2 === 0 ? 1 : -1;
      marker.position.set(side * 8.1, 0.2, -30 + i * 8.5);
      markersGroup.add(marker);
      trackMarkers.push(marker);
    }

    // 6. PROCEDURAL FORMULA RACING CAR
    const carRoot = new THREE.Group();
    scene.add(carRoot);

    // Common Materials
    const carbonMat = new THREE.MeshStandardMaterial({
      color: "#121418",
      roughness: 0.35,
      metalness: 0.7,
    });
    const liveryMat = new THREE.MeshStandardMaterial({
      color: "#0A0D14",
      roughness: 0.25,
      metalness: 0.85,
    });
    const redAccentMat = new THREE.MeshStandardMaterial({
      color: "#E10600",
      roughness: 0.2,
      metalness: 0.4,
    });
    const yellowMediumMat = new THREE.MeshStandardMaterial({
      color: "#FFB000",
      roughness: 0.2,
      metalness: 0.4,
    });
    const metalMat = new THREE.MeshStandardMaterial({
      color: "#88909E",
      roughness: 0.3,
      metalness: 0.9,
    });
    const visorMat = new THREE.MeshStandardMaterial({
      color: "#FFB000",
      roughness: 0.05,
      metalness: 0.95,
    });

    // A. Main Monocoque Chassis
    const chassisGeo = new THREE.BoxGeometry(1.25, 0.48, 4.4);
    const chassisMesh = new THREE.Mesh(chassisGeo, liveryMat);
    chassisMesh.position.set(0, 0.42, 0.1);
    chassisMesh.castShadow = true;
    carRoot.add(chassisMesh);

    // Top racing stripe
    const stripeGeo = new THREE.BoxGeometry(0.18, 0.5, 4.42);
    const stripeMesh = new THREE.Mesh(stripeGeo, redAccentMat);
    stripeMesh.position.set(0, 0.42, 0.1);
    carRoot.add(stripeMesh);

    // B. Aerodynamic Nosecone (Tapered forward)
    const noseGeo = new THREE.ConeGeometry(0.42, 2.3, 5);
    const noseMesh = new THREE.Mesh(noseGeo, liveryMat);
    noseMesh.rotation.x = Math.PI / 2;
    noseMesh.rotation.y = Math.PI / 4;
    noseMesh.position.set(0, 0.34, -2.6);
    noseMesh.scale.set(1.4, 1.0, 0.55);
    noseMesh.castShadow = true;
    carRoot.add(noseMesh);

    // Front nose tip camera / pitot tube
    const tipGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.6, 8);
    const tipMesh = new THREE.Mesh(tipGeo, carbonMat);
    tipMesh.rotation.x = Math.PI / 2;
    tipMesh.position.set(0, 0.26, -3.8);
    carRoot.add(tipMesh);

    // C. Multi-tier Front Wing Assembly
    const frontWingMainGeo = new THREE.BoxGeometry(3.6, 0.06, 0.65);
    const frontWingMain = new THREE.Mesh(frontWingMainGeo, carbonMat);
    frontWingMain.position.set(0, 0.16, -3.4);
    frontWingMain.castShadow = true;
    carRoot.add(frontWingMain);

    // Upper flap
    const frontWingUpperGeo = new THREE.BoxGeometry(3.4, 0.04, 0.4);
    const frontWingUpper = new THREE.Mesh(frontWingUpperGeo, redAccentMat);
    frontWingUpper.position.set(0, 0.23, -3.3);
    frontWingUpper.rotation.x = -0.12;
    carRoot.add(frontWingUpper);

    // Front Wing Endplates
    for (const side of [-1.8, 1.8]) {
      const endplateGeo = new THREE.BoxGeometry(0.05, 0.32, 0.95);
      const endplate = new THREE.Mesh(endplateGeo, redAccentMat);
      endplate.position.set(side, 0.24, -3.4);
      carRoot.add(endplate);
    }

    // D. Sidepods (Left & Right with radiators)
    for (const side of [-0.88, 0.88]) {
      const sidepodGeo = new THREE.BoxGeometry(0.68, 0.42, 2.4);
      const sidepod = new THREE.Mesh(sidepodGeo, liveryMat);
      sidepod.position.set(side, 0.38, 0.2);
      sidepod.castShadow = true;
      carRoot.add(sidepod);

      // Radiator Intake duct
      const intakeGeo = new THREE.BoxGeometry(0.55, 0.3, 0.15);
      const intake = new THREE.Mesh(intakeGeo, carbonMat);
      intake.position.set(side, 0.4, -0.98);
      carRoot.add(intake);

      // Bargeboards / floor edge
      const floorEdgeGeo = new THREE.BoxGeometry(0.85, 0.04, 2.7);
      const floorEdge = new THREE.Mesh(floorEdgeGeo, carbonMat);
      floorEdge.position.set(side * 1.08, 0.12, 0.2);
      carRoot.add(floorEdge);
    }

    // E. Cockpit, Safety Halo, Driver Helmet
    const cockpitCutoutGeo = new THREE.BoxGeometry(0.58, 0.25, 1.1);
    const cockpitCutout = new THREE.Mesh(cockpitCutoutGeo, carbonMat);
    cockpitCutout.position.set(0, 0.58, -0.2);
    carRoot.add(cockpitCutout);

    // Safety Halo structure
    const haloRingGeo = new THREE.TorusGeometry(0.38, 0.045, 8, 24, Math.PI);
    const haloRing = new THREE.Mesh(haloRingGeo, carbonMat);
    haloRing.rotation.x = -Math.PI / 2 + 0.25;
    haloRing.position.set(0, 0.82, -0.15);
    carRoot.add(haloRing);

    const haloPillarGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.4, 8);
    const haloPillar = new THREE.Mesh(haloPillarGeo, carbonMat);
    haloPillar.position.set(0, 0.72, -0.52);
    haloPillar.rotation.x = -0.3;
    carRoot.add(haloPillar);

    // Driver Helmet (#23 Albon style)
    const helmetGeo = new THREE.SphereGeometry(0.18, 16, 16);
    const helmetMat = new THREE.MeshStandardMaterial({
      color: "#00E5FF",
      roughness: 0.2,
      metalness: 0.5,
    });
    const helmet = new THREE.Mesh(helmetGeo, helmetMat);
    helmet.position.set(0, 0.73, -0.08);
    helmet.castShadow = true;
    carRoot.add(helmet);

    // Helmet Visor
    const visorGeo = new THREE.BoxGeometry(0.24, 0.08, 0.16);
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 0.73, -0.19);
    carRoot.add(visor);

    // F. Engine Cover, Airbox & Shark Fin
    const airboxGeo = new THREE.CylinderGeometry(0.24, 0.35, 1.8, 8);
    const airbox = new THREE.Mesh(airboxGeo, liveryMat);
    airbox.rotation.x = -Math.PI / 2 + 0.15;
    airbox.position.set(0, 0.72, 0.9);
    airbox.castShadow = true;
    carRoot.add(airbox);

    // Shark Fin
    const finShape = new THREE.Shape();
    finShape.moveTo(0, 0);
    finShape.lineTo(0, 0.55);
    finShape.lineTo(1.6, 0.08);
    finShape.lineTo(1.6, 0);
    finShape.closePath();
    const finExtrude = new THREE.ExtrudeGeometry(finShape, { depth: 0.04, bevelEnabled: false });
    const finMesh = new THREE.Mesh(finExtrude, carbonMat);
    finMesh.rotation.y = -Math.PI / 2;
    finMesh.position.set(0.02, 0.65, 0.6);
    carRoot.add(finMesh);

    // G. Rear Wing Assembly & Diffuser
    const rwMainGeo = new THREE.BoxGeometry(2.4, 0.08, 0.55);
    const rwMain = new THREE.Mesh(rwMainGeo, carbonMat);
    rwMain.position.set(0, 1.05, 2.7);
    rwMain.rotation.x = 0.2;
    rwMain.castShadow = true;
    carRoot.add(rwMain);

    // DRS Flap
    const drsFlapGeo = new THREE.BoxGeometry(2.3, 0.04, 0.35);
    const drsFlap = new THREE.Mesh(drsFlapGeo, redAccentMat);
    drsFlap.position.set(0, 1.15, 2.65);
    drsFlap.rotation.x = 0.32;
    carRoot.add(drsFlap);

    // Rear Wing Endplates
    for (const side of [-1.2, 1.2]) {
      const rwEndplateGeo = new THREE.BoxGeometry(0.05, 0.95, 0.85);
      const rwEndplate = new THREE.Mesh(rwEndplateGeo, redAccentMat);
      rwEndplate.position.set(side, 0.85, 2.7);
      carRoot.add(rwEndplate);
    }

    // Rear Wing Twin Pylons
    for (const side of [-0.22, 0.22]) {
      const pylonGeo = new THREE.BoxGeometry(0.04, 0.85, 0.1);
      const pylon = new THREE.Mesh(pylonGeo, carbonMat);
      pylon.position.set(side, 0.68, 2.6);
      carRoot.add(pylon);
    }

    // Rear Rain Light
    const rainLightGeo = new THREE.BoxGeometry(0.12, 0.08, 0.04);
    const rainLightMat = new THREE.MeshBasicMaterial({ color: "#FF0000" });
    const rainLight = new THREE.Mesh(rainLightGeo, rainLightMat);
    rainLight.position.set(0, 0.25, 2.92);
    carRoot.add(rainLight);

    // Rear Diffuser strakes
    const diffuserGeo = new THREE.BoxGeometry(1.6, 0.22, 0.6);
    const diffuser = new THREE.Mesh(diffuserGeo, carbonMat);
    diffuser.position.set(0, 0.16, 2.5);
    diffuser.rotation.x = -0.22;
    carRoot.add(diffuser);

    // H. Suspension Wishbones (connecting chassis to each wheel hub)
    const createWishbones = (startX: number, startY: number, startZ: number, endX: number, endY: number, endZ: number) => {
      const points = [
        new THREE.Vector3(startX, startY, startZ),
        new THREE.Vector3(endX, endY, endZ),
      ];
      const lineGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 4, 0.03, 6, false);
      return new THREE.Mesh(lineGeo, metalMat);
    };

    // Front suspension
    carRoot.add(createWishbones(0.6, 0.45, -2.4, 1.6, 0.45, -2.5));
    carRoot.add(createWishbones(0.6, 0.28, -2.6, 1.6, 0.28, -2.5));
    carRoot.add(createWishbones(-0.6, 0.45, -2.4, -1.6, 0.45, -2.5));
    carRoot.add(createWishbones(-0.6, 0.28, -2.6, -1.6, 0.28, -2.5));

    // Rear suspension
    carRoot.add(createWishbones(0.6, 0.5, 2.5, 1.7, 0.5, 2.65));
    carRoot.add(createWishbones(0.6, 0.3, 2.7, 1.7, 0.3, 2.65));
    carRoot.add(createWishbones(-0.6, 0.5, 2.5, -1.7, 0.5, 2.65));
    carRoot.add(createWishbones(-0.6, 0.3, 2.7, -1.7, 0.3, 2.65));

    // 7. FOUR INDEPENDENT WHEELS (FL, FR, RL, RR)
    const wheelMeshesList: { mesh: THREE.Mesh; position: CornerPosition }[] = [];
    const corners: CornerPosition[] = ["FL", "FR", "RL", "RR"];

    corners.forEach((pos) => {
      const center = WHEEL_CENTERS[pos];
      const isFront = pos.startsWith("F");
      const isLeft = pos.endsWith("L");

      const wheelGroup = new THREE.Group();
      wheelGroup.position.copy(center);
      carRoot.add(wheelGroup);
      wheelsGroupRef.current[pos] = wheelGroup;

      const outerR = isFront ? 0.44 : 0.51;
      const widthR = isFront ? 0.38 : 0.52;

      // Tire Rubber Mesh (Cylinder rotated horizontally along X-axis)
      const tyreGeo = new THREE.CylinderGeometry(outerR, outerR, widthR, 32);
      const tyreMat = new THREE.MeshStandardMaterial({
        color: "#16181C",
        roughness: 0.85,
        metalness: 0.15,
      });
      const tyreMesh = new THREE.Mesh(tyreGeo, tyreMat);
      tyreMesh.rotation.z = Math.PI / 2;
      tyreMesh.castShadow = true;
      wheelGroup.add(tyreMesh);

      // Register tyreMesh for raycaster click/hover
      wheelMeshesList.push({ mesh: tyreMesh, position: pos });

      // Rim & Central Wheel Nut
      const rimGeo = new THREE.CylinderGeometry(outerR * 0.58, outerR * 0.58, widthR * 1.02, 24);
      const rimMat = new THREE.MeshStandardMaterial({
        color: "#0c0e12",
        roughness: 0.25,
        metalness: 0.85,
      });
      const rimMesh = new THREE.Mesh(rimGeo, rimMat);
      rimMesh.rotation.z = Math.PI / 2;
      wheelGroup.add(rimMesh);

      // Wheel Nut (Red for left side, Blue for right side as in motorsport)
      const nutGeo = new THREE.CylinderGeometry(0.08, 0.08, widthR * 1.06, 12);
      const nutMat = new THREE.MeshStandardMaterial({
        color: isLeft ? "#E10600" : "#00E5FF",
        roughness: 0.1,
        metalness: 0.9,
      });
      const nutMesh = new THREE.Mesh(nutGeo, nutMat);
      nutMesh.rotation.z = Math.PI / 2;
      wheelGroup.add(nutMesh);

      // Sidewall Compound Stripe
      const stripeRadius = outerR * 0.72;
      const sidewallStripeGeo = new THREE.RingGeometry(stripeRadius - 0.02, stripeRadius + 0.02, 32);
      const sidewallStripeMat = new THREE.MeshBasicMaterial({
        color: "#FFB000",
        side: THREE.DoubleSide,
      });
      const sidewallStripe = new THREE.Mesh(sidewallStripeGeo, sidewallStripeMat);
      sidewallStripe.rotation.y = Math.PI / 2;
      sidewallStripe.position.x = isLeft ? widthR / 2 + 0.005 : -widthR / 2 - 0.005;
      wheelGroup.add(sidewallStripe);

      // Brake Duct Aero Shroud behind wheel
      const brakeDuctGeo = new THREE.BoxGeometry(0.12, outerR * 0.85, outerR * 0.85);
      const brakeDuct = new THREE.Mesh(brakeDuctGeo, carbonMat);
      brakeDuct.position.set(isLeft ? -widthR / 2 - 0.06 : widthR / 2 + 0.06, 0, 0);
      carRoot.add(brakeDuct);

      // Warning/Critical Ground Ring (Hidden by default, illuminated when warning/critical)
      const ringGeo = new THREE.RingGeometry(outerR + 0.15, outerR + 0.38, 36);
      const ringMat = new THREE.MeshBasicMaterial({
        color: "#FFB000",
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.0,
      });
      const warningRing = new THREE.Mesh(ringGeo, ringMat);
      warningRing.rotation.x = -Math.PI / 2;
      warningRing.position.set(center.x, 0.02, center.z);
      carRoot.add(warningRing);
      warningRingsRef.current[pos] = warningRing;
    });

    wheelMeshesListRef.current = wheelMeshesList;

    // 8. Raycaster Mouse Interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const getIntersectedWheel = (event: MouseEvent): { position: CornerPosition; clientX: number; clientY: number } | null => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const targetMeshes = wheelMeshesListRef.current.map((item) => item.mesh);
      const intersects = raycaster.intersectObjects(targetMeshes, false);

      if (intersects.length > 0) {
        const hitMesh = intersects[0].object as THREE.Mesh;
        const matched = wheelMeshesListRef.current.find((item) => item.mesh === hitMesh);
        if (matched) {
          return {
            position: matched.position,
            clientX: event.clientX,
            clientY: event.clientY,
          };
        }
      }
      return null;
    };

    const handleMouseMove = (event: MouseEvent) => {
      const hit = getIntersectedWheel(event);
      if (hit) {
        canvas.style.cursor = "pointer";
        if (hoveredPosRef.current !== hit.position) {
          hoveredPosRef.current = hit.position;
          onHoverPosition(hit.position, { x: hit.clientX, y: hit.clientY });
        }
      } else {
        canvas.style.cursor = "default";
        if (hoveredPosRef.current !== null) {
          hoveredPosRef.current = null;
          onHoverPosition(null);
        }
      }
    };

    const handleClick = (event: MouseEvent) => {
      const hit = getIntersectedWheel(event);
      if (hit) {
        onSelectPosition(hit.position);
      }
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("click", handleClick);

    // 9. Render Loop (Target 60 FPS)
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Smooth camera interpolation toward target position and lookAt
      camera.position.lerp(targetCamPosRef.current, 0.06);
      camera.lookAt(targetCamLookRef.current);

      // Continuous subtle wheel rotation (Formula car running at speed)
      corners.forEach((pos) => {
        const wg = wheelsGroupRef.current[pos];
        if (wg) {
          wg.children.forEach((child) => {
            // Rotate the tyre and rim around horizontal axis (X-axis of wheel group)
            child.rotation.x -= 0.04;
          });
        }

        // Pulse warning/critical rings based on tyre risk state
        const ring = warningRingsRef.current[pos];
        const tyreState = tyres[pos];
        const isSelected = pos === selectedPosition;
        const isHovered = pos === hoveredPosRef.current;

        // Subtle tyre selection highlight, dimming, and hover focus
        const wheelItem = wheelMeshesListRef.current.find((w) => w.position === pos);
        if (wheelItem) {
          const tMat = wheelItem.mesh.material as THREE.MeshStandardMaterial;
          if (isSelected) {
            tMat.emissive.set(isHovered ? "#002d38" : "#00141d");
            tMat.roughness = 0.78;
          } else if (isHovered) {
            tMat.emissive.set("#141922");
            tMat.roughness = 0.8;
          } else {
            tMat.emissive.set("#000000");
            tMat.roughness = 0.88;
          }
        }

        if (ring && tyreState) {
          const riskState = tyreState.risk_state;
          const mat = ring.material as THREE.MeshBasicMaterial;

          if (riskState === "FAILURE_RISK") {
            // Rapid high-intensity red pulse
            mat.color.set("#FF0000");
            mat.opacity = 0.55 + Math.sin(time * 8.0) * 0.35;
            ring.scale.setScalar(1.0 + Math.sin(time * 8.0) * 0.06);
          } else if (riskState === "CRITICAL") {
            // Strong rhythmic red pulse
            mat.color.set("#E10600");
            mat.opacity = 0.45 + Math.sin(time * 4.5) * 0.25;
            ring.scale.setScalar(1.0 + Math.sin(time * 4.5) * 0.04);
          } else if (riskState === "WARNING") {
            // Gentle amber pulse
            mat.color.set("#FFB000");
            mat.opacity = 0.35 + Math.sin(time * 3.0) * 0.15;
            ring.scale.setScalar(1.0 + Math.sin(time * 3.0) * 0.03);
          } else {
            // NORMAL: Subtle cyan telemetry ring for selected tyre, with subtle hover feedback
            if (isSelected) {
              mat.color.set("#00E5FF");
              mat.opacity = 0.38 + Math.sin(time * 3.2) * 0.12;
              ring.scale.setScalar(1.0 + Math.sin(time * 3.2) * 0.02);
            } else if (isHovered) {
              mat.color.set("#00A8CC");
              mat.opacity = 0.22;
              ring.scale.setScalar(1.01);
            } else {
              mat.opacity = 0.0;
            }
          }
        }
      });

      // High-speed track environment backward flow (car stays stationary in front)
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!prefersReducedMotion) {
        // Continuous high-speed track surface backward motion (simulating 300+ km/h)
        trackTexture.offset.y += delta * 15.0;

        // Telemetry ground grid backward motion (seamless modulo matching 1.0 unit grid spacing)
        gridHelper.position.z = (time * 26.0) % 1.0;

        // Aerodynamic high-speed light streaks rushing backward along +Z past the car
        streakData.forEach((s) => {
          s.mesh.position.z += s.speed * delta;
          if (s.mesh.position.z > 35) {
            s.mesh.position.z = -38;
            const side = Math.random() > 0.5 ? 1 : -1;
            s.mesh.position.x = side * (2.2 + Math.random() * 6.0);
            s.mesh.position.y = 0.15 + Math.random() * 1.8;
          }
        });

        // Trackside distance markers passing backward along +Z
        trackMarkers.forEach((marker) => {
          marker.position.z += 34.0 * delta;
          if (marker.position.z > 35) {
            marker.position.z = -38;
          }
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    // 10. Handle window resize
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    // 11. Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("click", handleClick);
      window.removeEventListener("resize", handleResize);

      // Dispose track motion resources
      trackTexture.dispose();
      groundGeo.dispose();
      groundMat.dispose();
      runoffGeo.dispose();
      runoffMat.dispose();
      gridHelper.dispose();
      streaksGroup.children.forEach((c) => {
        const line = c as THREE.Line;
        line.geometry.dispose();
        (line.material as THREE.Material).dispose();
      });
      markersGroup.children.forEach((c) => {
        const mesh = c as THREE.Mesh;
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
      });

      // Dispose Three.js objects
      renderer.dispose();
      scene.clear();
    };
  }, [onHoverPosition, onSelectPosition]);

  // Update camera focus subtly when selected tyre changes
  useEffect(() => {
    if (cameraMode === "ISO") {
      const center = WHEEL_CENTERS[selectedPosition];
      // Shift look target slightly toward selected wheel while keeping overall vehicle context
      targetCamLookRef.current.set(center.x * 0.4, 0.4, center.z * 0.35);
    }
  }, [selectedPosition, cameraMode]);

  return (
    <div ref={containerRef} className="relative w-full h-[420px] sm:h-[480px] lg:h-[540px] bg-[#08090B] rounded-xl overflow-hidden border border-[#1E232B] hover:border-[#2C3545] shadow-[0_12px_40px_rgba(0,0,0,0.8),0_0_20px_rgba(0,229,255,0.04)] transition-all duration-300 select-none group">
      {/* Three.js Canvas */}
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Top Left: Active Telemetry HUD Overlay */}
      <div className="absolute top-3 left-3 z-10 flex flex-col space-y-1">
        <div className="flex items-center space-x-2 bg-[#101216]/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#222733] text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-[#00E676] animate-pulse" />
          <span className="text-white font-bold tracking-wider">3D FORMULA CAR DIGITAL TWIN</span>
          <span className="text-[#606775]">•</span>
          <span className="text-[#00E5FF] font-black">60 FPS WEBGL</span>
        </div>
      </div>

      {/* Top Right: Camera View Controls */}
      <div className="absolute top-3 right-3 z-10 flex items-center space-x-1.5 bg-[#101216]/90 backdrop-blur-md p-1.5 rounded-lg border border-[#222733] font-mono text-[11px]">
        {(["ISO", "TOP", "SIDE"] as CameraViewMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => handleCameraChange(mode)}
            className={`px-3 py-1 rounded font-bold uppercase transition-all cursor-pointer ${
              cameraMode === mode
                ? "bg-[#E10600] text-white shadow-[0_0_10px_rgba(225,6,0,0.5)]"
                : "text-[#9A9FA8] hover:text-white hover:bg-[#1A1D24]"
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Bottom Left: Visual Status Legend (Text + Color + Icon, not color alone) */}
      <div className="absolute bottom-3 left-3 z-10 flex flex-wrap items-center gap-2 bg-[#101216]/90 backdrop-blur-md px-3 py-2 rounded-lg border border-[#222733] font-mono text-[10px]">
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-[#00E676]" />
          <span className="text-[#9A9FA8]">OPTIMAL</span>
        </div>
        <span className="text-[#2A313F]">•</span>
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-[#FFB000]" />
          <span className="text-[#FFB000]">WARNING</span>
        </div>
        <span className="text-[#2A313F]">•</span>
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-[#E10600] animate-pulse" />
          <span className="text-[#FF2A1A] font-bold">CRITICAL</span>
        </div>
        <span className="text-[#2A313F]">•</span>
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-[#FF0055] animate-ping" />
          <span className="text-[#FF0055] font-black">FAILURE RISK</span>
        </div>
      </div>

      {/* Bottom Right: Selected Tyre Indicator */}
      <div className="absolute bottom-3 right-3 z-10 bg-[#101216]/90 backdrop-blur-md px-3 py-2 rounded-lg border border-[#222733] font-mono text-right">
        <span className="text-[10px] text-[#606775] uppercase block">ACTIVE SELECTION</span>
        <span className="text-xs font-black text-white flex items-center justify-end space-x-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              tyres[selectedPosition]?.risk_state === "CRITICAL"
                ? "bg-[#E10600]"
                : tyres[selectedPosition]?.risk_state === "WARNING"
                ? "bg-[#FFB000]"
                : "bg-[#00E676]"
            }`}
          />
          <span>{tyres[selectedPosition]?.position_label || selectedPosition}</span>
        </span>
      </div>
    </div>
  );
};
