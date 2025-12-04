import { createTheme, alpha } from '@mui/material/styles';

const basePalette = {
  primary: {
    main: '#2563eb',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#7c3aed',
    contrastText: '#ffffff',
  },
  success: {
    main: '#16a34a',
  },
  warning: {
    main: '#f59e0b',
  },
  error: {
    main: '#dc2626',
  },
  info: {
    main: '#0ea5e9',
  },
};

const typography = {
  fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  h4: {
    fontWeight: 600,
    letterSpacing: '-0.01em',
  },
  h6: {
    fontWeight: 600,
    letterSpacing: '-0.01em',
  },
  subtitle1: {
    fontWeight: 500,
  },
  body1: {
    fontSize: 14,
  },
  body2: {
    fontSize: 13,
    color: 'inherit',
  },
  caption: {
    fontSize: 12,
    color: 'inherit',
  },
};

const shape = {
  borderRadius: 12,
};

const shadows = Array(25).fill('none').map((_, index) => {
  if (index === 0) return 'none';
  return `0px ${Math.ceil(index / 3)}px ${index * 2}px ${alpha('#111827', 0.08)}`;
});

export const createAppTheme = (mode = 'light') => {
  const isDark = mode === 'dark';

  const palette = {
    mode,
    ...basePalette,
    background: {
      default: isDark ? '#0f172a' : '#f5f7fb',
      paper: isDark ? '#111827' : '#ffffff',
      subtle: isDark ? alpha('#1e293b', 0.6) : '#f1f5f9',
    },
    text: {
      primary: isDark ? '#e2e8f0' : '#0f172a',
      secondary: isDark ? alpha('#e2e8f0', 0.7) : '#475569',
      disabled: isDark ? alpha('#e2e8f0', 0.45) : '#94a3b8',
    },
    divider: isDark ? alpha('#64748b', 0.4) : alpha('#0f172a', 0.08),
  };

  return createTheme({
    palette,
    typography,
    shape,
    shadows,
    spacing: 8,
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundImage: 'none',
            minHeight: '100vh',
          },
          '::selection': {
            backgroundColor: alpha(basePalette.primary.main, 0.25),
          },
        },
      },
      MuiAppBar: {
        defaultProps: {
          elevation: 0,
        },
        styleOverrides: {
          root: {
            backgroundColor: palette.background.paper,
            color: palette.text.primary,
            borderBottom: `1px solid ${palette.divider}`,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: palette.background.paper,
            borderRight: `1px solid ${palette.divider}`,
          },
        },
      },
      MuiCard: {
        defaultProps: {
          elevation: 0,
        },
        styleOverrides: {
          root: {
            borderRadius: shape.borderRadius,
            border: `1px solid ${palette.divider}`,
            boxShadow: '0 1px 2px rgba(15, 23, 42, 0.08)',
          },
        },
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            borderRadius: 10,
            textTransform: 'none',
            fontWeight: 600,
            letterSpacing: '0.01em',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 999,
            fontWeight: 500,
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? alpha('#1e293b', 0.9) : palette.background.subtle,
            '& .MuiTableCell-head': {
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontSize: 12,
            },
          },
        },
      },
      MuiTooltip: {
        defaultProps: {
          arrow: true,
        },
      },
    },
  });
};

export default createAppTheme;

