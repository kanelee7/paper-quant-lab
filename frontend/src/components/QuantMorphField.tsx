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
    
    // Smooth interpolation with ease-in-out feel via smoothstep
    float t = smoothstep(0.0, 1.0, uMix);
    vec3 pos = mix(position, target, t);
    
    // Subtle drift
    pos.x += sin(uTime * 0.2 + position.z) * 0.05;
    pos.y += cos(uTime * 0.2 + position.x) * 0.05;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Size attenuation
    float size = (vType > 0.5) ? 4.0 : 2.0;
    gl_PointSize = size * uPixelRatio * (300.0 / -mvPosition.z);
    
    vAlpha = 1.0;
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
    // Circle shape
    float d = distance(gl_PointCoord, vec2(0.5));
    if (d > 0.5) discard;

    vec3 color = mix(uColorWhite, uColorGold, vType);
    
    // Soft edges
    float alpha = smoothstep(0.5, 0.4, d) * uOpacity;
    
    gl_FragColor = vec4(color, alpha);
  }
`;

const PARTICLE_COUNT = 1500;

export const QuantMorphField: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [whiteColor, goldColor] = useToken('colors', ['gray.100', 'brand.500']);

  useEffect(() => {
    if (!containerRef.current) return;

    // Check for reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const renderer = new Renderer({
      alpha: true,
      antialias: true,
      dpr: window.devicePixelRatio,
    });
    const gl = renderer.gl;
    const container = containerRef.current;
    container.appendChild(gl.canvas);

    const camera = new Camera(gl, { fov: 45 });
    camera.position.set(0, 0, 8);

    const scene = new Transform();

    // Utility to parse hex to vec3
    const hexToVec3 = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;
      return [r, g, b];
    };

    const colorWhite = hexToVec3(whiteColor || '#f7fafc');
    const colorGold = hexToVec3(goldColor || '#d4af37');

    const random = createRandom(42);

    // Geometry Generation
    const generateLattice = (count: number) => {
      const size = Math.ceil(Math.pow(count, 1 / 3));
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const x = (i % size) - size / 2;
        const y = (Math.floor(i / size) % size) - size / 2;
        const z = Math.floor(i / (size * size)) - size / 2;
        pos[i * 3] = x * 0.6;
        pos[i * 3 + 1] = y * 0.6;
        pos[i * 3 + 2] = z * 0.6;
      }
      return pos;
    };

    const generateSphere = (count: number) => {
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const phi = Math.acos(-1 + (2 * i) / count);
        const theta = Math.sqrt(count * Math.PI) * phi;
        pos[i * 3] = 2.5 * Math.cos(theta) * Math.sin(phi);
        pos[i * 3 + 1] = 2.5 * Math.sin(theta) * Math.sin(phi);
        pos[i * 3 + 2] = 2.5 * Math.cos(phi);
      }
      return pos;
    };

    const generateSurface = (count: number) => {
      const size = Math.sqrt(count);
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const x = (i % size) - size / 2;
        const z = Math.floor(i / size) - size / 2;
        pos[i * 3] = x * 0.4;
        pos[i * 3 + 1] = Math.sin(x * 0.5) * Math.cos(z * 0.5) * 0.5;
        pos[i * 3 + 2] = z * 0.4;
      }
      return pos;
    };

    const generateScattered = (count: number) => {
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        pos[i * 3] = (random() - 0.5) * 10;
        pos[i * 3 + 1] = (random() - 0.5) * 10;
        pos[i * 3 + 2] = (random() - 0.5) * 10;
      }
      return pos;
    };

    const states = [
      generateLattice(PARTICLE_COUNT),
      generateSphere(PARTICLE_COUNT),
      generateSurface(PARTICLE_COUNT),
      generateScattered(PARTICLE_COUNT),
    ];

    const pointTypes = new Float32Array(PARTICLE_COUNT);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pointTypes[i] = random() > 0.95 ? 1.0 : 0.0; // 5% gold anchors
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
        uOpacity: { value: 0.25 },
      },
      transparent: true,
      depthTest: false,
    });

    const particles = new Mesh(gl, { mode: gl.POINTS, geometry, program });
    particles.setParent(scene);

    let currentState = 0;
    let nextState = 1;
    let transitionTime = 0;
    const transitionDuration = prefersReducedMotion ? 1000000 : 5.0; // Effectively static if reduced motion
    const waitDuration = 3.0;
    let waitTime = 0;

    let requestID: number;
    const update = (t: number) => {
      requestID = requestAnimationFrame(update);
      const time = t * 0.001;

      if (!prefersReducedMotion) {
        if (waitTime < waitDuration) {
          waitTime += 0.016; // approx 60fps
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
      particles.rotation.y = time * 0.05;
      particles.rotation.x = Math.sin(time * 0.1) * 0.1;

      renderer.render({ scene, camera });
    };

    requestID = requestAnimationFrame(update);

    const handleResize = () => {
      const width = containerRef.current?.clientWidth || window.innerWidth;
      const height = containerRef.current?.clientHeight || window.innerHeight;
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
      opacity={0.6}
      bg="background.deep"
    />
  );
};
