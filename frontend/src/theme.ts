import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
};

const theme = extendTheme({
  config,
  styles: {
    global: (props: { colorMode: string }) => ({
      body: {
        bg: props.colorMode === 'dark' ? 'gray.900' : 'gray.50',
        color: props.colorMode === 'dark' ? 'white' : 'gray.800',
      },
    }),
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'blue',
      },
      baseStyle: {
        fontWeight: 'semibold',
        borderRadius: 'lg',
        _hover: {
          transform: 'translateY(-2px)',
          boxShadow: 'lg',
        },
      },
    },
    Card: {
      baseStyle: (props: { colorMode: string }) => ({
        container: {
          bg: props.colorMode === 'dark' ? 'gray.800' : 'white',
          borderRadius: 'lg',
          boxShadow: 'lg',
          p: 4,
        },
      }),
    },
    Input: {
      defaultProps: {
        focusBorderColor: 'blue.400',
      },
      variants: {
        filled: (props: { colorMode: string }) => ({
          field: {
            bg: props.colorMode === 'dark' ? 'whiteAlpha.50' : 'gray.100',
            _hover: {
              bg: props.colorMode === 'dark' ? 'whiteAlpha.100' : 'gray.200',
            },
            _focus: {
              bg: props.colorMode === 'dark' ? 'whiteAlpha.100' : 'gray.200',
            },
          },
        }),
      },
    },
    Select: {
      variants: {
        filled: (props: { colorMode: string }) => ({
          field: {
            bg: props.colorMode === 'dark' ? 'whiteAlpha.50' : 'gray.100',
            _hover: {
              bg: props.colorMode === 'dark' ? 'whiteAlpha.100' : 'gray.200',
            },
          },
        }),
      },
    },
  },
  colors: {
    brand: {
      50: '#E3F2FD',
      100: '#BBDEFB',
      200: '#90CAF9',
      300: '#64B5F6',
      400: '#42A5F5',
      500: '#2196F3',
      600: '#1E88E5',
      700: '#1976D2',
      800: '#1565C0',
      900: '#0D47A1',
    },
  },
  breakpoints: {
    sm: '30em',    // 480px
    md: '48em',    // 768px
    lg: '62em',    // 992px
    xl: '80em',    // 1280px
    '2xl': '96em', // 1536px
  },
});

export default theme; 