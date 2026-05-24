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
    
    // Smooth interpolation
    float t = smoothstep(0.0, 1.0, uMix);
    vec3 pos = mix(position, target, t);
    
    // Very subtle micro-drift - high frequency, low amplitude
    pos.x += sin(uTime * 0.1 + position.z) * 0.04;
    pos.y += cos(uTime * 0.1 + position.x) * 0.04;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Drastically smaller, crisp points
    // Base size is tiny (0.7px - 1.2px)
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
    // Crisp micro-square/circle (no blur)
    // We use a very tight disc to ensure it reads as a "pixel-like" data point
    float d = distance(gl_PointCoord, vec2(0.5));
    if (d > 0.45) discard;

    vec3 color = mix(uColorWhite, uColorGold, vType);
    
    // Flat, crisp alpha - no bokeh falloff
    float alpha = uOpacity * vAlpha;
    if (vType > 0.5) alpha *= 1.3;

    gl_FragColor = vec4(color, alpha);
  }
`;

const PARTICLE_COUNT = 3200; // High density for fine topology

export const QuantMorphField: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [whiteColor, goldColor] = useToken('colors', ['gray.50', 'brand.500']);

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

    const camera = new Camera(gl, { fov: 30 }); // Very narrow FOV for "observed" look
    // Focused composition: centered but deep
    camera.position.set(0, 0, 10);
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

    const random = createRandom(80085);

    // Structured Analytical Geometries
    
    // 1. Structured Volatility Surface
    const generateSurface = (count: number) => {
      const pos = new Float32Array(count * 3);
      const size = Math.sqrt(count);
      for (let i = 0; i < count; i++) {
        const x = ((i % size) / size - 0.5) * 10;
        const z = (Math.floor(i / size) / size - 0.5) * 6;
        
        // Complex structured wave
        const y = Math.sin(x * 0.8) * Math.cos(z * 1.2) * 0.6 + 
                  Math.sin(x * 2.5) * 0.15; // micro-ripples
                  
        pos[i * 3] = x;
        pos[i * 3 + 1] = y;
        pos[i * 3 + 2] = z;
      }
      return pos;
    };

    // 2. Structured Cube Topology (Incomplete but Coherent)
    const generateLattice = (count: number) => {
      const pos = new Float32Array(count * 3);
      const step = 0.5;
      const bounds = 6;
      for (let i = 0; i < count; i++) {
        // Form a shell-like structured lattice
        const x = (Math.floor(random() * bounds) - bounds / 2) * step;
        const y = (Math.floor(random() * bounds) - bounds / 2) * step;
        const z = (Math.floor(random() * bounds) - bounds / 2) * step;
        
        // Add structured noise to fill volume but keep "grid" nodes
        pos[i * 3] = x + (random() - 0.5) * 0.1;
        pos[i * 3 + 1] = y + (random() - 0.5) * 0.1;
        pos[i * 3 + 2] = z + (random() - 0.5) * 0.1;
      }
      return pos;
    };

    // 3. Orderbook Stack / Horizontal Planes
    const generatePlanes = (count: number) => {
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const level = Math.floor(random() * 5) - 2;
        const x = (random() - 0.5) * 10;
        const z = (random() - 0.5) * 5;
        
        pos[i * 3] = x;
        pos[i * 3 + 1] = level * 0.4 + (random() - 0.5) * 0.05;
        pos[i * 3 + 2] = z;
      }
      return pos;
    };

    // 4. Concentric Analytical Cluster (Not a sphere)
    const generateEllipsoid = (count: number) => {
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const phi = Math.acos(-1 + (2 * i) / count);
        const theta = Math.sqrt(count * Math.PI) * phi;
        const r = 3.0;
        pos[i * 3] = r * Math.cos(theta) * Math.sin(phi) * 1.5; // Stretch X
        pos[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi) * 0.6; // Squash Y
        pos[i * 3 + 2] = r * Math.cos(phi) * 0.8; // Squash Z
      }
      return pos;
    };

    const states = [
      generateSurface(PARTICLE_COUNT),
      generateLattice(PARTICLE_COUNT),
      generatePlanes(PARTICLE_COUNT),
      generateEllipsoid(PARTICLE_COUNT),
    ];

    const pointTypes = new Float32Array(PARTICLE_COUNT);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pointTypes[i] = random() > 0.98 ? 1.0 : 0.0; // Minimal gold anchors (2%)
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
        uOpacity: { value: 0.35 }, // Subtler but crisp
      },
      transparent: true,
      depthTest: false,
    });

    const particles = new Mesh(gl, { mode: gl.POINTS, geometry, program });
    particles.setParent(scene);

    let currentState = 0;
    let nextState = 1;
    let transitionTime = 0;
    const transitionDuration = prefersReducedMotion ? 1000000 : 8.0; // Very slow reorganizing
    const waitDuration = 6.0;
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
      particles.rotation.y = time * 0.02; // Minimal rotation
      particles.rotation.z = Math.sin(time * 0.04) * 0.02;

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
      opacity={0.7}
      bg="background.deep"
    />
  );
};
