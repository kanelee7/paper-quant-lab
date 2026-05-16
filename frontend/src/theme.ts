import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
};

// Visual Identity: PaperQuantLab
// Mood: Focused, Analytical, Premium, Research Workstation
// Accent: Muted Old-Gold (#B8A35A)
// Background: Charcoal/Graphite

const theme = extendTheme({
  config,
  colors: {
    brand: {
      50: '#F7F3E6',
      100: '#E9E1C2',
      200: '#DACF9D',
      300: '#CCBD79',
      400: '#BEAB55',
      500: '#B8A35A', // Primary Accent
      600: '#9E8642',
      700: '#7E6B35',
      800: '#5F5128',
      900: '#3F361A',
    },
    background: {
      deep: '#0B0C0E', // Deeper near black
      surface: '#15171B', // Dark graphite
      elevated: '#1E2126', // Lighter graphite for depth
    },
    ui: {
      border: '#282B33', // Consistent technical border
      muted: '#5C6370',
      accentMuted: '#B8A35A22',
    },
    status: {
      success: '#8F9A5B',
      error: '#A84A4A',
      warning: '#B88B5A',
      info: '#5A8BB8',
    }
  },
  shadows: {
    panel: '0 4px 24px -1px rgba(0, 0, 0, 0.4)',
    glow: '0 0 15px -2px rgba(184, 163, 90, 0.15)',
  },
  fonts: {
    heading: '"Inter", -apple-system, system-ui, sans-serif',
    body: '"Inter", -apple-system, system-ui, sans-serif',
    mono: '"JetBrains Mono", "Fira Code", monospace',
  },
  styles: {
    global: (props: { colorMode: string }) => ({
      body: {
        bg: props.colorMode === 'dark' ? 'background.deep' : 'gray.50',
        color: props.colorMode === 'dark' ? 'gray.100' : 'gray.800',
        lineHeight: 'tall',
        overflowX: 'hidden',
      },
      '::-webkit-scrollbar': {
        width: '5px',
        height: '5px',
      },
      '::-webkit-scrollbar-track': {
        bg: 'transparent',
      },
      '::-webkit-scrollbar-thumb': {
        bg: props.colorMode === 'dark' ? 'whiteAlpha.100' : 'blackAlpha.100',
        borderRadius: 'full',
      },
      '::-webkit-scrollbar-thumb:hover': {
        bg: 'whiteAlpha.300',
      },
    }),
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: '600',
        borderRadius: 'sm',
        transition: 'all 0.15s ease-out',
        letterSpacing: 'tight',
      },
      variants: {
        solid: (props: { colorScheme: string }) => ({
          bg: props.colorScheme === 'brand' ? 'brand.500' : undefined,
          color: props.colorScheme === 'brand' ? 'background.deep' : undefined,
          _hover: {
            bg: props.colorScheme === 'brand' ? 'brand.400' : undefined,
            _disabled: {
                bg: props.colorScheme === 'brand' ? 'brand.600' : undefined,
            }
          },
        }),
        outline: {
          borderColor: 'ui.border',
          bg: 'whiteAlpha.50',
          _hover: {
            bg: 'whiteAlpha.100',
            borderColor: 'whiteAlpha.400',
          }
        },
        ghost: {
          _hover: {
            bg: 'whiteAlpha.50',
          }
        },
        'workstation-tab': (props: { isActive: boolean }) => ({
          bg: props.isActive ? 'background.elevated' : 'transparent',
          color: props.isActive ? 'brand.500' : 'ui.muted',
          borderBottom: props.isActive ? '2px solid' : 'none',
          borderColor: 'brand.500',
          borderRadius: 'none',
          fontSize: 'xs',
          px: 4,
          h: '40px',
          _hover: {
            bg: 'background.elevated',
            color: 'white',
          }
        })
      },
    },
    Card: {
      baseStyle: (props: { colorMode: string }) => ({
        container: {
          bg: props.colorMode === 'dark' ? 'background.surface' : 'white',
          borderRadius: 'sm',
          borderWidth: '1px',
          borderColor: 'ui.border',
          boxShadow: 'panel',
          overflow: 'hidden',
        },
      }),
    },
    Badge: {
      baseStyle: {
        borderRadius: 'xs',
        textTransform: 'uppercase',
        fontWeight: '800',
        fontSize: '9px',
        px: 1.5,
        letterSpacing: 'wider',
      },
      variants: {
        solid: (props: { colorScheme: string }) => ({
          bg: props.colorScheme === 'brand' ? 'brand.500' : undefined,
          color: 'background.deep',
        }),
        subtle: {
            bg: 'whiteAlpha.50',
            color: 'whiteAlpha.800',
            borderWidth: '1px',
            borderColor: 'whiteAlpha.100',
        }
      }
    },
    Table: {
      variants: {
        simple: {
          th: {
            borderColor: 'ui.border',
            color: 'ui.muted',
            fontSize: '10px',
            letterSpacing: 'widest',
            fontWeight: 'bold',
            py: 3,
          },
          td: {
            borderColor: 'ui.border',
            py: 3,
          }
        }
      }
    },
    Heading: {
      baseStyle: {
        letterSpacing: 'tight',
        fontWeight: '700',
      }
    },
    Text: {
        baseStyle: {
            fontSize: 'sm',
        }
    },
    Modal: {
        baseStyle: {
            dialog: {
                bg: 'background.surface',
                borderWidth: '1px',
                borderColor: 'ui.border',
                boxShadow: '2xl',
            }
        }
    }
  },
  breakpoints: {
    sm: '30em',
    md: '48em',
    lg: '62em',
    xl: '80em',
    '2xl': '96em',
  },
});

export default theme;
