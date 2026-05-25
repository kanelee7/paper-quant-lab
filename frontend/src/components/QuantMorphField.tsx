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

  varying float vType;
  varying float vAlpha;

  void main() {
    vType = pointType;
    
    float t = smoothstep(0.0, 1.0, uMix);
    vec3 pos = mix(position, target, t);
    
    // Slow instrument drift
    float driftX = sin(uTime * 0.05 + pos.z * 0.2) * 0.03;
    float driftY = cos(uTime * 0.05 + pos.x * 0.2) * 0.03;
    pos.x += driftX;
    pos.y += driftY;

    // Mouse Interaction
    vec4 mvPosition = modelViewMatrix * vec4(pos * uObjectScale, 1.0);
    vec3 mousePos = vec3(uMouse.x * 6.0, uMouse.y * 4.0, 0.0);
    float dist = distance(mvPosition.xyz, mousePos);
    float repulsion = smoothstep(1.5, 0.0, dist) * 0.1;
    mvPosition.xyz += normalize(mvPosition.xyz - mousePos + 0.001) * repulsion;

    gl_Position = projectionMatrix * mvPosition;
    
    // Ultrafine metadata points (Tiny dots only)
    float size = (vType > 0.5) ? 0.7 : 0.4;
    gl_PointSize = size * uPixelRatio * (400.0 / -mvPosition.z);
    
    vAlpha = smoothstep(-30.0, -1.0, mvPosition.z);
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

    float alpha = uOpacity * vAlpha * (vType > 0.5 ? 1.0 : 0.6);
    gl_FragColor = vec4(uColor, alpha);
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

  void main() {
    float t = smoothstep(0.0, 1.0, uMix);
    vec3 pos = mix(position, target, t);
    
    float driftX = sin(uTime * 0.05 + pos.z * 0.2) * 0.03;
    float driftY = cos(uTime * 0.05 + pos.x * 0.2) * 0.03;
    pos.x += driftX;
    pos.y += driftY;

    vec4 mvPosition = modelViewMatrix * vec4(pos * uObjectScale, 1.0);
    vec3 mousePos = vec3(uMouse.x * 6.0, uMouse.y * 4.0, 0.0);
    float dist = distance(mvPosition.xyz, mousePos);
    float repulsion = smoothstep(1.2, 0.0, dist) * 0.06;
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

// Fundamentally Inverted Hierarchy Constants
const NODE_COUNT = 500; // Drastically reduced (Secondary metadata only)
const LINE_COUNT = 1500; // Increased (Primary structural burden)

export const QuantMorphField: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouse = useRef(new Vec2(0, 0));
  const [lineColor, pointColor] = useToken('colors', ['ui.border', 'gray.50']);

  const objectScale = useBreakpointValue({ base: 0.5, md: 0.8, lg: 1.0 }) || 0.5;
  const cameraZ = useBreakpointValue({ base: 18, md: 15, lg: 14 }) || 18;

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

    const random = createRandom(1994);

    // --- INSTRUMENT-FIRST PHASE GENERATORS ---

    const generatePhaseData = (phase: number) => {
        const nodes = new Float32Array(NODE_COUNT * 3);
        const lines = new Float32Array(LINE_COUNT * 3);

        if (phase === 0) { // Phase 0: Constraint Seed (Strong Triangle + Rings)
            // Triangle Core (Nodes at vertices only)
            const tri = [[0, 2, 0], [-2, -1.2, 0], [2, -1.2, 0]];
            for (let i = 0; i < NODE_COUNT; i++) {
                const p = tri[i % 3];
                nodes[i*3] = p[0] + (random()-0.5)*0.05;
                nodes[i*3+1] = p[1] + (random()-0.5)*0.05;
                nodes[i*3+2] = p[2];
            }
            // Calibration Rings (Primary Silhouette)
            const numRings = 5;
            const ptsPerRing = Math.floor(LINE_COUNT / numRings);
            for (let r = 0; r < numRings; r++) {
                const radius = 1.5 + r * 1.5;
                for (let i = 0; i < ptsPerRing; i++) {
                    const angle = (i / ptsPerRing) * Math.PI * 2;
                    lines[(r * ptsPerRing + i) * 3] = radius * Math.cos(angle);
                    lines[(r * ptsPerRing + i) * 3 + 1] = radius * Math.sin(angle);
                    lines[(r * ptsPerRing + i) * 3 + 2] = 0;
                }
            }
        } 
        else if (phase === 1) { // Phase 1: Contour Emergence (Technical Guides)
            // Sparse Metadata nodes
            for (let i = 0; i < NODE_COUNT; i++) {
                nodes[i*3] = (random()-0.5)*15;
                nodes[i*3+1] = (random()-0.5)*10;
                nodes[i*3+2] = (random()-0.5)*5;
            }
            // Slicing Guides & Contours
            for (let i = 0; i < LINE_COUNT; i++) {
                if (i < LINE_COUNT * 0.6) { // Guides
                    const angle = (Math.floor(i/40) / 10) * Math.PI;
                    const len = (i % 40) / 40 * 12 - 6;
                    lines[i*3] = Math.cos(angle) * len;
                    lines[i*3+1] = Math.sin(angle) * len;
                    lines[i*3+2] = 0;
                } else { // Fragmented Contours
                    const r = 2.0 + random() * 4.0;
                    const theta = random() * Math.PI * 2;
                    lines[i*3] = r * Math.cos(theta);
                    lines[i*3+1] = r * Math.sin(theta) * 0.4;
                    lines[i*3+2] = (random()-0.5)*2.0;
                }
            }
        }
        else if (phase === 2) { // Phase 2: Surface Inference (Line Mesh)
            for (let i = 0; i < NODE_COUNT; i++) {
                const r = random() * 6.0;
                const a = random() * Math.PI * 2;
                nodes[i*3] = r * Math.cos(a);
                nodes[i*3+1] = Math.sin(r * 0.6) * 2.0;
                nodes[i*3+2] = r * Math.sin(a) * 0.5;
            }
            // Primary Surface defined by lines
            const rows = 12;
            const cols = Math.floor(LINE_COUNT / rows);
            for (let i = 0; i < LINE_COUNT; i++) {
                const r = Math.floor(i / cols);
                const c = i % cols;
                const x = (c / cols) * 12 - 6;
                const z = (r / rows) * 10 - 5;
                lines[i*3] = x;
                lines[i*3+1] = Math.sin(x * 0.8) * Math.cos(z * 0.8) * 2.5;
                lines[i*3+2] = z;
            }
        }
        else { // Phase 3: Reasoning Lattice (Nodes + Structural Edges)
            // Nodes (Metadata anchors at grid points)
            const g = 6;
            for (let i = 0; i < NODE_COUNT; i++) {
                nodes[i*3] = (Math.floor(random()*g) - g/2) * 1.5;
                nodes[i*3+1] = (Math.floor(random()*g) - g/2) * 1.2;
                nodes[i*3+2] = (Math.floor(random()*g) - g/2) * 1.0;
            }
            // Primary structural edges
            for (let i = 0; i < LINE_COUNT; i++) {
                const idx = Math.floor(random() * (NODE_COUNT-1));
                lines[i*3] = nodes[idx*3];
                lines[i*3+1] = nodes[idx*3+1];
                lines[i*3+2] = nodes[idx*3+2];
            }
        }

        return { nodes, lines };
    };

    const phases = [0, 1, 2, 3].map(p => generatePhaseData(p));
    
    const nodeTypes = new Float32Array(NODE_COUNT);
    for (let i = 0; i < NODE_COUNT; i++) nodeTypes[i] = random() > 0.9 ? 1.0 : 0.0;

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
            uColor: { value: cP }, uOpacity: { value: 0.3 },
            uMouse: { value: mouse.current }, uObjectScale: { value: objectScale },
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
            uColor: { value: cL }, uOpacity: { value: 0.25 },
            uMouse: { value: mouse.current }, uObjectScale: { value: objectScale },
        },
        transparent: true
    });
    const linesMesh = new Mesh(gl, { mode: gl.LINES, geometry: lineGeometry, program: lineProgram });
    linesMesh.setParent(scene);

    let currentPhase = 0;
    let nextPhase = 1;
    let transitionTime = 0;
    const transitionDuration = 8.0;
    const waitDuration = 5.0;
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
  }, [lineColor, pointColor, objectScale, cameraZ]);

  return (
    <Box ref={containerRef} position="absolute" top={0} left={0} w="100%" h="100%" zIndex={0} pointerEvents="none" opacity={0.85} />
  );
};
