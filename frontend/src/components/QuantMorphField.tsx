import React, { useEffect, useRef } from 'react';
import { Renderer, Camera, Transform, Geometry, Program, Mesh, Vec2 } from 'ogl';
import { Box, useToken, useBreakpointValue } from '@chakra-ui/react';

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
  uniform float uInstability;

  varying float vType;
  varying float vAlpha;

  void main() {
    vType = pointType;
    
    // Smooth transition
    float t = smoothstep(0.0, 1.0, uMix);
    vec3 pos = mix(position, target, t);
    
    // Geological instrument drift
    float driftX = sin(uTime * 0.05 + pos.z * 0.2) * 0.03;
    float driftY = cos(uTime * 0.05 + pos.x * 0.2) * 0.03;
    pos.x += driftX;
    pos.y += driftY;

    // Controlled Instability (Resolving from uncertainty)
    float noiseX = sin(uTime * 1.5 + pos.y * 2.0 + pos.z * 1.0);
    float noiseY = cos(uTime * 1.3 + pos.x * 2.0 + pos.z * 1.0);
    float noiseZ = sin(uTime * 1.4 + pos.x * 1.0 + pos.y * 2.0);
    pos += vec3(noiseX, noiseY, noiseZ) * uInstability;

    // Mouse Interaction
    vec4 mvPosition = modelViewMatrix * vec4(pos * uObjectScale, 1.0);
    vec3 mousePos = vec3(uMouse.x * 6.0, uMouse.y * 4.0, 0.0);
    float dist = distance(mvPosition.xyz, mousePos);
    float repulsion = smoothstep(1.5, 0.0, dist) * 0.08;
    mvPosition.xyz += normalize(mvPosition.xyz - mousePos + 0.001) * repulsion;

    gl_Position = projectionMatrix * mvPosition;
    
    // Tiny, tight metadata nodes
    float size = (vType > 0.5) ? 1.0 : 0.6;
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
    // Sharp pixel rendering, absolutely NO soft bokeh edges
    float d = distance(gl_PointCoord, vec2(0.5));
    if (d > 0.48) discard;

    vec3 color = mix(uColorA, uColorB, vType);
    float alpha = uOpacity * vAlpha * (vType > 0.5 ? 1.4 : 0.8);
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
  uniform float uInstability;

  varying float vAlpha;

  void main() {
    float t = smoothstep(0.0, 1.0, uMix);
    vec3 pos = mix(position, target, t);
    
    float driftX = sin(uTime * 0.05 + pos.z * 0.2) * 0.03;
    float driftY = cos(uTime * 0.05 + pos.x * 0.2) * 0.03;
    pos.x += driftX;
    pos.y += driftY;

    float noiseX = sin(uTime * 1.5 + pos.y * 2.0 + pos.z * 1.0);
    float noiseY = cos(uTime * 1.3 + pos.x * 2.0 + pos.z * 1.0);
    float noiseZ = sin(uTime * 1.4 + pos.x * 1.0 + pos.y * 2.0);
    pos += vec3(noiseX, noiseY, noiseZ) * uInstability;

    vec4 mvPosition = modelViewMatrix * vec4(pos * uObjectScale, 1.0);
    vec3 mousePos = vec3(uMouse.x * 6.0, uMouse.y * 4.0, 0.0);
    float dist = distance(mvPosition.xyz, mousePos);
    float repulsion = smoothstep(1.5, 0.0, dist) * 0.08;
    mvPosition.xyz += normalize(mvPosition.xyz - mousePos + 0.001) * repulsion;

    gl_Position = projectionMatrix * mvPosition;
    
    vAlpha = smoothstep(-25.0, -1.0, mvPosition.z);
  }
`;

const lineFragment = `
  precision highp float;
  varying float vAlpha;
  uniform vec3 uColor;
  uniform float uOpacity;
  void main() {
    gl_FragColor = vec4(uColor, uOpacity * vAlpha);
  }
`;

// Exact 1:1 vertex mapping guarantees continuous silhouette without fog build-up
const ELEMENT_COUNT = 4096;

export const QuantMorphField: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouse = useRef(new Vec2(0, 0));
  const [colorA, colorB, borderColor] = useToken('colors', ['gray.50', 'gray.300', 'ui.border']);

  const objectScale = useBreakpointValue({ base: 0.5, md: 0.75, lg: 0.9 }) || 0.5;
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
    const cB = hexToVec3(colorB || '#e2e8f0');
    const cL = hexToVec3(borderColor || '#4A5568');

    const random = createRandom(1994);

    // --- PHASE GENERATORS ---
    const generatePhaseData = (phase: number) => {
        const nodes = new Float32Array(ELEMENT_COUNT * 3);
        const lines = new Float32Array(ELEMENT_COUNT * 6); // 2 vertices per line
        
        for (let i = 0; i < ELEMENT_COUNT; i++) {
            let nx = 0, ny = 0, nz = 0;
            let tx = 0, ty = 0, tz = 0;
            let drawLine = false;

            if (phase === 0) { 
                // 01 Constraint Seed: Triangle Core + Calibration Rings + Slicing Guides
                if (i < 120) {
                    // Triangle core
                    const tri = [[0, 2.0, 0], [-1.8, -1.0, 0], [1.8, -1.0, 0]];
                    const edge = Math.floor(i / 40);
                    const pt = i % 40;
                    const p1 = tri[edge];
                    const p2 = tri[(edge+1)%3];
                    const t = pt / 40;
                    const t_next = (pt+1) / 40;
                    nx = p1[0] + (p2[0]-p1[0])*t; ny = p1[1] + (p2[1]-p1[1])*t; nz = p1[2] + (p2[2]-p1[2])*t;
                    tx = p1[0] + (p2[0]-p1[0])*t_next; ty = p1[1] + (p2[1]-p1[1])*t_next; tz = p1[2] + (p2[2]-p1[2])*t_next;
                    drawLine = true;
                } else if (i < 512) {
                    // Diagonal slicing guides
                    const a = (i / 392) * Math.PI;
                    const len = 8.0;
                    nx = Math.cos(a)*len; ny = Math.sin(a)*len; nz = 0;
                    tx = -nx; ty = -ny; tz = 0;
                    drawLine = random() > 0.8; // sparse guides
                } else {
                    // Concentric rings
                    const ring = Math.floor((i-512) / 256);
                    const pt = (i-512) % 256;
                    const rad = 2.0 + ring * 1.2;
                    const a1 = (pt / 256) * Math.PI * 2;
                    nx = Math.cos(a1)*rad; ny = Math.sin(a1)*rad; nz = 0;
                    const a2 = ((pt+1) / 256) * Math.PI * 2;
                    tx = Math.cos(a2)*rad; ty = Math.sin(a2)*rad; tz = 0;
                    drawLine = random() > 0.65; // fragmented arcs
                }
            } 
            else if (phase === 1) { 
                // 02 Topology Mesh: Implied Market Structure (Wave)
                const c = i % 64; 
                const r = Math.floor(i / 64);
                nx = (c/64)*16 - 8; nz = (r/64)*12 - 6;
                ny = Math.sin(nx*0.6)*Math.cos(nz*0.6)*2.5;

                const nc = (c+1)%64;
                tx = (nc/64)*16 - 8; tz = nz;
                ty = Math.sin(tx*0.6)*Math.cos(tz*0.6)*2.5;

                drawLine = random() > 0.4 && c !== 63; // horizontal mesh lines
            }
            else if (phase === 2) { 
                // 03 Lattice Reorganization: Structural Grid
                const x = i % 16; 
                const y = Math.floor(i/16) % 16; 
                const z = Math.floor(i/256);
                
                nx = (x/16)*10 - 5; 
                ny = (y/16)*10 - 5; 
                nz = (z/16)*10 - 5;
                
                const nx_t = (x+1)%16; 
                tx = (nx_t/16)*10 - 5; ty = ny; tz = nz;

                drawLine = random() > 0.65 && x !== 15; // sparse lattice connections
            }

            nodes[i*3] = nx; nodes[i*3+1] = ny; nodes[i*3+2] = nz;

            if (drawLine) {
                lines[i*6] = nx; lines[i*6+1] = ny; lines[i*6+2] = nz;
                lines[i*6+3] = tx; lines[i*6+4] = ty; lines[i*6+5] = tz;
            } else {
                // Invisible zero-length line (prevents fog and stray artifacts)
                lines[i*6] = nx; lines[i*6+1] = ny; lines[i*6+2] = nz;
                lines[i*6+3] = nx; lines[i*6+4] = ny; lines[i*6+5] = nz;
            }
        }

        return { nodes, lines };
    };

    const phases = [0, 1, 2].map(p => generatePhaseData(p));
    
    const nodeTypes = new Float32Array(ELEMENT_COUNT);
    for (let i = 0; i < ELEMENT_COUNT; i++) nodeTypes[i] = random() > 0.95 ? 1.0 : 0.0;

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
            uOpacity: { value: 0.6 },
            uMouse: { value: mouse.current },
            uObjectScale: { value: objectScale }, uInstability: { value: 0.05 },
        },
        transparent: true, depthTest: false
    });
    
    // Sparse Nodes
    // We only render 1/4 of the nodes to keep it clean and structural, not cloudy.
    const nodesMesh = new Mesh(gl, { 
        mode: gl.POINTS, 
        geometry: nodeGeometry, 
        program: nodeProgram 
    });
    // @ts-ignore
    nodeGeometry.drawRange = { start: 0, count: Math.floor(ELEMENT_COUNT * 0.25) }; 
    nodesMesh.setParent(scene);

    const lineGeometry = new Geometry(gl, {
        position: { size: 3, data: phases[0].lines },
        target: { size: 3, data: phases[1].lines }
    });

    const lineProgram = new Program(gl, {
        vertex: lineVertex, fragment: lineFragment,
        uniforms: {
            uMix: { value: 0 }, uTime: { value: 0 },
            uColor: { value: cL }, uOpacity: { value: 0.35 },
            uMouse: { value: mouse.current },
            uObjectScale: { value: objectScale }, uInstability: { value: 0.05 },
        },
        transparent: true, depthTest: false
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
      
      let mixVal = 0;

      if (waitTime < waitDuration) {
        waitTime += 0.016;
        mixVal = 0;
      } else {
        transitionTime += 0.016;
        mixVal = Math.min(transitionTime / transitionDuration, 1.0);
        
        if (transitionTime >= transitionDuration) {
          currentPhase = nextPhase;
          nextPhase = (nextPhase + 1) % phases.length;
          transitionTime = 0; waitTime = 0;
          mixVal = 0;

          nodeGeometry.attributes.position.data = phases[currentPhase].nodes;
          nodeGeometry.attributes.target.data = phases[nextPhase].nodes;
          nodeGeometry.attributes.position.needsUpdate = true;
          nodeGeometry.attributes.target.needsUpdate = true;

          lineGeometry.attributes.position.data = phases[currentPhase].lines;
          lineGeometry.attributes.target.data = phases[nextPhase].lines;
          lineGeometry.attributes.position.needsUpdate = true;
          lineGeometry.attributes.target.needsUpdate = true;
        }
      }

      nodeProgram.uniforms.uMix.value = mixVal;
      lineProgram.uniforms.uMix.value = mixVal;

      // Controlled Instability (peaks during transition, settles during hold)
      const baseInstability = 0.05;
      const transitionInstability = Math.sin(mixVal * Math.PI) * 0.6; 
      const currentInstability = baseInstability + transitionInstability;
      
      nodeProgram.uniforms.uInstability.value = currentInstability;
      lineProgram.uniforms.uInstability.value = currentInstability;

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
