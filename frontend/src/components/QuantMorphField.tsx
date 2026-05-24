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
    
    // Subtle analytical drift - reduced frequency, more "heavy"
    pos.x += sin(uTime * 0.15 + position.z * 0.5) * 0.08;
    pos.y += cos(uTime * 0.15 + position.x * 0.5) * 0.08;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Size: smaller individual points but with higher contrast
    // Anchor points (vType > 0.5) are slightly more prominent
    float size = (vType > 0.5) ? 2.8 : 1.4;
    gl_PointSize = size * uPixelRatio * (300.0 / -mvPosition.z);
    
    // Depth-based alpha
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
    // Sharp circle shape - no blur to keep it "data-like"
    float d = distance(gl_PointCoord, vec2(0.5));
    if (d > 0.5) discard;

    vec3 color = mix(uColorWhite, uColorGold, vType);
    
    // High contrast alpha - sharp edges
    float alpha = uOpacity * vAlpha;
    if (vType > 0.5) alpha *= 1.5; // Gold points slightly stronger

    gl_FragColor = vec4(color, alpha);
  }
`;

const PARTICLE_COUNT = 1400; // Balanced density

export const QuantMorphField: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [whiteColor, goldColor] = useToken('colors', ['gray.50', 'brand.400']); // Higher contrast tokens

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

    const camera = new Camera(gl, { fov: 35 }); // Narrower FOV for more cinematic depth
    // Cinematic Asymmetry: Positioned right-heavy but looking slightly left
    camera.position.set(2.5, 0.5, 10); 
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

    const random = createRandom(1337);

    // Analytical Geometry States
    
    // 1. Orderbook Walls / Fragmented Grid
    const generateWalls = (count: number) => {
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        if (random() > 0.8) { // Noise/scatter
            pos[i * 3] = (random() - 0.5) * 12;
            pos[i * 3 + 1] = (random() - 0.5) * 12;
            pos[i * 3 + 2] = (random() - 0.5) * 12;
            continue;
        }
        const side = random() > 0.5 ? 1 : -1;
        pos[i * 3] = side * (1.5 + random() * 2.0); // Side walls
        pos[i * 3 + 1] = (random() - 0.5) * 6.0;
        pos[i * 3 + 2] = (random() - 0.5) * 4.0;
      }
      return pos;
    };

    // 2. Volatility Spike / Fragmented Wave
    const generateSpike = (count: number) => {
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const x = (random() - 0.5) * 8.0;
        const z = (random() - 0.5) * 4.0;
        // Incompleteness: Only keep points in central "spike" region
        const dist = Math.abs(x);
        const y = Math.exp(-dist * dist) * (random() > 0.8 ? 4.0 : 1.5) * (random() > 0.5 ? 1 : -1);
        
        pos[i * 3] = x;
        pos[i * 3 + 1] = y + (random() - 0.5) * 0.5;
        pos[i * 3 + 2] = z;
      }
      return pos;
    };

    // 3. Incomplete Cube Lattice
    const generateLattice = (count: number) => {
      const size = 10;
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        if (random() > 0.4) { // Highly fragmented
            pos[i * 3] = (random() - 0.5) * 12;
            pos[i * 3 + 1] = (random() - 0.5) * 12;
            pos[i * 3 + 2] = (random() - 0.5) * 12;
            continue;
        }
        const x = Math.floor(random() * size) - size / 2;
        const y = Math.floor(random() * size) - size / 2;
        const z = Math.floor(random() * size) - size / 2;
        pos[i * 3] = x * 0.8;
        pos[i * 3 + 1] = y * 0.8;
        pos[i * 3 + 2] = z * 0.8;
      }
      return pos;
    };

    // 4. Ellipsoid Cluster (Not a perfect sphere)
    const generateCluster = (count: number) => {
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const u = random();
        const v = random();
        const theta = 2 * Math.PI * u;
        const phi = Math.acos(2 * v - 1);
        const r = 2.5 + random() * 0.5;
        pos[i * 3] = r * Math.sin(phi) * Math.cos(theta) * 1.5; // X-stretched
        pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.8; // Y-squashed
        pos[i * 3 + 2] = r * Math.cos(phi);
      }
      return pos;
    };

    const states = [
      generateWalls(PARTICLE_COUNT),
      generateSpike(PARTICLE_COUNT),
      generateLattice(PARTICLE_COUNT),
      generateCluster(PARTICLE_COUNT),
    ];

    const pointTypes = new Float32Array(PARTICLE_COUNT);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pointTypes[i] = random() > 0.96 ? 1.0 : 0.0; // 4% gold anchors
    }

    const geometry = new Geometry(gl, {
      position: { size: 3, data: states[0] },
      target: { size: 3, data: states[1] },
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
        uOpacity: { value: 0.45 }, // Increased visibility
      },
      transparent: true,
      depthTest: false,
    });

    const particles = new Mesh(gl, { mode: gl.POINTS, geometry, program });
    particles.setParent(scene);

    let currentState = 0;
    let nextState = 1;
    let transitionTime = 0;
    const transitionDuration = prefersReducedMotion ? 1000000 : 7.0; // Slower transitions
    const waitDuration = 5.0; // Longer pauses
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
          program.uniforms.uMix.value = Math.min(transitionTime / transitionDuration, 1.0);

          if (transitionTime >= transitionDuration) {
            currentState = nextState;
            nextState = (nextState + 1) % states.length;
            transitionTime = 0;
            waitTime = 0;

            geometry.attributes.position.data = states[currentState];
            geometry.attributes.target.data = states[nextState];
            geometry.attributes.position.needsUpdate = true;
            geometry.attributes.target.needsUpdate = true;
            program.uniforms.uMix.value = 0;
          }
        }
      }

      program.uniforms.uTime.value = time;
      particles.rotation.y = time * 0.03; // Even slower rotation
      particles.rotation.z = Math.sin(time * 0.05) * 0.05;

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
  }, [whiteColor, goldColor]);

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
      opacity={0.8}
      bg="background.deep"
    />
  );
};
