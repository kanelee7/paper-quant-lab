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
    
    // Smooth transition between structures
    float t = smoothstep(0.0, 1.0, uMix);
    vec3 pos = mix(position, target, t);
    
    // Geological instrument drift
    float driftX = sin(uTime * 0.05 + pos.z * 0.2) * 0.03;
    float driftY = cos(uTime * 0.05 + pos.x * 0.2) * 0.03;
    pos.x += driftX;
    pos.y += driftY;

    // Field Distortion (Phase 3)
    float wave = sin(uTime * 1.2 + pos.x * 1.5) * cos(uTime * 0.8 + pos.z * 1.5);
    pos.y += wave * uDistortion * 0.8;

    // Mouse Interaction (Tactile Calibration)
    vec4 mvPosition = modelViewMatrix * vec4(pos * uObjectScale, 1.0);
    vec3 mousePos = vec3(uMouse.x * 6.0, uMouse.y * 4.0, 0.0);
    float dist = distance(mvPosition.xyz, mousePos);
    float repulsion = smoothstep(1.5, 0.0, dist) * 0.08;
    mvPosition.xyz += normalize(mvPosition.xyz - mousePos + 0.001) * repulsion;

    gl_Position = projectionMatrix * mvPosition;
    
    // Tiny sparse metadata nodes
    float size = (vType > 0.5) ? 0.9 : 0.5;
    gl_PointSize = size * uPixelRatio * (400.0 / -mvPosition.z);
    
    vAlpha = smoothstep(-25.0, -1.0, mvPosition.z);
  }
`;

const fragment = `
  precision highp float;
  varying float vType;
  varying float vAlpha;
  
  uniform vec3 uColor;
  uniform float uOpacity;

  void main() {
    // Sharp points, no bokeh
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
  uniform float uDistortion;

  varying float vAlpha;

  void main() {
    float t = smoothstep(0.0, 1.0, uMix);
    vec3 pos = mix(position, target, t);
    
    float driftX = sin(uTime * 0.05 + pos.z * 0.2) * 0.03;
    float driftY = cos(uTime * 0.05 + pos.x * 0.2) * 0.03;
    pos.x += driftX;
    pos.y += driftY;

    // Field Distortion (Phase 3)
    float wave = sin(uTime * 1.2 + pos.x * 1.5) * cos(uTime * 0.8 + pos.z * 1.5);
    pos.y += wave * uDistortion * 0.8;

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

// Strict visual hierarchy: Line-first structure, sparse nodes.
const NODE_VERTS = 800;
const LINE_VERTS = 4000; // 2000 line segments

export const QuantMorphField: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouse = useRef(new Vec2(0, 0));
  const [lineColor, pointColor] = useToken('colors', ['ui.border', 'gray.100']);

  const objectScale = useBreakpointValue({ base: 0.5, md: 0.8, lg: 0.9 }) || 0.5;
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

    const cL = hexToVec3(lineColor || '#4A5568');
    const cP = hexToVec3(pointColor || '#f7fafc');

    const random = createRandom(8888);

    // --- PHASE GEOMETRY GENERATORS ---
    // Rule: Never generate empty fog. Build solid line structures. Fill remainder with perfect clones to avoid gl.LINES clipping.

    const generatePhaseData = (phase: number) => {
        const nodes = new Float32Array(NODE_VERTS * 3);
        const lines = new Float32Array(LINE_VERTS * 3);
        
        let nIdx = 0;
        let lIdx = 0;

        const addNode = (x: number, y: number, z: number) => {
            if (nIdx >= NODE_VERTS) return;
            nodes[nIdx*3] = x; nodes[nIdx*3+1] = y; nodes[nIdx*3+2] = z;
            nIdx++;
        };

        const addLine = (x1: number, y1: number, z1: number, x2: number, y2: number, z2: number) => {
            if (lIdx >= LINE_VERTS - 1) return;
            lines[lIdx*3] = x1; lines[lIdx*3+1] = y1; lines[lIdx*3+2] = z1;
            lIdx++;
            lines[lIdx*3] = x2; lines[lIdx*3+1] = y2; lines[lIdx*3+2] = z2;
            lIdx++;
        };

        const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

        if (phase === 0) { 
            // 01 Constraint Seed: Triangle core + Rings
            const tri = [[0, 2.5, 0], [-2.16, -1.25, 0], [2.16, -1.25, 0]];
            for (let l = 0; l < 5; l++) {
                const s = 0.6 + l * 0.25;
                for (let i = 0; i < 60; i++) {
                    const t1 = i / 60; const t2 = (i + 1) / 60;
                    addLine(lerp(tri[0][0]*s, tri[1][0]*s, t1), lerp(tri[0][1]*s, tri[1][1]*s, t1), 0,
                            lerp(tri[0][0]*s, tri[1][0]*s, t2), lerp(tri[0][1]*s, tri[1][1]*s, t2), 0);
                    addLine(lerp(tri[1][0]*s, tri[2][0]*s, t1), lerp(tri[1][1]*s, tri[2][1]*s, t1), 0,
                            lerp(tri[1][0]*s, tri[2][0]*s, t2), lerp(tri[1][1]*s, tri[2][1]*s, t2), 0);
                    addLine(lerp(tri[2][0]*s, tri[0][0]*s, t1), lerp(tri[2][1]*s, tri[0][1]*s, t1), 0,
                            lerp(tri[2][0]*s, tri[0][0]*s, t2), lerp(tri[2][1]*s, tri[0][1]*s, t2), 0);
                }
            }
            // Calibration Rings
            for (let r = 0; r < 6; r++) {
                const radius = 3.0 + r * 0.9;
                for (let i = 0; i < 150; i++) {
                    if (random() > 0.8) continue; // structural gaps
                    const a1 = (i / 150) * Math.PI * 2; const a2 = ((i + 1) / 150) * Math.PI * 2;
                    addLine(Math.cos(a1)*radius, Math.sin(a1)*radius, (random()-0.5)*0.2, 
                            Math.cos(a2)*radius, Math.sin(a2)*radius, (random()-0.5)*0.2);
                }
            }
            // Add nodes exactly on rings/triangle
            for (let i=0; i<NODE_VERTS; i++) {
                const r = random() > 0.4 ? 3.0 + Math.floor(random()*6)*0.9 : 1.5;
                const a = random() * Math.PI * 2;
                addNode(Math.cos(a)*r, Math.sin(a)*r, 0);
            }
        } 
        else if (phase === 1) { 
            // 02 Contour Emergence: Fragmented arcs + guides
            // Slicing guides
            for (let i=0; i<20; i++) {
                const a = (i/20) * Math.PI;
                const len = 12.0;
                addLine(Math.cos(a)*len, Math.sin(a)*len, 0, -Math.cos(a)*len, -Math.sin(a)*len, 0);
            }
            // Cylindrical contour arcs
            for (let c = 0; c < 25; c++) {
                const radius = 2.0 + c * 0.25;
                const yOffset = (random() - 0.5) * 8.0;
                for (let i = 0; i < 50; i++) {
                    if (random() > 0.5) continue;
                    const a1 = (i / 50) * Math.PI * 2; const a2 = ((i + 1) / 50) * Math.PI * 2;
                    addLine(Math.cos(a1)*radius, yOffset, Math.sin(a1)*radius,
                            Math.cos(a2)*radius, yOffset, Math.sin(a2)*radius);
                }
            }
            for (let i=0; i<NODE_VERTS; i++) addNode((random()-0.5)*8, (random()-0.5)*8, (random()-0.5)*4);
        }
        else if (phase === 2 || phase === 3) { 
            // 03 & 04 Surface Formation / Field Distortion: Dense topology grid
            const gridW = 35;
            const gridH = 30;
            for (let x = 0; x < gridW; x++) {
                for (let z = 0; z < gridH; z++) {
                    const px1 = (x / gridW) * 16 - 8;
                    const pz1 = (z / gridH) * 12 - 6;
                    const py1 = Math.sin(px1 * 0.8) * Math.cos(pz1 * 0.8) * 2.0;
                    
                    if (x < gridW - 1) {
                        const px2 = ((x+1) / gridW) * 16 - 8;
                        const py2 = Math.sin(px2 * 0.8) * Math.cos(pz1 * 0.8) * 2.0;
                        addLine(px1, py1, pz1, px2, py2, pz1);
                    }
                    if (z < gridH - 1) {
                        const pz2 = ((z+1) / gridH) * 12 - 6;
                        const py2 = Math.sin(px1 * 0.8) * Math.cos(pz2 * 0.8) * 2.0;
                        addLine(px1, py1, pz1, px1, py2, pz2);
                    }
                }
            }
            // Nodes mapped strictly to surface peaks
            for (let i=0; i<NODE_VERTS; i++) {
                const px = (random() * 16) - 8;
                const pz = (random() * 12) - 6;
                const py = Math.sin(px * 0.8) * Math.cos(pz * 0.8) * 2.0;
                addNode(px, py, pz);
            }
        }
        else if (phase === 4) { 
            // 05 Lattice Reorganization: 3D Grid Structure
            const lSize = 7;
            const spacing = 1.6;
            for (let x = 0; x < lSize; x++) {
                for (let y = 0; y < lSize; y++) {
                    for (let z = 0; z < lSize; z++) {
                        const px1 = (x - lSize/2)*spacing;
                        const py1 = (y - lSize/2)*spacing;
                        const pz1 = (z - lSize/2)*spacing;
                        
                        if (x < lSize-1 && random() > 0.2) addLine(px1, py1, pz1, px1+spacing, py1, pz1);
                        if (y < lSize-1 && random() > 0.2) addLine(px1, py1, pz1, px1, py1+spacing, pz1);
                        if (z < lSize-1 && random() > 0.2) addLine(px1, py1, pz1, px1, py1, pz1+spacing);
                        
                        if (nIdx < NODE_VERTS && random() > 0.5) addNode(px1, py1, pz1);
                    }
                }
            }
            while(nIdx < NODE_VERTS) addNode((random()-0.5)*8, (random()-0.5)*8, (random()-0.5)*8);
        }
        else { 
            // 06 Reasoning Topology: High confidence interconnected geometry (e.g. dense intersecting spheres)
            const r = 4.5;
            for (let i=0; i < 600; i++) {
                const u1 = random()*Math.PI*2; const v1 = Math.acos(2*random()-1);
                const u2 = u1 + (random()-0.5)*0.8; const v2 = v1 + (random()-0.5)*0.8;
                addLine(r*Math.sin(v1)*Math.cos(u1), r*Math.sin(v1)*Math.sin(u1), r*Math.cos(v1),
                        r*Math.sin(v2)*Math.cos(u2), r*Math.sin(v2)*Math.sin(u2), r*Math.cos(v2));
            }
            for (let i=0; i < 200; i++) { // Core connections
                const u1 = random()*Math.PI*2; const v1 = Math.acos(2*random()-1);
                addLine(r*Math.sin(v1)*Math.cos(u1), r*Math.sin(v1)*Math.sin(u1), r*Math.cos(v1), 
                        (random()-0.5)*1.0, (random()-0.5)*1.0, (random()-0.5)*1.0);
            }
            for (let i=0; i<NODE_VERTS; i++) {
                const u1 = random()*Math.PI*2; const v1 = Math.acos(2*random()-1);
                addNode(r*Math.sin(v1)*Math.cos(u1), r*Math.sin(v1)*Math.sin(u1), r*Math.cos(v1));
            }
        }

        // Perfect buffer clone to fill remaining space (guarantees NO random empty fog or glitch lines to 0,0,0)
        let sLineIdx = 0;
        while (lIdx < LINE_VERTS) {
            if (sLineIdx >= lIdx) sLineIdx = 0;
            lines[lIdx*3] = lines[sLineIdx*3]; lines[lIdx*3+1] = lines[sLineIdx*3+1]; lines[lIdx*3+2] = lines[sLineIdx*3+2];
            lIdx++;
            lines[lIdx*3] = lines[sLineIdx*3]; lines[lIdx*3+1] = lines[sLineIdx*3+1]; lines[lIdx*3+2] = lines[sLineIdx*3+2];
            lIdx++;
            sLineIdx += 2;
        }

        let sNodeIdx = 0;
        while (nIdx < NODE_VERTS) {
            if (sNodeIdx >= nIdx) sNodeIdx = 0;
            nodes[nIdx*3] = nodes[sNodeIdx*3]; nodes[nIdx*3+1] = nodes[sNodeIdx*3+1]; nodes[nIdx*3+2] = nodes[sNodeIdx*3+2];
            nIdx++;
            sNodeIdx++;
        }

        return { nodes, lines };
    };

    const phases = [0, 1, 2, 3, 4, 5].map(p => generatePhaseData(p));
    
    const nodeTypes = new Float32Array(NODE_VERTS);
    for (let i = 0; i < NODE_VERTS; i++) nodeTypes[i] = random() > 0.9 ? 1.0 : 0.0;

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
            uColor: { value: cP }, uOpacity: { value: 0.6 }, // Higher opacity for nodes, but they are tiny
            uMouse: { value: mouse.current },
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
            uColor: { value: cL }, uOpacity: { value: 0.35 }, // Much stronger line visibility
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
    const waitDuration = 6.0;
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
      const distortionVal = currentPhase === 3 ? Math.sin(time * 1.5) * 0.5 + 0.5 : 0;
      nodeProgram.uniforms.uDistortion.value = distortionVal;
      lineProgram.uniforms.uDistortion.value = distortionVal;

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
