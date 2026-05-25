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
    
    // Global analytical drift
    float driftX = sin(uTime * 0.08 + pos.z * 0.5) * 0.05;
    float driftY = cos(uTime * 0.08 + pos.x * 0.5) * 0.05;
    pos.x += driftX;
    pos.y += driftY;

    // Field Distortion phase modulation
    float wave = sin(uTime * 1.5 + pos.x * 2.0) * cos(uTime * 1.2 + pos.z * 2.0);
    pos.y += wave * uDistortion * 0.5;

    // Mouse Interaction
    vec4 mvPosition = modelViewMatrix * vec4(pos * uObjectScale, 1.0);
    vec3 mousePos = vec3(uMouse.x * 6.0, uMouse.y * 4.0, 0.0);
    float dist = distance(mvPosition.xyz, mousePos);
    float repulsion = smoothstep(1.5, 0.0, dist) * 0.12;
    mvPosition.xyz += normalize(mvPosition.xyz - mousePos + 0.001) * repulsion;

    gl_Position = projectionMatrix * mvPosition;
    
    // Tiny data nodes
    float size = (vType > 0.5) ? 0.8 : 0.45;
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

    vec3 color = mix(uColorA, uColorB, vType);
    float alpha = uOpacity * vAlpha * (vType > 0.5 ? 1.2 : 0.8);
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
    
    float driftX = sin(uTime * 0.08 + pos.z * 0.5) * 0.05;
    float driftY = cos(uTime * 0.08 + pos.x * 0.5) * 0.05;
    pos.x += driftX;
    pos.y += driftY;

    float wave = sin(uTime * 1.5 + pos.x * 2.0) * cos(uTime * 1.2 + pos.z * 2.0);
    pos.y += wave * uDistortion * 0.5;

    vec4 mvPosition = modelViewMatrix * vec4(pos * uObjectScale, 1.0);
    vec3 mousePos = vec3(uMouse.x * 6.0, uMouse.y * 4.0, 0.0);
    float dist = distance(mvPosition.xyz, mousePos);
    float repulsion = smoothstep(1.5, 0.0, dist) * 0.08;
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

const NODE_COUNT = 4000;
const LINE_COUNT = 1200;

export const QuantMorphField: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouse = useRef(new Vec2(0, 0));
  const [colorA, colorB, borderColor] = useToken('colors', ['gray.50', 'gray.300', 'ui.border']);

  const objectScale = useBreakpointValue({ base: 0.55, md: 0.85, lg: 1.05 }) || 0.55;
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

    const cA = hexToVec3(colorA || '#ffffff');
    const cB = hexToVec3(colorB || '#cbd5e0');
    const cL = hexToVec3(borderColor || '#2d3748');

    const random = createRandom(1337);

    // --- PHASE GENERATORS ---

    const generatePhaseData = (phase: number) => {
        const nodes = new Float32Array(NODE_COUNT * 3);
        const lines = new Float32Array(LINE_COUNT * 3);

        const fillRandom = (arr: Float32Array, start: number, count: number, r: number) => {
            for (let i = 0; i < count; i++) {
                const u = random() * Math.PI * 2;
                const v = Math.acos(2 * random() - 1);
                const dist = r * Math.pow(random(), 1/3);
                arr[(start + i) * 3] = dist * Math.sin(v) * Math.cos(u);
                arr[(start + i) * 3 + 1] = dist * Math.sin(v) * Math.sin(u);
                arr[(start + i) * 3 + 2] = dist * Math.cos(v);
            }
        };

        if (phase === 0) { // Constraint Seed
            // Triangular core
            const triPoints = [[0,1.2,0], [-1,-0.6,0], [1,-0.6,0]];
            for (let i = 0; i < NODE_COUNT; i++) {
                const p = triPoints[i % 3];
                nodes[i*3] = p[0] + (random()-0.5)*0.1;
                nodes[i*3+1] = p[1] + (random()-0.5)*0.1;
                nodes[i*3+2] = p[2] + (random()-0.5)*0.1;
            }
            // Rings and Guides
            for (let i = 0; i < LINE_COUNT / 2; i++) {
                const r = 1.5 + Math.floor(i / 100) * 1.0;
                const angle = (i % 100) / 100 * Math.PI * 2;
                lines[i*3] = r * Math.cos(angle);
                lines[i*3+1] = r * Math.sin(angle);
                lines[i*3+2] = 0;
            }
            for (let i = Math.floor(LINE_COUNT/2); i < LINE_COUNT; i++) {
                const side = i % 2 === 0 ? 1 : -1;
                lines[i*3] = side * 8;
                lines[i*3+1] = (random()-0.5) * 10;
                lines[i*3+2] = (random()-0.5) * 5;
            }
        } 
        else if (phase === 1) { // Contour Emergence
            for (let i = 0; i < NODE_COUNT; i++) {
                const r = 2.5 + random() * 2.0;
                const theta = random() * Math.PI * 2;
                nodes[i*3] = r * Math.cos(theta);
                nodes[i*3+1] = r * Math.sin(theta) * 0.5 + Math.sin(r * 2.0) * 0.5;
                nodes[i*3+2] = (random()-0.5) * 2.0;
            }
            for (let i = 0; i < LINE_COUNT; i++) {
                const r = 1.5 + random() * 4.0;
                const theta = random() * Math.PI * 2;
                lines[i*3] = r * Math.cos(theta);
                lines[i*3+1] = r * Math.sin(theta) * 0.6;
                lines[i*3+2] = (random()-0.5) * 1.5;
            }
        }
        else if (phase === 2 || phase === 3) { // Surface Formation / Field Distortion
            const size = Math.floor(Math.sqrt(NODE_COUNT));
            for (let i = 0; i < NODE_COUNT; i++) {
                const x = (i % size) / size * 10 - 5;
                const z = Math.floor(i / size) / size * 8 - 4;
                nodes[i*3] = x;
                nodes[i*3+1] = Math.sin(x * 1.2) * Math.cos(z * 1.2) * 1.5;
                nodes[i*3+2] = z;
            }
            const lSize = Math.floor(Math.sqrt(LINE_COUNT));
            for (let i = 0; i < LINE_COUNT; i++) {
                const x = (i % lSize) / lSize * 10 - 5;
                const z = Math.floor(i / lSize) / lSize * 8 - 4;
                lines[i*3] = x;
                lines[i*3+1] = Math.sin(x * 1.2) * Math.cos(z * 1.2) * 1.5;
                lines[i*3+2] = z;
            }
        }
        else if (phase === 4) { // Lattice Reorganization
            for (let i = 0; i < NODE_COUNT; i++) {
                const gx = Math.floor(random() * 10) - 5;
                const gy = Math.floor(random() * 6) - 3;
                const gz = Math.floor(random() * 8) - 4;
                nodes[i*3] = gx * 0.8;
                nodes[i*3+1] = gy * 0.8;
                nodes[i*3+2] = gz * 0.8;
            }
            fillRandom(lines, 0, LINE_COUNT, 5);
        }
        else { // Reasoning Topology
            for (let i = 0; i < NODE_COUNT; i++) {
                const r = 4.0;
                const u = random() * Math.PI * 2;
                const v = Math.acos(2 * random() - 1);
                nodes[i*3] = r * Math.sin(v) * Math.cos(u) * 1.5;
                nodes[i*3+1] = r * Math.sin(v) * Math.sin(u) * 0.4;
                nodes[i*3+2] = r * Math.cos(v) * 0.8;
            }
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
            uColor: { value: cL }, uOpacity: { value: 0.15 },
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
    const transitionDuration = 7.0;
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

      // Modulate uDistortion during Phase 3 (Field Distortion)
      const distortionVal = currentPhase === 3 ? Math.sin(time * 2.0) * 0.5 + 0.5 : 0;
      nodeProgram.uniforms.uDistortion.value = distortionVal;
      lineProgram.uniforms.uDistortion.value = distortionVal;

      nodeProgram.uniforms.uTime.value = time;
      lineProgram.uniforms.uTime.value = time;

      const rotY = time * 0.012;
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
    <Box ref={containerRef} position="absolute" top={0} left={0} w="100%" h="100%" zIndex={0} pointerEvents="none" opacity={0.85} />
  );
};
