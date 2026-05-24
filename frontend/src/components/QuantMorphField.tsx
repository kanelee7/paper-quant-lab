import React, { useEffect, useRef } from 'react';
import { Renderer, Camera, Transform, Geometry, Program, Mesh } from 'ogl';
import { Box, useToken } from '@chakra-ui/react';

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

  varying float vType;
  varying float vAlpha;

  void main() {
    vType = pointType;
    
    // Smooth interpolation with ease-in-out
    float t = smoothstep(0.0, 1.0, uMix);
    vec3 pos = mix(position, target, t);
    
    // Very subtle micro-drift - high frequency, low amplitude
    pos.x += sin(uTime * 0.15 + position.z) * 0.05;
    pos.y += cos(uTime * 0.15 + position.x) * 0.05;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Crisp micro-points
    float size = (vType > 0.5) ? 1.4 : 0.8;
    gl_PointSize = size * uPixelRatio * (400.0 / -mvPosition.z);
    
    // Depth-based alpha fade
    vAlpha = smoothstep(-15.0, -2.0, mvPosition.z);
  }
`;

const fragment = `
  precision highp float;
  varying float vType;
  varying float vAlpha;
  
  uniform vec3 uColorWhite;
  uniform vec3 uColorGold;
  uniform float uOpacity;

  void main() {
    // Sharp pixel-like data points
    float d = distance(gl_PointCoord, vec2(0.5));
    if (d > 0.45) discard;

    vec3 color = mix(uColorWhite, uColorGold, vType);
    
    // Crisp alpha
    float alpha = uOpacity * vAlpha;
    if (vType > 0.5) alpha *= 1.4;

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

  void main() {
    float t = smoothstep(0.0, 1.0, uMix);
    vec3 pos = mix(position, target, t);
    
    // Micro-drift matching particles
    pos.x += sin(uTime * 0.15 + position.z) * 0.05;
    pos.y += cos(uTime * 0.15 + position.x) * 0.05;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
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

const PARTICLE_COUNT = 2500;
const LINE_COUNT = 400; // Total vertices for line segments

export const QuantMorphField: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [whiteColor, goldColor, borderColor] = useToken('colors', ['gray.100', 'brand.500', 'ui.border']);

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
    camera.position.set(0, 0, 12);
    camera.lookAt([0, 0, 0]);

    const scene = new Transform();

    const hexToVec3 = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;
      return [r, g, b];
    };

    const colorWhite = hexToVec3(whiteColor || '#f7fafc');
    const colorGold = hexToVec3(goldColor || '#d4af37');
    const colorLine = hexToVec3(borderColor || '#2D3748');

    const random = createRandom(1994);

    // Geometry Generators for Clear Shapes

    // --- CUBE ---
    const generateCube = (count: number) => {
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        // Distribute points mainly along the edges of a 4x4x4 cube
        const edge = Math.floor(random() * 12);
        const t = random() * 2 - 1;
        const x = 2;
        if (edge === 0) { pos[i*3] = x; pos[i*3+1] = t*2; pos[i*3+2] = 2; }
        else if (edge === 1) { pos[i*3] = x; pos[i*3+1] = t*2; pos[i*3+2] = -2; }
        else if (edge === 2) { pos[i*3] = -x; pos[i*3+1] = t*2; pos[i*3+2] = 2; }
        else if (edge === 3) { pos[i*3] = -x; pos[i*3+1] = t*2; pos[i*3+2] = -2; }
        else if (edge === 4) { pos[i*3] = t*2; pos[i*3+1] = x; pos[i*3+2] = 2; }
        else if (edge === 5) { pos[i*3] = t*2; pos[i*3+1] = x; pos[i*3+2] = -2; }
        else if (edge === 6) { pos[i*3] = t*2; pos[i*3+1] = -x; pos[i*3+2] = 2; }
        else if (edge === 7) { pos[i*3] = t*2; pos[i*3+1] = -x; pos[i*3+2] = -2; }
        else if (edge === 8) { pos[i*3] = 2; pos[i*3+1] = 2; pos[i*3+2] = t*2; }
        else if (edge === 9) { pos[i*3] = 2; pos[i*3+1] = -2; pos[i*3+2] = t*2; }
        else if (edge === 10) { pos[i*3] = -2; pos[i*3+1] = 2; pos[i*3+2] = t*2; }
        else { pos[i*3] = -2; pos[i*3+1] = -2; pos[i*3+2] = t*2; }
        
        // Add sparse interior dust
        if (random() > 0.8) {
          pos[i*3] = (random()-0.5)*4;
          pos[i*3+1] = (random()-0.5)*4;
          pos[i*3+2] = (random()-0.5)*4;
        }
      }
      return pos;
    };

    const generateCubeLines = (count: number) => {
        const pos = new Float32Array(count * 3);
        const edges = [
            [2,2,2], [2,-2,2], [2,-2,2], [-2,-2,2], [-2,-2,2], [-2,2,2], [-2,2,2], [2,2,2],
            [2,2,-2], [2,-2,-2], [2,-2,-2], [-2,-2,-2], [-2,-2,-2], [-2,2,-2], [-2,2,-2], [2,2,-2],
            [2,2,2], [2,2,-2], [2,-2,2], [2,-2,-2], [-2,-2,2], [-2,-2,-2], [-2,2,2], [-2,2,-2]
        ];
        for (let i = 0; i < count; i++) {
            const vertex = edges[i % edges.length];
            pos[i*3] = vertex[0];
            pos[i*3+1] = vertex[1];
            pos[i*3+2] = vertex[2];
        }
        return pos;
    };

    // --- SPHERE ---
    const generateSphere = (count: number) => {
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const phi = Math.acos(-1 + (2 * i) / count);
        const theta = Math.sqrt(count * Math.PI) * phi;
        const r = 3.0;
        pos[i * 3] = r * Math.cos(theta) * Math.sin(phi);
        pos[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi);
        pos[i * 3 + 2] = r * Math.cos(phi);
      }
      return pos;
    };

    const generateSphereLines = (count: number) => {
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            // Rings
            const ring = Math.floor(i / (count / 4));
            const angle = (i % (count / 4)) / (count / 4) * Math.PI * 2;
            const r = 3.0;
            if (ring === 0) { // XZ Ring
                pos[i*3] = r * Math.cos(angle);
                pos[i*3+1] = 0;
                pos[i*3+2] = r * Math.sin(angle);
            } else if (ring === 1) { // XY Ring
                pos[i*3] = r * Math.cos(angle);
                pos[i*3+1] = r * Math.sin(angle);
                pos[i*3+2] = 0;
            } else if (ring === 2) { // YZ Ring
                pos[i*3] = 0;
                pos[i*3+1] = r * Math.cos(angle);
                pos[i*3+2] = r * Math.sin(angle);
            } else {
                pos[i*3] = (random()-0.5)*2;
                pos[i*3+1] = (random()-0.5)*2;
                pos[i*3+2] = (random()-0.5)*2;
            }
        }
        return pos;
    };

    // --- SURFACE ---
    const generateSurface = (count: number) => {
      const pos = new Float32Array(count * 3);
      const size = Math.floor(Math.sqrt(count));
      for (let i = 0; i < count; i++) {
        const x = (i % size) / size * 8 - 4;
        const z = Math.floor(i / size) / size * 6 - 3;
        const y = Math.sin(x * 1.5) * Math.cos(z * 1.5) * 1.2;
        pos[i * 3] = x;
        pos[i * 3 + 1] = y;
        pos[i * 3 + 2] = z;
      }
      return pos;
    };

    const generateSurfaceLines = (count: number) => {
        const pos = new Float32Array(count * 3);
        const rows = 10;
        const cols = count / 2 / rows;
        for (let i = 0; i < count; i++) {
            const isRow = i < count / 2;
            const idx = isRow ? i : i - count / 2;
            const r = Math.floor(idx / cols);
            const c = idx % cols;
            
            let x, z;
            if (isRow) {
                x = (c / cols) * 8 - 4;
                z = (r / rows) * 6 - 3;
            } else {
                x = (r / rows) * 8 - 4;
                z = (c / cols) * 6 - 3;
            }
            const y = Math.sin(x * 1.5) * Math.cos(z * 1.5) * 1.2;
            pos[i*3] = x;
            pos[i*3+1] = y;
            pos[i*3+2] = z;
        }
        return pos;
    };

    const pointStates = [
      generateCube(PARTICLE_COUNT),
      generateSphere(PARTICLE_COUNT),
      generateSurface(PARTICLE_COUNT),
    ];

    const lineStates = [
      generateCubeLines(LINE_COUNT),
      generateSphereLines(LINE_COUNT),
      generateSurfaceLines(LINE_COUNT),
    ];

    const pointTypes = new Float32Array(PARTICLE_COUNT);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pointTypes[i] = random() > 0.97 ? 1.0 : 0.0; // 3% gold anchors
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
        uColorWhite: { value: colorWhite },
        uColorGold: { value: colorGold },
        uOpacity: { value: 0.35 },
      },
      transparent: true,
      depthTest: false,
    });

    const particles = new Mesh(gl, { mode: gl.POINTS, geometry, program });
    particles.setParent(scene);

    // Line mesh for structural scaffolds
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
            uColor: { value: colorLine },
            uOpacity: { value: 0.15 },
        },
        transparent: true,
    });

    const lines = new Mesh(gl, { mode: gl.LINES, geometry: lineGeometry, program: lineProgram });
    lines.setParent(scene);

    let currentState = 0;
    let nextState = 1;
    let transitionTime = 0;
    const transitionDuration = prefersReducedMotion ? 1000000 : 5.0;
    const waitDuration = 3.0;
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
          const mix = Math.min(transitionTime / transitionDuration, 1.0);
          program.uniforms.uMix.value = mix;
          lineProgram.uniforms.uMix.value = mix;

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
      
      const rotY = time * 0.04;
      const rotX = Math.sin(time * 0.06) * 0.1;
      
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

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(requestID);
      if (container && gl.canvas.parentElement) {
        container.removeChild(gl.canvas);
      }
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [whiteColor, goldColor, borderColor]);

  return (
    <Box
      ref={containerRef}
      position="absolute"
      top="10%" // Offset slightly to sit behind headline but not CTA
      left={0}
      w="100%"
      h="80%"
      zIndex={0}
      pointerEvents="none"
      opacity={0.8}
      bg="transparent"
    />
  );
};
