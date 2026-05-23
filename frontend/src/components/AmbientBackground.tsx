import React from 'react';
import { Box } from '@chakra-ui/react';

/**
 * AmbientBackground
 * 
 * An extremely restrained geometric ambient system.
 * Designed to feel technical, minimal, and analytical.
 * 
 * Features:
 * - Subtle technical grid (24px cells)
 * - Almost invisible "state field" modulation
 * - Zero glowing particles or cinematic gradients
 */
const AmbientBackground: React.FC = () => {
  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      zIndex={-1}
      pointerEvents="none"
      overflow="hidden"
      bg="background.deep"
    >
      {/* Primary Technical Grid */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        opacity={0.03}
        style={{
          backgroundImage: `
            linear-gradient(to right, #B8A35A 1px, transparent 1px),
            linear-gradient(to bottom, #B8A35A 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Secondary Sub-Grid (Sparse) */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        opacity={0.015}
        style={{
          backgroundImage: `
            linear-gradient(to right, #B8A35A 1px, transparent 1px),
            linear-gradient(to bottom, #B8A35A 1px, transparent 1px)
          `,
          backgroundSize: '120px 120px',
        }}
      />

      {/* Slow Analytical State Field Modulation */}
      <Box
        position="absolute"
        top="-50%"
        left="-50%"
        right="-50%"
        bottom="-50%"
        opacity={0.04}
        style={{
          background: `
            radial-gradient(circle at 50% 50%, #B8A35A 0%, transparent 40%)
          `,
          backgroundSize: '100% 100%',
        }}
        animation="ambient-drift 120s linear infinite"
      />

      {/* Keyframe for extremely slow drift */}
      <style>
        {`
          @keyframes ambient-drift {
            0% { transform: translate(0, 0) rotate(0deg); }
            33% { transform: translate(2%, 1%) rotate(0.5deg); }
            66% { transform: translate(-1%, 2%) rotate(-0.5deg); }
            100% { transform: translate(0, 0) rotate(0deg); }
          }
        `}
      </style>

      {/* Scanline / Axis Marker (Almost Invisible) */}
      <Box
        position="absolute"
        top="0"
        left="15%"
        w="1px"
        h="100%"
        bg="brand.500"
        opacity={0.02}
      />
      <Box
        position="absolute"
        top="35%"
        left="0"
        w="100%"
        h="1px"
        bg="brand.500"
        opacity={0.02}
      />
    </Box>
  );
};

export default AmbientBackground;
