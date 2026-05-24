import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text } from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';

const GLYPHS = ['σ', 'μ', 'Δt', 'β', 'z', 'λ', '0.618', '1.414', 'ρ', 'θ', 'κ', 'φ'];

interface GlyphInstance {
  id: number;
  char: string;
  x: number;
  y: number;
}

export const QuantGlyphLayer: React.FC = () => {
  const [instances, setInstances] = useState<GlyphInstance[]>([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const AP = AnimatePresence as any;

  const handleMouseMove = useCallback((e: MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (instances.length < 6) { // Max 6 glyphs
        const angle = Math.random() * Math.PI * 2;
        const radius = 40 + Math.random() * 80;
        const newInstance: GlyphInstance = {
          id: Date.now() + Math.random(),
          char: GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
          x: mousePos.x + Math.cos(angle) * radius,
          y: mousePos.y + Math.sin(angle) * radius,
        };
        setInstances(prev => [...prev, newInstance]);
      } else {
        setInstances(prev => prev.slice(1));
      }
    }, 1200); // Slow appearance

    return () => clearInterval(interval);
  }, [mousePos, instances.length]);

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
      <AP mode="popLayout">
        {instances.map(glyph => (
          <motion.div
            key={glyph.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.15, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 2, ease: "easeInOut" }}
            style={{
              position: 'absolute',
              left: glyph.x,
              top: glyph.y,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <Text
              fontSize="10px"
              fontWeight="bold"
              color="brand.400"
              fontFamily="mono"
              letterSpacing="tighter"
              whiteSpace="nowrap"
            >
              {glyph.char}
            </Text>
          </motion.div>
        ))}
      </AP>
    </Box>
  );
};
