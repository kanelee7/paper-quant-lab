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
  attribute vec3 target;
  attribute float pointType;

  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  uniform float uMix;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform vec2 uMouse;
  uniform float uObjectScale;
  uniform float uDistortion;

  varying float vType;
  varying float vAlpha;

  void main() {
    vType = pointType;
    
    // Smooth transition
    float t = smoothstep(0.0, 1.0, uMix);
    vec3 pos = mix(position, target, t);
    
    // Global analytical drift (Calibration drift)
    float driftX = sin(uTime * 0.06 + pos.z * 0.4) * 0.04;
    float driftY = cos(uTime * 0.06 + pos.x * 0.4) * 0.04;
    pos.x += driftX;
    pos.y += driftY;

    // Phase 3 Distortion modulation
    float wave = sin(uTime * 1.8 + pos.x * 2.5) * cos(uTime * 1.4 + pos.z * 2.5);
    pos.y += wave * uDistortion * 0.6;

    // Mouse Interaction
    vec4 mvPosition = modelViewMatrix * vec4(pos * uObjectScale, 1.0);
    vec3 mousePos = vec3(uMouse.x * 5.5, uMouse.y * 3.5, 0.0);
    float dist = distance(mvPosition.xyz, mousePos);
    float repulsion = smoothstep(1.5, 0.0, dist) * 0.1;
    mvPosition.xyz += normalize(mvPosition.xyz - mousePos + 0.001) * repulsion;

    gl_Position = projectionMatrix * mvPosition;
    
    // Fine Data Nodes
    float size = (vType > 0.5) ? 0.9 : 0.5;
    gl_PointSize = size * uPixelRatio * (400.0 / -mvPosition.z);
    
    vAlpha = smoothstep(-25.0, -1.0, mvPosition.z);
  }
`;

const fragment = `
  precision highp float;
  varying float vType;
  varying float vAlpha;
  
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uOpacity;

  void main() {
    float d = distance(gl_PointCoord, vec2(0.5));
    if (d > 0.48) discard;

    vec3 color = mix(uColorA, uColorB, vType * 0.3);
    float alpha = uOpacity * vAlpha * (vType > 0.5 ? 1.3 : 0.8);
    gl_FragColor = vec4(color, alpha);
  }
`;

const lineVertex = `
  attribute vec3 position;
  attribute vec3 target;

  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  uniform float uMix;
  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uObjectScale;
  uniform float uDistortion;

  void main() {
    float t = smoothstep(0.0, 1.0, uMix);
    vec3 pos = mix(position, target, t);
    
    float driftX = sin(uTime * 0.06 + pos.z * 0.4) * 0.04;
    float driftY = cos(uTime * 0.06 + pos.x * 0.4) * 0.04;
    pos.x += driftX;
    pos.y += driftY;

    float wave = sin(uTime * 1.8 + pos.x * 2.5) * cos(uTime * 1.4 + pos.z * 2.5);
    pos.y += wave * uDistortion * 0.6;

    vec4 mvPosition = modelViewMatrix * vec4(pos * uObjectScale, 1.0);
    vec3 mousePos = vec3(uMouse.x * 5.5, uMouse.y * 3.5, 0.0);
    float dist = distance(mvPosition.xyz, mousePos);
    float repulsion = smoothstep(1.5, 0.0, dist) * 0.06;
    mvPosition.xyz += normalize(mvPosition.xyz - mousePos + 0.001) * repulsion;

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

const NODE_COUNT = 3000;
const LINE_COUNT = 1000;

export const QuantMorphField: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouse = useRef(new Vec2(0, 0));
  const [colorA, colorB, borderColor] = useToken('colors', ['gray.100', 'gray.300', 'ui.border']);

  const objectScale = useBreakpointValue({ base: 0.5, md: 0.8, lg: 1.0 }) || 0.5;
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

    const cA = hexToVec3(colorA || '#f7fafc');
    const cB = hexToVec3(colorB || '#cbd5e0');
    const cL = hexToVec3(borderColor || '#4A5568');

    const random = createRandom(2026);

    // --- PHASE GEOMETRY ISOLATION ---

    const generatePhaseData = (phase: number) => {
        const nodes = new Float32Array(NODE_COUNT * 3);
        const lines = new Float32Array(LINE_COUNT * 3);

        if (phase === 0) { // Constraint Seed: Triangle Core + Rings
            // Triangle Nodes
            const tri = [[0, 1.5, 0], [-1.5, -1, 0], [1.5, -1, 0]];
            for (let i = 0; i < NODE_COUNT; i++) {
                const p = tri[i % 3];
                nodes[i*3] = p[0] + (random()-0.5)*0.05;
                nodes[i*3+1] = p[1] + (random()-0.5)*0.05;
                nodes[i*3+2] = p[2];
            }
            // Calibration Rings Lines
            const numRings = 5;
            const ptsPerRing = Math.floor(LINE_COUNT / numRings);
            for (let r = 0; r < numRings; r++) {
                const radius = 1.8 + r * 1.2;
                for (let i = 0; i < ptsPerRing; i++) {
                    const angle = (i / ptsPerRing) * Math.PI * 2;
                    lines[(r * ptsPerRing + i) * 3] = radius * Math.cos(angle);
                    lines[(r * ptsPerRing + i) * 3 + 1] = radius * Math.sin(angle);
                    lines[(r * ptsPerRing + i) * 3 + 2] = 0;
                }
            }
        } 
        else if (phase === 1) { // Contour Emergence: Contours + Guides
            // Contour Arcs Nodes
            for (let i = 0; i < NODE_COUNT; i++) {
                const ring = Math.floor(i / 100);
                const angle = (i % 100) / 100 * Math.PI * 1.2 - 0.6 * Math.PI;
                const r = 2.0 + ring * 0.4;
                nodes[i*3] = r * Math.sin(angle);
                nodes[i*3+1] = r * Math.cos(angle) * 0.6;
                nodes[i*3+2] = (random()-0.5) * 1.5;
            }
            // Slicing Guides Lines
            for (let i = 0; i < LINE_COUNT; i++) {
                const guide = Math.floor(i / 50);
                const angle = (guide / 20) * Math.PI;
                const len = (i % 50) / 50 * 10 - 5;
                lines[i*3] = Math.cos(angle) * len;
                lines[i*3+1] = Math.sin(angle) * len;
                lines[i*3+2] = (random()-0.5) * 1.0;
            }
        }
        else if (phase === 2 || phase === 3) { // Surface Formation: Surface + Sparse Nodes
            // Sparse Nodes (metadata dots)
            for (let i = 0; i < NODE_COUNT; i++) {
                const r = 1.0 + random() * 6.0;
                const theta = random() * Math.PI * 2;
                nodes[i*3] = r * Math.cos(theta);
                nodes[i*3+1] = Math.sin(r * 0.8) * 1.5;
                nodes[i*3+2] = r * Math.sin(theta) * 0.5;
            }
            // Surface Mesh Lines
            const size = Math.floor(Math.sqrt(LINE_COUNT));
            for (let i = 0; i < LINE_COUNT; i++) {
                const x = (i % size) / size * 12 - 6;
                const z = Math.floor(i / size) / size * 8 - 4;
                lines[i*3] = x;
                lines[i*3+1] = Math.sin(x * 1.0) * Math.cos(z * 1.0) * 2.0;
                lines[i*3+2] = z;
            }
        }
        else { // Reasoning Topology: Lattice Nodes + Structural Edges
            // Lattice Nodes
            const g = 8;
            for (let i = 0; i < NODE_COUNT; i++) {
                const x = (Math.floor(random()*g) - g/2) * 1.2;
                const y = (Math.floor(random()*g) - g/2) * 0.8;
                const z = (Math.floor(random()*g) - g/2) * 1.0;
                nodes[i*3] = x + (random()-0.5)*0.2;
                nodes[i*3+1] = y + (random()-0.5)*0.2;
                nodes[i*3+2] = z + (random()-0.5)*0.2;
            }
            // Structural Edges Lines
            for (let i = 0; i < LINE_COUNT; i++) {
                const idx = Math.floor(random() * (NODE_COUNT-1));
                lines[i*3] = nodes[idx*3];
                lines[i*3+1] = nodes[idx*3+1];
                lines[i*3+2] = nodes[idx*3+2];
            }
        }

        return { nodes, lines };
    };

    const phases = [0, 1, 2, 3, 4, 5].map(p => generatePhaseData(p));
    
    const nodeTypes = new Float32Array(NODE_COUNT);
    for (let i = 0; i < NODE_COUNT; i++) nodeTypes[i] = random() > 0.98 ? 1.0 : 0.0;

    const nodeGeometry = new Geometry(gl, {
        position: { size: 3, data: phases[0].nodes },
        target: { size: 3, data: phases[1].nodes },
        pointType: { size: 1, data: nodeTypes }
    });

    const nodeProgram = new Program(gl, {
        vertex, fragment,
        uniforms: {
            uMix: { value: 0 }, uTime: { value: 0 },
            uPixelRatio: { value: renderer.dpr },
            uColorA: { value: cA }, uColorB: { value: cB },
            uOpacity: { value: 0.45 }, uMouse: { value: mouse.current },
            uObjectScale: { value: objectScale }, uDistortion: { value: 0 },
        },
        transparent: true, depthTest: false
    });
    const nodesMesh = new Mesh(gl, { mode: gl.POINTS, geometry: nodeGeometry, program: nodeProgram });
    nodesMesh.setParent(scene);

    const lineGeometry = new Geometry(gl, {
        position: { size: 3, data: phases[0].lines },
        target: { size: 3, data: phases[1].lines }
    });

    const lineProgram = new Program(gl, {
        vertex: lineVertex, fragment: lineFragment,
        uniforms: {
            uMix: { value: 0 }, uTime: { value: 0 },
            uColor: { value: cL }, uOpacity: { value: 0.12 },
            uMouse: { value: mouse.current },
            uObjectScale: { value: objectScale }, uDistortion: { value: 0 },
        },
        transparent: true
    });
    const linesMesh = new Mesh(gl, { mode: gl.LINES, geometry: lineGeometry, program: lineProgram });
    linesMesh.setParent(scene);

    let currentPhase = 0;
    let nextPhase = 1;
    let transitionTime = 0;
    const transitionDuration = 7.5;
    const waitDuration = 4.5;
    let waitTime = 0;

    let requestID: number;
    const update = (t: number) => {
      requestID = requestAnimationFrame(update);
      const time = t * 0.001;
      
      if (waitTime < waitDuration) {
        waitTime += 0.016;
      } else {
        transitionTime += 0.016;
        const m = Math.min(transitionTime / transitionDuration, 1.0);
        nodeProgram.uniforms.uMix.value = m;
        lineProgram.uniforms.uMix.value = m;

        if (transitionTime >= transitionDuration) {
          currentPhase = nextPhase;
          nextPhase = (nextPhase + 1) % phases.length;
          transitionTime = 0; waitTime = 0;

          nodeGeometry.attributes.position.data = phases[currentPhase].nodes;
          nodeGeometry.attributes.target.data = phases[nextPhase].nodes;
          nodeGeometry.attributes.position.needsUpdate = true;
          nodeGeometry.attributes.target.needsUpdate = true;

          lineGeometry.attributes.position.data = phases[currentPhase].lines;
          lineGeometry.attributes.target.data = phases[nextPhase].lines;
          lineGeometry.attributes.position.needsUpdate = true;
          lineGeometry.attributes.target.needsUpdate = true;
          
          nodeProgram.uniforms.uMix.value = 0;
          lineProgram.uniforms.uMix.value = 0;
        }
      }

      const distortionVal = currentPhase === 3 ? Math.sin(time * 1.5) * 0.5 + 0.5 : 0;
      nodeProgram.uniforms.uDistortion.value = distortionVal;
      lineProgram.uniforms.uDistortion.value = distortionVal;

      nodeProgram.uniforms.uTime.value = time;
      lineProgram.uniforms.uTime.value = time;

      const rotY = time * 0.01;
      nodesMesh.rotation.y = rotY;
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
  }, [colorA, colorB, borderColor, objectScale, cameraZ]);

  return (
    <Box ref={containerRef} position="absolute" top={0} left={0} w="100%" h="100%" zIndex={0} pointerEvents="none" opacity={0.9} />
  );
};
