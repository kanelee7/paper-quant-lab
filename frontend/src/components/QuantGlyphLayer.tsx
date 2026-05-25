import React, { useState, useEffect, useMemo } from 'react';
import { Box, Text } from '@chakra-ui/react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

const GLYPHS = ['σ', 'μ', 'Δt', 'β', 'z', 'λ', '0.618', '1.414', 'ρ', 'θ', 'κ', 'φ'];
const GRID_SIZE = 8; // Approx 64 glyphs total in a loose grid

interface GlyphConfig {
  id: string;
  char: string;
  x: number;
  y: number;
}

const Glyph: React.FC<{ config: GlyphConfig; mouseX: any; mouseY: any }> = ({ config, mouseX, mouseY }) => {
  const distance = useMotionValue(1000);
  
  // Calculate distance from mouse to glyph
  useEffect(() => {
    const unsubscribeX = mouseX.on("change", (latestX: number) => {
      const dx = latestX - config.x;
      const dy = mouseY.get() - config.y;
      distance.set(Math.sqrt(dx * dx + dy * dy));
    });
    return () => unsubscribeX();
  }, [config.x, config.y, mouseX, mouseY, distance]);

  // Map distance to opacity (0.01 at rest, 0.22 at peak proximity)
  const opacity = useTransform(distance, [200, 50], [0.02, 0.22]);
  const scale = useTransform(distance, [200, 50], [0.9, 1.1]);
  
  // Use springs for smooth emergence/fade
  const smoothOpacity = useSpring(opacity, { damping: 20, stiffness: 80 });
  const smoothScale = useSpring(scale, { damping: 20, stiffness: 80 });

  return (
    <motion.div
      style={{
        position: 'absolute',
        left: `${config.x}px`,
        top: `${config.y}px`,
        opacity: smoothOpacity,
        scale: smoothScale,
        translateX: '-50%',
        translateY: '-50%',
      }}
    >
      <Text
        fontSize="10px"
        fontWeight="bold"
        color="brand.400"
        fontFamily="mono"
        userSelect="none"
      >
        {config.char}
      </Text>
    </motion.div>
  );
};

export const QuantGlyphLayer: React.FC = () => {
  const mouseX = useMotionValue(-1000);
  const mouseY = useMotionValue(-1000);

  // Generate a sparse, deterministic-ish grid of glyphs
  const glyphConfigs = useMemo(() => {
    const configs: GlyphConfig[] = [];
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        // Randomize within grid cell for organic but structured placement
        const x = (width / GRID_SIZE) * (i + 0.2 + Math.random() * 0.6);
        const y = (height / GRID_SIZE) * (j + 0.2 + Math.random() * 0.6);
        
        configs.push({
          id: `${i}-${j}`,
          char: GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
          x,
          y,
        });
      }
    }
    return configs;
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      w="100vw"
      h="100vh"
      pointerEvents="none"
      zIndex={15}
      overflow="hidden"
    >
      {glyphConfigs.map(config => (
        <Glyph 
          key={config.id} 
          config={config} 
          mouseX={mouseX} 
          mouseY={mouseY} 
        />
      ))}
    </Box>
  );
};
