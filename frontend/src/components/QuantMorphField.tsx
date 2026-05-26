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
  uniform float uInstabilityBlend;

  varying float vType;
  varying float vAlpha;

  void main() {
    vType = pointType;
    
    // Smooth interpolation
    float t = smoothstep(0.0, 1.0, uMix);
    vec3 pos = mix(position, target, t) * uObjectScale;
    
    // Continuous Analytical Instability
    // Baseline is moving-state texture; settled state is only ~10% calmer
    float driftSpeed = 0.18 + (uInstabilityBlend * 0.04);
    float driftAmp = 0.09 + (uInstabilityBlend * 0.03);
    float jitterAmp = 0.012 + (uInstabilityBlend * 0.008);

    float driftX = sin(uTime * driftSpeed + position.z) * driftAmp;
    float driftY = cos(uTime * driftSpeed + position.x) * driftAmp;
    float jitter = sin(uTime * 1.5 + position.y * 10.0) * jitterAmp;
    
    pos.x += (driftX + jitter) * uObjectScale;
    pos.y += (driftY + jitter) * uObjectScale;

    // Mouse Interaction
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    vec4 mouseInSpace = modelViewMatrix * vec4(uMouse.x * 5.0, uMouse.y * 5.0, 0.0, 1.0);
    float dist = distance(mvPosition.xy, mouseInSpace.xy);
    float repulsion = smoothstep(1.2 * uObjectScale, 0.0, dist) * 0.15 * uObjectScale;
    mvPosition.xy += normalize(mvPosition.xy - mouseInSpace.xy + 0.001) * repulsion;

    gl_Position = projectionMatrix * mvPosition;
    
    // Minimal Data Nodes (0.25px - 0.45px) - NO SETTLED GROWTH
    // All oversized circles removed. 
    float size = (vType > 0.5) ? 0.48 : 0.28;
    
    gl_PointSize = size * uPixelRatio * (400.0 / -mvPosition.z);
    
    // Stable depth-based alpha
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

    vec3 color = mix(uColorA, uColorB, vType * 0.4);
    
    // Raw texture baseline - NO ALPHA BOOST
    float alpha = uOpacity * vAlpha;
    if (vType > 0.5) alpha *= 1.1;

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
  uniform float uInstabilityBlend;

  void main() {
    float t = smoothstep(0.0, 1.0, uMix);
    vec3 pos = mix(position, target, t) * uObjectScale;
    
    float driftAmp = 0.09 + (uInstabilityBlend * 0.03);
    pos.x += sin(uTime * 0.18 + position.z) * driftAmp * uObjectScale;
    pos.y += cos(uTime * 0.18 + position.x) * driftAmp * uObjectScale;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    vec4 mouseInSpace = modelViewMatrix * vec4(uMouse.x * 5.0, uMouse.y * 5.0, 0.0, 1.0);
    float dist = distance(mvPosition.xy, mouseInSpace.xy);
    float repulsion = smoothstep(1.0 * uObjectScale, 0.0, dist) * 0.08 * uObjectScale;
    mvPosition.xy += normalize(mvPosition.xy - mouseInSpace.xy + 0.001) * repulsion;

    gl_Position = projectionMatrix * mvPosition;
  }
`;

const lineFragment = `
  precision highp float;
  uniform vec3 uColor;
  uniform float uOpacity;

  void main() {
    // Subtle lattice visibility - NO SETTLED FADE-IN
    gl_FragColor = vec4(uColor, uOpacity * 0.85);
  }
`;

export const QuantMorphField: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouse = useRef(new Vec2(0, 0));
  const targetMouse = useRef(new Vec2(0, 0));
  const [colorA, colorB, borderColor] = useToken('colors', ['gray.50', 'gray.200', 'ui.border']);

  // Responsive Configuration
  const particleCount = useBreakpointValue({ base: 4000, md: 6500, lg: 8500 }) || 4000;
  const lineCount = useBreakpointValue({ base: 500, md: 700, lg: 900 }) || 500;
  const objectScale = useBreakpointValue({ base: 0.55, md: 0.8, lg: 1.0 }) || 0.55;
  const cameraZ = useBreakpointValue({ base: 15, md: 13, lg: 12 }) || 15;
  const baseOpacity = useBreakpointValue({ base: 0.4, md: 0.5, lg: 0.55 }) || 0.4;
  const scaffoldOpacity = useBreakpointValue({ base: 0.06, md: 0.08, lg: 0.1 }) || 0.06;

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const renderer = new Renderer({
      alpha: true,
      antialias: true,
      dpr: window.devicePixelRatio,
    });
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
    const cB = hexToVec3(colorB || '#e2e8f0');
    const cL = hexToVec3(borderColor || '#2d3748');

    const random = createRandom(10101);

    // --- CUBE ---
    const generateCube = (count: number) => {
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const edge = Math.floor(random() * 12);
        const t = random() * 2 - 1;
        const x = 2.2;
        if (edge === 0) { pos[i*3] = x; pos[i*3+1] = t*2.2; pos[i*3+2] = 2.2; }
        else if (edge === 1) { pos[i*3] = x; pos[i*3+1] = t*2.2; pos[i*3+2] = -2.2; }
        else if (edge === 2) { pos[i*3] = -x; pos[i*3+1] = t*2.2; pos[i*3+2] = 2.2; }
        else if (edge === 3) { pos[i*3] = -x; pos[i*3+1] = t*2.2; pos[i*3+2] = -2.2; }
        else if (edge === 4) { pos[i*3] = t*2.2; pos[i*3+1] = x; pos[i*3+2] = 2.2; }
        else if (edge === 5) { pos[i*3] = t*2.2; pos[i*3+1] = x; pos[i*3+2] = -2.2; }
        else if (edge === 6) { pos[i*3] = t*2.2; pos[i*3+1] = -x; pos[i*3+2] = 2.2; }
        else if (edge === 7) { pos[i*3] = t*2.2; pos[i*3+1] = -x; pos[i*3+2] = -2.2; }
        else if (edge === 8) { pos[i*3] = 2.2; pos[i*3+1] = 2.2; pos[i*3+2] = t*2.2; }
        else if (edge === 9) { pos[i*3] = 2.2; pos[i*3+1] = -2.2; pos[i*3+2] = t*2.2; }
        else if (edge === 10) { pos[i*3] = -2.2; pos[i*3+1] = 2.2; pos[i*3+2] = t*2.2; }
        else { pos[i*3] = -2.2; pos[i*3+1] = -2.2; pos[i*3+2] = t*2.2; }
        
        if (random() > 0.4) {
          const u = random() * 2 - 1;
          const v = random() * 2 - 1;
          const w = random() * 2 - 1;
          pos[i*3] = u * 2.2; pos[i*3+1] = v * 2.2; pos[i*3+2] = w * 2.2;
        }
      }
      return pos;
    };

    const generateCubeLines = (count: number) => {
        const pos = new Float32Array(count * 3);
        const s = 2.2;
        const edges = [
            [s,s,s], [s,-s,s], [s,-s,s], [-s,-s,s], [-s,-s,s], [-s,s,s], [-s,s,s], [s,s,s],
            [s,s,-s], [s,-s,-s], [s,-s,-s], [-s,-s,-s], [-s,-s,-s], [-s,s,-s], [-s,s,-s], [s,s,-s],
            [s,s,s], [s,s,-s], [s,-s,s], [s,-s,-s], [-s,-s,s], [-s,-s,-s], [-s,s,s], [-s,s,-s]
        ];
        for (let i = 0; i < count; i++) {
            const v = edges[i % edges.length];
            pos[i*3] = v[0] + (random() > 0.8 ? (random()-0.5) : 0);
            pos[i*3+1] = v[1];
            pos[i*3+2] = v[2];
        }
        return pos;
    };

    // --- SHELL ---
    const generateShell = (count: number) => {
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const phi = Math.acos(-1 + (2 * i) / count);
        const theta = Math.sqrt(count * Math.PI) * phi;
        const r = 3.3;
        pos[i * 3] = r * Math.cos(theta) * Math.sin(phi);
        pos[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi);
        pos[i * 3 + 2] = r * Math.cos(phi);
      }
      return pos;
    };

    const generateShellLines = (count: number) => {
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const ring = Math.floor(i / (count / 6));
            const angle = (i % (count / 6)) / (count / 6) * Math.PI * 2;
            const r = 3.3;
            if (ring === 0) { pos[i*3] = r * Math.cos(angle); pos[i*3+1] = 0; pos[i*3+2] = r * Math.sin(angle); }
            else if (ring === 1) { pos[i*3] = r * Math.cos(angle); pos[i*3+1] = r * Math.sin(angle); pos[i*3+2] = 0; }
            else if (ring === 2) { pos[i*3] = 0; pos[i*3+1] = r * Math.cos(angle); pos[i*3+2] = r * Math.sin(angle); }
            else { 
              pos[i*3] = (random()-0.5)*1; pos[i*3+1] = (random()-0.5)*1; pos[i*3+2] = (random()-0.5)*1; 
            }
        }
        return pos;
    };

    // --- TOPOLOGY ---
    const generateTopology = (count: number) => {
      const pos = new Float32Array(count * 3);
      const size = Math.floor(Math.sqrt(count));
      for (let i = 0; i < count; i++) {
        const x = (i % size) / size * 10 - 5;
        const z = Math.floor(i / size) / size * 8 - 4;
        const y = Math.sin(x * 1.2) * Math.cos(z * 1.2) * 1.5 + Math.sin(x * 3.0) * 0.2;
        pos[i * 3] = x;
        pos[i * 3 + 1] = y;
        pos[i * 3 + 2] = z;
      }
      return pos;
    };

    const generateTopologyLines = (count: number) => {
        const pos = new Float32Array(count * 3);
        const rows = 16;
        const cols = Math.floor(count / 2 / rows);
        for (let i = 0; i < count; i++) {
            const isRow = i < count / 2;
            const idx = isRow ? i : i - count / 2;
            const r = Math.floor(idx / cols);
            const c = idx % cols;
            let x, z;
            if (isRow) { x = (c / cols) * 10 - 5; z = (r / rows) * 8 - 4; }
            else { x = (r / rows) * 10 - 5; z = (c / cols) * 8 - 4; }
            const y = Math.sin(x * 1.2) * Math.cos(z * 1.2) * 1.5 + Math.sin(x * 3.0) * 0.2;
            pos[i*3] = x; pos[i*3+1] = y; pos[i*3+2] = z;
        }
        return pos;
    };

    const pointStates = [
      generateCube(particleCount),
      generateShell(particleCount),
      generateTopology(particleCount),
    ];

    const lineStates = [
      generateCubeLines(lineCount),
      generateShellLines(lineCount),
      generateTopologyLines(lineCount),
    ];

    const pointTypes = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      pointTypes[i] = random() > 0.98 ? 1.0 : 0.0;
    }

    const geometry = new Geometry(gl, {
      position: { size: 3, data: pointStates[0] },
      target: { size: 3, data: pointStates[1] },
      pointType: { size: 1, data: pointTypes },
    });

    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        uMix: { value: 0 },
        uTime: { value: 0 },
        uPixelRatio: { value: renderer.dpr },
        uColorA: { value: cA },
        uColorB: { value: cB },
        uOpacity: { value: baseOpacity },
        uMouse: { value: mouse.current },
        uObjectScale: { value: objectScale },
        uInstabilityBlend: { value: 0.0 },
      },
      transparent: true,
      depthTest: false,
    });

    const particles = new Mesh(gl, { mode: gl.POINTS, geometry, program });
    particles.setParent(scene);

    const lineGeometry = new Geometry(gl, {
        position: { size: 3, data: lineStates[0] },
        target: { size: 3, data: lineStates[1] },
    });

    const lineProgram = new Program(gl, {
        vertex: lineVertex,
        fragment: lineFragment,
        uniforms: {
            uMix: { value: 0 },
            uTime: { value: 0 },
            uColor: { value: cL },
            uOpacity: { value: scaffoldOpacity },
            uMouse: { value: mouse.current },
            uObjectScale: { value: objectScale },
            uInstabilityBlend: { value: 0.0 },
        },
        transparent: true,
    });

    const lines = new Mesh(gl, { mode: gl.LINES, geometry: lineGeometry, program: lineProgram });
    lines.setParent(scene);

    let currentState = 0;
    let nextState = 1;
    let transitionTime = 0;
    const transitionDuration = prefersReducedMotion ? 1000000 : 7.0;
    const waitDuration = 5.0;
    let waitTime = 0;

    // Smoothed Instability Blend
    let instabilityBlend = 0.0;

    let requestID: number;
    const update = (t: number) => {
      requestID = requestAnimationFrame(update);
      const time = t * 0.001;

      mouse.current.lerp(targetMouse.current, 0.08);

      if (!prefersReducedMotion) {
        if (waitTime < waitDuration) {
          waitTime += 0.016;
          
          // Settled state is only ~10% calmer than morphing state
          instabilityBlend = Math.max(instabilityBlend - 0.008, 0.0);
        } else {
          transitionTime += 0.016;
          
          // Morphing state instability
          instabilityBlend = Math.min(instabilityBlend + 0.015, 1.0);

          const mixVal = Math.min(transitionTime / transitionDuration, 1.0);
          program.uniforms.uMix.value = mixVal;
          lineProgram.uniforms.uMix.value = mixVal;

          if (transitionTime >= transitionDuration) {
            currentState = nextState;
            nextState = (nextState + 1) % pointStates.length;
            transitionTime = 0;
            waitTime = 0;
            
            // Seamless Buffer Swap
            geometry.attributes.position.data = pointStates[currentState];
            geometry.attributes.target.data = pointStates[nextState];
            geometry.attributes.position.needsUpdate = true;
            geometry.attributes.target.needsUpdate = true;
            
            lineGeometry.attributes.position.data = lineStates[currentState];
            lineGeometry.attributes.target.data = lineStates[nextState];
            lineGeometry.attributes.position.needsUpdate = true;
            lineGeometry.attributes.target.needsUpdate = true;
            
            program.uniforms.uMix.value = 0;
            lineProgram.uniforms.uMix.value = 0;
          }
        }
      }

      program.uniforms.uInstabilityBlend.value = instabilityBlend;
      lineProgram.uniforms.uInstabilityBlend.value = instabilityBlend;

      program.uniforms.uTime.value = time;
      lineProgram.uniforms.uTime.value = time;
      
      const rotY = time * 0.03;
      const rotX = Math.sin(time * 0.05) * 0.08;
      particles.rotation.y = rotY;
      particles.rotation.x = rotX;
      lines.rotation.y = rotY;
      lines.rotation.x = rotX;

      renderer.render({ scene, camera });
    };

    requestID = requestAnimationFrame(update);

    const handleResize = () => {
      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;
      renderer.setSize(width, height);
      camera.perspective({ aspect: gl.canvas.width / gl.canvas.height });
    };

    const handleMouseMove = (e: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        targetMouse.current.set(
            ((e.clientX - rect.left) / rect.width) * 2 - 1,
            -((e.clientY - rect.top) / rect.height) * 2 + 1
        );
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(requestID);
      if (container && gl.canvas.parentElement) {
        container.removeChild(gl.canvas);
      }
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [colorA, colorB, borderColor, particleCount, lineCount, objectScale, cameraZ, baseOpacity, scaffoldOpacity]);

  return (
    <Box
      ref={containerRef}
      position="absolute"
      top={0}
      left={0}
      w="100%"
      h="100%"
      zIndex={0}
      pointerEvents="none"
      opacity={0.85}
      bg="transparent"
    />
  );
};
