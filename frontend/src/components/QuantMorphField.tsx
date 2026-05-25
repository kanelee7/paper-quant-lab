import React, { useEffect, useRef } from 'react';
import { Renderer, Camera, Transform, Geometry, Program, Mesh, Vec2 } from 'ogl';
import { Box, useToken, useBreakpointValue } from '@chakra-ui/react';

// Simple deterministic random
const createRandom = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
};

const vertex = `
  attribute vec3 position;
  attribute float pointType;

  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform vec2 uMouse;
  uniform float uObjectScale;

  varying float vType;
  varying float vAlpha;

  void main() {
    vType = pointType;
    vec3 pos = position * uObjectScale;
    
    // Constant analytical drift
    float drift = sin(uTime * 0.08 + position.z * 0.1) * 0.04;
    pos.x += drift;
    pos.y += drift;

    // Mouse Interaction: Subtle local distortion
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    vec3 mousePos = vec3(uMouse.x * 5.0, uMouse.y * 3.0, 0.0);
    float dist = distance(mvPosition.xyz, mousePos);
    float distortion = smoothstep(1.8, 0.0, dist) * 0.08;
    mvPosition.xyz += normalize(mvPosition.xyz - mousePos + 0.001) * distortion;

    gl_Position = projectionMatrix * mvPosition;
    
    // Tiny measurement nodes
    float size = (vType > 0.5) ? 1.1 : 0.6;
    gl_PointSize = size * uPixelRatio * (400.0 / -mvPosition.z);
    
    vAlpha = smoothstep(-25.0, -1.0, mvPosition.z);
  }
`;

const fragment = `
  precision highp float;
  varying float vType;
  varying float vAlpha;
  
  uniform vec3 uColor;
  uniform float uOpacity;

  void main() {
    float d = distance(gl_PointCoord, vec2(0.5));
    if (d > 0.48) discard;

    float alpha = uOpacity * vAlpha * (vType > 0.5 ? 1.4 : 0.7);
    gl_FragColor = vec4(uColor, alpha);
  }
`;

const lineVertex = `
  attribute vec3 position;
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uObjectScale;

  void main() {
    vec3 pos = position * uObjectScale;
    
    float drift = sin(uTime * 0.08 + position.z * 0.1) * 0.04;
    pos.x += drift;
    pos.y += drift;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    vec3 mousePos = vec3(uMouse.x * 5.0, uMouse.y * 3.0, 0.0);
    float dist = distance(mvPosition.xyz, mousePos);
    float distortion = smoothstep(1.5, 0.0, dist) * 0.06;
    mvPosition.xyz += normalize(mvPosition.xyz - mousePos + 0.001) * distortion;

    gl_Position = projectionMatrix * mvPosition;
  }
`;

const lineFragment = `
  precision highp float;
  uniform vec3 uColor;
  uniform float uOpacity;
  void main() {
    gl_FragColor = vec4(uColor, uOpacity);
  }
`;

export const QuantMorphField: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouse = useRef(new Vec2(0, 0));
  const [lineColor, pointColor] = useToken('colors', ['ui.border', 'gray.100']);

  // Instrument Configuration
  const objectScale = useBreakpointValue({ base: 0.5, md: 0.8, lg: 1.0 }) || 0.5;
  const cameraZ = useBreakpointValue({ base: 18, md: 15, lg: 14 }) || 18;
  const instrumentOpacity = useBreakpointValue({ base: 0.25, md: 0.35, lg: 0.45 }) || 0.35;

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const renderer = new Renderer({ alpha: true, antialias: true, dpr: window.devicePixelRatio });
    const gl = renderer.gl;
    container.appendChild(gl.canvas);

    const camera = new Camera(gl, { fov: 35 });
    camera.position.set(0, 0, cameraZ);
    camera.lookAt([0, 0, 0]);

    const scene = new Transform();

    const hexToVec3 = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;
      return [r, g, b];
    };

    const cL = hexToVec3(lineColor || '#4A5568');
    const cP = hexToVec3(pointColor || '#f7fafc');

    const random = createRandom(9999);

    // --- INSTRUMENT GEOMETRY GENERATORS ---

    // 1. Concentric Calibration Rings (3-5 visible)
    const generateRings = () => {
        const points: number[] = [];
        const numRings = 5;
        for (let r = 0; r < numRings; r++) {
            const radius = 1.5 + r * 1.2;
            const segments = 200;
            for (let i = 0; i < segments; i++) {
                // Stochastic gaps for technical look
                if (random() > 0.45) continue;
                
                const angle = (i / segments) * Math.PI * 2;
                const angleNext = ((i + 1.5) / segments) * Math.PI * 2;
                
                points.push(radius * Math.cos(angle), radius * Math.sin(angle), 0);
                points.push(radius * Math.cos(angleNext), radius * Math.sin(angleNext), 0);
            }
        }
        return new Float32Array(points);
    };

    // 2. Slicing / Measurement Guide Lines
    const generateGuides = () => {
        const points: number[] = [];
        const numGuides = 12;
        for (let i = 0; i < numGuides; i++) {
            const angle = (i / numGuides) * Math.PI;
            const len = 8.0;
            const x = Math.cos(angle) * len;
            const y = Math.sin(angle) * len;
            
            // Draw diagonal slices across the instrument
            points.push(-x, -y, (random()-0.5) * 2.0);
            points.push(x, y, (random()-0.5) * 2.0);
            
            // Optional shorter cross-hairs
            if (random() > 0.5) {
                const offX = (random()-0.5) * 4.0;
                points.push(offX, -2, 0);
                points.push(offX, 2, 0);
            }
        }
        return new Float32Array(points);
    };

    // 3. Fragmented Contour Arcs
    const generateContours = () => {
        const points: number[] = [];
        const numContours = 6;
        for (let c = 0; c < numContours; c++) {
            const z = (c - numContours/2) * 1.5;
            const segments = 60;
            const radius = 4.0;
            for (let i = 0; i < segments; i++) {
                if (random() > 0.3) continue;
                const angle = (i / segments - 0.5) * Math.PI * 0.8;
                const x = radius * Math.sin(angle);
                const y = Math.cos(angle) * 1.5 + Math.sin(x * 0.5) * 0.5;
                
                points.push(x, y, z);
                points.push(x + 0.2, y + 0.1, z);
            }
        }
        return new Float32Array(points);
    };

    // 4. Sparse Measurement Nodes
    const generateNodes = (count: number) => {
        const pos = new Float32Array(count * 3);
        const types = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            // Distribute mainly within the ring field
            const r = random() * 6.0;
            const theta = random() * Math.PI * 2;
            const phi = random() * Math.PI;
            
            pos[i*3] = r * Math.sin(phi) * Math.cos(theta);
            pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta) * 0.7;
            pos[i*3+2] = r * Math.cos(phi) * 0.5;
            
            types[i] = random() > 0.94 ? 1.0 : 0.0;
        }
        return { pos, types };
    };

    // Initialize Meshes
    const nodeData = generateNodes(2500);
    const nodeGeometry = new Geometry(gl, {
        position: { size: 3, data: nodeData.pos },
        pointType: { size: 1, data: nodeData.types }
    });
    const nodeProgram = new Program(gl, {
        vertex, fragment,
        uniforms: {
            uTime: { value: 0 },
            uPixelRatio: { value: renderer.dpr },
            uColor: { value: cP },
            uOpacity: { value: 0.35 },
            uMouse: { value: mouse.current },
            uObjectScale: { value: objectScale },
        },
        transparent: true, depthTest: false
    });
    const nodesMesh = new Mesh(gl, { mode: gl.POINTS, geometry: nodeGeometry, program: nodeProgram });
    nodesMesh.setParent(scene);

    const ringData = generateRings();
    const guideData = generateGuides();
    const contourData = generateContours();
    const allLines = new Float32Array(ringData.length + guideData.length + contourData.length);
    allLines.set(ringData);
    allLines.set(guideData, ringData.length);
    allLines.set(contourData, ringData.length + guideData.length);

    const lineGeometry = new Geometry(gl, { position: { size: 3, data: allLines } });
    const lineProgram = new Program(gl, {
        vertex: lineVertex,
        fragment: lineFragment,
        uniforms: {
            uTime: { value: 0 },
            uColor: { value: cL },
            uOpacity: { value: instrumentOpacity },
            uMouse: { value: mouse.current },
            uObjectScale: { value: objectScale },
        },
        transparent: true
    });
    const linesMesh = new Mesh(gl, { mode: gl.LINES, geometry: lineGeometry, program: lineProgram });
    linesMesh.setParent(scene);

    let requestID: number;
    const update = (t: number) => {
      requestID = requestAnimationFrame(update);
      const time = t * 0.001;
      
      nodeProgram.uniforms.uTime.value = time;
      lineProgram.uniforms.uTime.value = time;

      const rotY = time * 0.012; // Extremely slow recalibration
      const rotX = Math.sin(time * 0.05) * 0.03;
      
      nodesMesh.rotation.y = rotY;
      nodesMesh.rotation.x = rotX;
      linesMesh.rotation.y = rotY;
      linesMesh.rotation.x = rotX;

      renderer.render({ scene, camera });
    };
    requestID = requestAnimationFrame(update);

    const handleResize = () => {
      renderer.setSize(container.clientWidth, container.clientHeight);
      camera.perspective({ aspect: gl.canvas.width / gl.canvas.height });
    };

    const handleMouseMove = (e: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        mouse.current.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(requestID);
      if (container && gl.canvas.parentElement) container.removeChild(gl.canvas);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [lineColor, pointColor, objectScale, cameraZ, instrumentOpacity]);

  return (
    <Box ref={containerRef} position="absolute" top={0} left={0} w="100%" h="100%" zIndex={0} pointerEvents="none" opacity={0.8} />
  );
};
