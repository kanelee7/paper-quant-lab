import React, { useEffect, useRef } from 'react';
import { Renderer, Camera, Transform, Geometry, Program, Mesh, Vec2 } from 'ogl';
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
  uniform vec2 uMouse;

  varying float vType;
  varying float vAlpha;

  float easeInOutCubic(float x) {
      return x < 0.5 ? 4.0 * x * x * x : 1.0 - pow(-2.0 * x + 2.0, 3.0) / 2.0;
  }

  void main() {
    vType = pointType;

    // Smooth interpolation with eased curve
    float t = easeInOutCubic(clamp(uMix, 0.0, 1.0));
    vec3 currentBasePos = mix(position, target, t);
    vec3 pos = currentBasePos;

    // Continuous Micro-drift (No buffer-swap snap)
    pos.x += sin(uTime * 0.12 + currentBasePos.z) * 0.04;
    pos.y += cos(uTime * 0.12 + currentBasePos.x) * 0.04;

    // Mouse Interaction: Subtle repulsion
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    vec4 mouseInSpace = modelViewMatrix * vec4(uMouse.x * 5.0, uMouse.y * 5.0, 0.0, 1.0);
    float dist = distance(mvPosition.xy, mouseInSpace.xy);
    float repulsion = smoothstep(1.5, 0.0, dist) * 0.2;
    mvPosition.xy += normalize(mvPosition.xy - mouseInSpace.xy + 0.001) * repulsion;

    gl_Position = projectionMatrix * mvPosition;

    // Ultrafine Data Points (0.45px - 0.9px)
    float size = (vType > 0.5) ? 0.9 : 0.55;
    gl_PointSize = size * uPixelRatio * (400.0 / -mvPosition.z);     

    // Stable depth-based alpha
    vAlpha = smoothstep(-22.0, -1.0, mvPosition.z);
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
    // Sharp pixel data points
    float d = distance(gl_PointCoord, vec2(0.5));
    if (d > 0.48) discard;

    vec3 color = mix(uColorWhite, uColorGold, vType);

    // High-density crisp alpha
    float alpha = uOpacity * vAlpha;
    if (vType > 0.5) alpha *= 1.3;

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

  float easeInOutCubic(float x) {
      return x < 0.5 ? 4.0 * x * x * x : 1.0 - pow(-2.0 * x + 2.0, 3.0) / 2.0;
  }

  void main() {
    float t = easeInOutCubic(clamp(uMix, 0.0, 1.0));
    vec3 currentBasePos = mix(position, target, t);
    vec3 pos = currentBasePos;

    pos.x += sin(uTime * 0.12 + currentBasePos.z) * 0.04;
    pos.y += cos(uTime * 0.12 + currentBasePos.x) * 0.04;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    vec4 mouseInSpace = modelViewMatrix * vec4(uMouse.x * 5.0, uMouse.y * 5.0, 0.0, 1.0);
    float dist = distance(mvPosition.xy, mouseInSpace.xy);
    float repulsion = smoothstep(1.2, 0.0, dist) * 0.12;
    mvPosition.xy += normalize(mvPosition.xy - mouseInSpace.xy + 0.001) * repulsion;

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

const PARTICLE_COUNT = 5200; // Increased to high-density fabric     
const LINE_COUNT = 800; // Strengthened scaffold for ultrafine particles

export const QuantMorphField: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouse = useRef(new Vec2(0, 0));
  const targetMouse = useRef(new Vec2(0, 0));
  const [whiteColor, goldColor, borderColor] = useToken('colors', ['gray.50', 'brand.500', 'ui.border']);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth < 768;
    
    // Modest reduction in visual density for mobile
    const particleCount = isMobile ? 3200 : 5200;
    const lineCount = isMobile ? 400 : 800;

    const renderer = new Renderer({
      alpha: true,
      antialias: true,
      dpr: window.devicePixelRatio,
    });
    const gl = renderer.gl;
    container.appendChild(gl.canvas);

    const camera = new Camera(gl, { fov: 35 });
    // Camera position is managed in handleResize now
    camera.lookAt([0, 0, 0]);

    const scene = new Transform();

    const hexToVec3 = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;
      return [r, g, b];
    };

    const colorWhite = hexToVec3(whiteColor || '#ffffff');
    const colorGold = hexToVec3(goldColor || '#d4af37');
    const colorLine = hexToVec3(borderColor || '#4A5568');

    const random = createRandom(2026);

    // Spatial sorting to enforce vertex identity during morphing
    const sortPositions = (posArray: Float32Array) => {
      const pts = [];
      const count = posArray.length / 3;
      for (let i = 0; i < count; i++) {
          const x = posArray[i * 3];
          const y = posArray[i * 3 + 1];
          const z = posArray[i * 3 + 2];
          const r = Math.sqrt(x*x + y*y + z*z);
          const theta = Math.atan2(z, x);
          const phi = Math.acos(y / (r > 0 ? r : 1));
          pts.push({ x, y, z, theta, phi, r });
      }
      pts.sort((a, b) => {
          if (Math.abs(a.theta - b.theta) > 0.1) return a.theta - b.theta;
          if (Math.abs(a.phi - b.phi) > 0.1) return a.phi - b.phi;
          return a.r - b.r;
      });
      for (let i = 0; i < count; i++) {
          posArray[i * 3] = pts[i].x;
          posArray[i * 3 + 1] = pts[i].y;
          posArray[i * 3 + 2] = pts[i].z;
      }
      return posArray;
    };

    const sortLines = (posArray: Float32Array) => {
      const segments = [];
      const count = posArray.length / 6;
      for (let i = 0; i < count; i++) {
          const x1 = posArray[i * 6];
          const y1 = posArray[i * 6 + 1];
          const z1 = posArray[i * 6 + 2];
          const x2 = posArray[i * 6 + 3];
          const y2 = posArray[i * 6 + 4];
          const z2 = posArray[i * 6 + 5];
          const cx = (x1 + x2) / 2;
          const cy = (y1 + y2) / 2;
          const cz = (z1 + z2) / 2;
          const r = Math.sqrt(cx*cx + cy*cy + cz*cz);
          const theta = Math.atan2(cz, cx);
          const phi = Math.acos(cy / (r > 0 ? r : 1));
          segments.push({ x1, y1, z1, x2, y2, z2, theta, phi, r });
      }
      segments.sort((a, b) => {
          if (Math.abs(a.theta - b.theta) > 0.1) return a.theta - b.theta;
          if (Math.abs(a.phi - b.phi) > 0.1) return a.phi - b.phi;
          return a.r - b.r;
      });
      for (let i = 0; i < count; i++) {
          posArray[i * 6] = segments[i].x1;
          posArray[i * 6 + 1] = segments[i].y1;
          posArray[i * 6 + 2] = segments[i].z1;
          posArray[i * 6 + 3] = segments[i].x2;
          posArray[i * 6 + 4] = segments[i].y2;
          posArray[i * 6 + 5] = segments[i].z2;
      }
      return posArray;
    };

    // --- CUBE (eb1577a) ---
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
        if (random() > 0.5) { // Denser volume
          const face = Math.floor(random() * 6);
          const u = random() * 2 - 1;
          const v = random() * 2 - 1;
          if (face === 0) { pos[i*3] = 2.2; pos[i*3+1] = u*2.2; pos[i*3+2] = v*2.2; }
          else if (face === 1) { pos[i*3] = -2.2; pos[i*3+1] = u*2.2; pos[i*3+2] = v*2.2; }
          else if (face === 2) { pos[i*3] = u*2.2; pos[i*3+1] = 2.2; pos[i*3+2] = v*2.2; }
          else if (face === 3) { pos[i*3] = u*2.2; pos[i*3+1] = -2.2; pos[i*3+2] = v*2.2; }
          else if (face === 4) { pos[i*3] = u*2.2; pos[i*3+1] = v*2.2; pos[i*3+2] = 2.2; }
          else { pos[i*3] = u*2.2; pos[i*3+1] = v*2.2; pos[i*3+2] = -2.2; }
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
            pos[i*3] = v[0];
            pos[i*3+1] = v[1];
            pos[i*3+2] = v[2];
        }
        return pos;
    };

    // --- SPHERE (eb1577a) ---
    const generateSphere = (count: number) => {
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const phi = Math.acos(-1 + (2 * i) / count);
        const theta = Math.sqrt(count * Math.PI) * phi;
        const r = 3.2;
        pos[i * 3] = r * Math.cos(theta) * Math.sin(phi);
        pos[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi);        
        pos[i * 3 + 2] = r * Math.cos(phi);
      }
      return pos;
    };

    const generateSphereLines = (count: number) => {
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const ring = Math.floor(i / (count / 8));
            const angle = (i % (count / 8)) / (count / 8) * Math.PI * 2;
            const r = 3.2;
            if (ring === 0) { pos[i*3] = r * Math.cos(angle); pos[i*3+1] = 0; pos[i*3+2] = r * Math.sin(angle); }
            else if (ring === 1) { pos[i*3] = r * Math.cos(angle); pos[i*3+1] = r * Math.sin(angle); pos[i*3+2] = 0; }
            else if (ring === 2) { pos[i*3] = 0; pos[i*3+1] = r * Math.cos(angle); pos[i*3+2] = r * Math.sin(angle); }
            else if (ring < 6) {
                const y = (ring - 4) * 1.5;
                const r2 = Math.sqrt(Math.max(0.1, r*r - y*y));
                pos[i*3] = r2 * Math.cos(angle); pos[i*3+1] = y; pos[i*3+2] = r2 * Math.sin(angle);
            }
            else { pos[i*3] = (random()-0.5)*0.5; pos[i*3+1] = (random()-0.5)*0.5; pos[i*3+2] = (random()-0.5)*0.5; }
        }
        return pos;
    };

    // --- SURFACE (eb1577a) ---
    const generateSurface = (count: number) => {
      const pos = new Float32Array(count * 3);
      const size = Math.floor(Math.sqrt(count));
      for (let i = 0; i < count; i++) {
        const x = (i % size) / size * 9 - 4.5;
        const z = Math.floor(i / size) / size * 7 - 3.5;
        const y = Math.sin(x * 1.4) * Math.cos(z * 1.4) * 1.4;       
        pos[i * 3] = x;
        pos[i * 3 + 1] = y;
        pos[i * 3 + 2] = z;
      }
      return pos;
    };

    const generateSurfaceLines = (count: number) => {
        const pos = new Float32Array(count * 3);
        const rows = 14;
        const cols = Math.floor(count / 2 / rows);
        for (let i = 0; i < count; i++) {
            const isRow = i < count / 2;
            const idx = isRow ? i : i - count / 2;
            const r = Math.floor(idx / cols);
            const c = idx % cols;
            let x, z;
            if (isRow) { x = (c / cols) * 9 - 4.5; z = (r / rows) * 7 - 3.5; }
            else { x = (r / rows) * 9 - 4.5; z = (c / cols) * 7 - 3.5; }
            const y = Math.sin(x * 1.4) * Math.cos(z * 1.4) * 1.4;   
            pos[i*3] = x; pos[i*3+1] = y; pos[i*3+2] = z;
        }
        return pos;
    };

    const pointStates = [
      sortPositions(generateCube(PARTICLE_COUNT)),
      sortPositions(generateSphere(PARTICLE_COUNT)),
      sortPositions(generateSurface(PARTICLE_COUNT)),
    ];

    const lineStates = [
      sortLines(generateCubeLines(LINE_COUNT)),
      sortLines(generateSphereLines(LINE_COUNT)),
      sortLines(generateSurfaceLines(LINE_COUNT)),
    ];

    const pointTypes = new Float32Array(PARTICLE_COUNT);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pointTypes[i] = random() > 0.98 ? 1.0 : 0.0; // Minimal tiny gold anchors
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
        uOpacity: { value: 0.55 }, // High-density opacity
        uMouse: { value: mouse.current },
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
            uColor: { value: colorLine },
            uOpacity: { value: 0.22 }, // Slightly stronger scaffold for ultrafine points
            uMouse: { value: mouse.current },
        },
        transparent: true,
    });

    const lines = new Mesh(gl, { mode: gl.LINES, geometry: lineGeometry, program: lineProgram });
    lines.setParent(scene);

    let currentState = 0;
    let nextState = 1;
    let transitionTime = 0;
    const transitionDuration = prefersReducedMotion ? 1000000 : 8.0; 
    const waitDuration = 4.0;
    let waitTime = 0;

    let requestID: number;
    const update = (t: number) => {
      requestID = requestAnimationFrame(update);
      const time = t * 0.001;

      mouse.current.lerp(targetMouse.current, 0.08);

      if (!prefersReducedMotion) {
        if (waitTime < waitDuration) {
          waitTime += 0.016;
        } else {
          transitionTime += 0.016;
          const mixValue = Math.min(transitionTime / transitionDuration, 1.0);
          program.uniforms.uMix.value = mixValue;
          lineProgram.uniforms.uMix.value = mixValue;

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

      const rotY = time * 0.035;
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
      
      if (width < 768) {
          camera.position.set(0, 0, 16.5);
          scene.scale.set(0.65, 0.65, 0.65);
      } else {
          camera.position.set(0, 0, 12);
          scene.scale.set(1, 1, 1);
      }
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
  }, [whiteColor, goldColor, borderColor]);

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
      bg="transparent"
    />
  );
};
