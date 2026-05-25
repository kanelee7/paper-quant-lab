import React, { useEffect, useRef, useMemo } from 'react';
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
    
    // Constraint-field drift (Instrument-grade motion)
    float drift = sin(uTime * 0.1 + position.z * 0.2) * 0.05;
    pos.x += drift;
    pos.y += drift;

    // Mouse Interaction: Local distortion (Calibration feel)
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    vec3 mousePos = vec3(uMouse.x * 5.0, uMouse.y * 3.0, 0.0);
    float dist = distance(mvPosition.xyz, mousePos);
    float distortion = smoothstep(2.0, 0.0, dist) * 0.1;
    mvPosition.xyz += normalize(mvPosition.xyz - mousePos + 0.001) * distortion;

    gl_Position = projectionMatrix * mvPosition;
    
    // Measurement points (tiny dots)
    float size = (vType > 0.5) ? 0.7 : 0.4;
    gl_PointSize = size * uPixelRatio * (400.0 / -mvPosition.z);
    
    vAlpha = smoothstep(-20.0, -1.0, mvPosition.z);
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

    float alpha = uOpacity * vAlpha * (vType > 0.5 ? 1.4 : 0.6);
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
    float drift = sin(uTime * 0.1 + position.z * 0.2) * 0.05;
    pos.x += drift;
    pos.y += drift;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    vec3 mousePos = vec3(uMouse.x * 5.0, uMouse.y * 3.0, 0.0);
    float dist = distance(mvPosition.xyz, mousePos);
    float distortion = smoothstep(1.5, 0.0, dist) * 0.08;
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
  const objectScale = useBreakpointValue({ base: 0.6, md: 0.8, lg: 1.0 }) || 0.6;
  const cameraZ = useBreakpointValue({ base: 18, md: 15, lg: 13 }) || 18;

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

    const cL = hexToVec3(lineColor || '#2d3748');
    const cP = hexToVec3(pointColor || '#f7fafc');

    const random = createRandom(888);

    // --- INSTRUMENT GEOMETRY GENERATION ---

    // 1. Calibration Rings (Sparse concentric arcs)
    const generateRings = () => {
        const points: number[] = [];
        const numRings = 5;
        for (let r = 0; r < numRings; r++) {
            const radius = (r + 1) * 1.5;
            const segments = 120;
            for (let i = 0; i < segments; i++) {
                // Fragmented arcs
                if (random() > 0.4) continue;
                const angle = (i / segments) * Math.PI * 2;
                points.push(radius * Math.cos(angle), radius * Math.sin(angle), (random()-0.5)*0.5);
                points.push(radius * Math.cos(angle + 0.05), radius * Math.sin(angle + 0.05), (random()-0.5)*0.5);
            }
        }
        return new Float32Array(points);
    };

    // 2. Topology Arcs (Fragmented contour guiding)
    const generateContours = () => {
        const points: number[] = [];
        const numContours = 8;
        for (let c = 0; c < numContours; c++) {
            const z = (c - numContours/2) * 1.2;
            const segments = 100;
            for (let i = 0; i < segments; i++) {
                if (random() > 0.3) continue;
                const x = (i / segments - 0.5) * 15;
                const y = Math.sin(x * 0.5 + z * 0.2) * 1.5;
                points.push(x, y, z);
                points.push(x + 0.1, y + Math.cos(x * 0.5)*0.05, z);
            }
        }
        return new Float32Array(points);
    };

    // 3. Lattice Anchors (Measurement Points)
    const generateAnchors = (count: number) => {
        const pos = new Float32Array(count * 3);
        const types = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            const r = 2.0 + random() * 4.0;
            const theta = random() * Math.PI * 2;
            const phi = random() * Math.PI;
            
            pos[i*3] = r * Math.sin(phi) * Math.cos(theta);
            pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta) * 0.6;
            pos[i*3+2] = r * Math.cos(phi) * 0.8;
            
            types[i] = random() > 0.95 ? 1.0 : 0.0;
        }
        return { pos, types };
    };

    // Points
    const anchors = generateAnchors(3500);
    const pointGeometry = new Geometry(gl, {
        position: { size: 3, data: anchors.pos },
        pointType: { size: 1, data: anchors.types }
    });
    const pointProgram = new Program(gl, {
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
    const pointsMesh = new Mesh(gl, { mode: gl.POINTS, geometry: pointGeometry, program: pointProgram });
    pointsMesh.setParent(scene);

    // Lines (Instrument Scaffolding)
    const ringData = generateRings();
    const contourData = generateContours();
    const combinedLines = new Float32Array(ringData.length + contourData.length);
    combinedLines.set(ringData);
    combinedLines.set(contourData, ringData.length);

    const lineGeometry = new Geometry(gl, { position: { size: 3, data: combinedLines } });
    const lineProgram = new Program(gl, {
        vertex: lineVertex,
        fragment: lineFragment,
        uniforms: {
            uTime: { value: 0 },
            uColor: { value: cL },
            uOpacity: { value: 0.15 },
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
      
      pointProgram.uniforms.uTime.value = time;
      lineProgram.uniforms.uTime.value = time;

      const rotY = time * 0.015;
      pointsMesh.rotation.y = rotY;
      linesMesh.rotation.y = rotY;

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
  }, [lineColor, pointColor, objectScale, cameraZ]);

  return (
    <Box ref={containerRef} position="absolute" top={0} left={0} w="100%" h="100%" zIndex={0} pointerEvents="none" opacity={0.8} />
  );
};
