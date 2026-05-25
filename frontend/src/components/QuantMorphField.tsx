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
  uniform float uPointSize;

  varying float vType;
  varying float vAlpha;

  void main() {
    vType = pointType;
    
    // Smooth interpolation
    float t = smoothstep(0.0, 1.0, uMix);
    vec3 pos = mix(position, target, t) * uObjectScale;
    
    // Constant analytical micro-drift (Geological)
    float driftX = sin(uTime * 0.1 + position.z * 0.5) * 0.04;
    float driftY = cos(uTime * 0.1 + position.x * 0.5) * 0.04;
    pos.x += driftX;
    pos.y += driftY;

    // Mouse Interaction: High-responsiveness repulsion
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    
    // Raw mouse tracking in view space
    vec3 mousePos = vec3(uMouse.x * 6.0, uMouse.y * 4.0, 0.0); 
    float dist = distance(mvPosition.xyz, mousePos);
    float repulsion = smoothstep(1.5, 0.0, dist) * 0.25;
    mvPosition.xyz += normalize(mvPosition.xyz - mousePos + 0.001) * repulsion;

    gl_Position = projectionMatrix * mvPosition;
    
    // High-uniformity computational nodes
    float size = (vType > 0.5) ? uPointSize * 1.3 : uPointSize;
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
    // Sharp square nodes (computationally honest)
    // No soft disc falloff
    
    vec3 color = mix(uColorA, uColorB, vType * 0.3);
    float alpha = uOpacity * vAlpha;
    if (vType > 0.5) alpha *= 1.2;

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

  void main() {
    float t = smoothstep(0.0, 1.0, uMix);
    vec3 pos = mix(position, target, t) * uObjectScale;
    
    pos.x += sin(uTime * 0.1 + position.z * 0.5) * 0.04;
    pos.y += cos(uTime * 0.1 + position.x * 0.5) * 0.04;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    vec3 mousePos = vec3(uMouse.x * 6.0, uMouse.y * 4.0, 0.0);
    float dist = distance(mvPosition.xyz, mousePos);
    float repulsion = smoothstep(1.5, 0.0, dist) * 0.2;
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

export const QuantMorphField: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouse = useRef(new Vec2(0, 0));
  const [colorA, colorB, borderColor] = useToken('colors', ['gray.100', 'gray.400', 'ui.border']);

  // Responsive Configuration
  const particleCount = useBreakpointValue({ base: 4500, md: 7000, lg: 9500 }) || 4500;
  const lineCount = useBreakpointValue({ base: 400, md: 600, lg: 800 }) || 400;
  const pointSize = useBreakpointValue({ base: 0.32, md: 0.35, lg: 0.38 }) || 0.35;
  const objectScale = useBreakpointValue({ base: 0.6, md: 0.85, lg: 1.1 }) || 0.6;
  const cameraZ = useBreakpointValue({ base: 16, md: 14, lg: 13 }) || 16;
  const baseOpacity = 0.55;

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

    const cA = hexToVec3(colorA || '#f7fafc');
    const cB = hexToVec3(colorB || '#a0aec0');
    const cL = hexToVec3(borderColor || '#2d3748');

    const random = createRandom(2026);

    // --- REFINED GEOMETRIES (IMPLIED, NOT EXPLICIT) ---

    // 1. Manifold surface (fragmented contour)
    const generateManifold = (count: number) => {
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const u = random() * Math.PI * 2;
        const v = random() * Math.PI * 2;
        // Torus-like but fragmented
        const r = 3.0 + Math.sin(v * 2.0) * 0.5;
        pos[i*3] = r * Math.cos(u) * 1.5;
        pos[i*3+1] = r * Math.sin(u) * 0.8;
        pos[i*3+2] = Math.sin(v) * 2.0;

        if (random() > 0.6) { // Fragmentation
           pos[i*3] *= (0.8 + random() * 0.4);
           pos[i*3+1] *= (0.8 + random() * 0.4);
        }
      }
      return pos;
    };

    // 2. Fragmented Topology (reorganizing)
    const generateTopology = (count: number) => {
        const pos = new Float32Array(count * 3);
        const size = Math.floor(Math.sqrt(count));
        for (let i = 0; i < count; i++) {
            const x = ((i % size) / size - 0.5) * 12;
            const z = (Math.floor(i / size) / size - 0.5) * 8;
            const y = Math.sin(x * 0.8) * Math.cos(z * 1.2) * 2.0 + Math.sin(x * 4.0) * 0.3;
            
            pos[i*3] = x;
            pos[i*3+1] = y;
            pos[i*3+2] = z;

            if (random() > 0.85) { // Scatter for continuity mass
                pos[i*3] += (random()-0.5)*2.0;
                pos[i*3+2] += (random()-0.5)*2.0;
            }
        }
        return pos;
    };

    // 3. Implied Latticed Cloud
    const generateLatticeMass = (count: number) => {
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const gridX = Math.floor(random() * 8) - 4;
            const gridY = Math.floor(random() * 6) - 3;
            const gridZ = Math.floor(random() * 8) - 4;
            
            // Nodes with volumetric noise
            pos[i*3] = gridX * 1.2 + (random() - 0.5) * 0.8;
            pos[i*3+1] = gridY * 1.2 + (random() - 0.5) * 0.8;
            pos[i*3+2] = gridZ * 1.2 + (random() - 0.5) * 0.8;
        }
        return pos;
    };

    const pointStates = [
      generateManifold(particleCount),
      generateTopology(particleCount),
      generateLatticeMass(particleCount),
    ];

    // Scaffold Lines (Fragmented Arcs)
    const generateScaffold = (count: number, state: number) => {
        const pos = new Float32Array(count * 3);
        const source = pointStates[state];
        for (let i = 0; i < count; i++) {
            const idx = Math.floor(random() * (particleCount - 1));
            pos[i*3] = source[idx*3];
            pos[i*3+1] = source[idx*3+1];
            pos[i*3+2] = source[idx*3+2];
        }
        return pos;
    };

    const lineStates = [
        generateScaffold(lineCount, 0),
        generateScaffold(lineCount, 1),
        generateScaffold(lineCount, 2),
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
        uPointSize: { value: pointSize },
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
            uOpacity: { value: 0.08 },
            uMouse: { value: mouse.current },
            uObjectScale: { value: objectScale },
        },
        transparent: true,
    });

    const lines = new Mesh(gl, { mode: gl.LINES, geometry: lineGeometry, program: lineProgram });
    lines.setParent(scene);

    let currentState = 0;
    let nextState = 1;
    let transitionTime = 0;
    const transitionDuration = prefersReducedMotion ? 1000000 : 8.0;
    const waitDuration = 5.0;
    let waitTime = 0;

    let requestID: number;
    const update = (t: number) => {
      requestID = requestAnimationFrame(update);
      const time = t * 0.001;

      if (!prefersReducedMotion) {
        if (waitTime < waitDuration) {
          waitTime += 0.016;
        } else {
          transitionTime += 0.016;
          const mixVal = Math.min(transitionTime / transitionDuration, 1.0);
          program.uniforms.uMix.value = mixVal;
          lineProgram.uniforms.uMix.value = mixVal;

          if (transitionTime >= transitionDuration) {
            currentState = nextState;
            nextState = (nextState + 1) % pointStates.length;
            transitionTime = 0;
            waitTime = 0;
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

      program.uniforms.uTime.value = time;
      lineProgram.uniforms.uTime.value = time;
      
      const rotY = time * 0.02;
      const rotX = Math.sin(time * 0.04) * 0.05;
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
        // Raw mouse tracking for interaction
        mouse.current.set(
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
  }, [colorA, colorB, borderColor, particleCount, lineCount, pointSize, objectScale, cameraZ]);

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
      opacity={0.9}
      bg="transparent"
    />
  );
};
