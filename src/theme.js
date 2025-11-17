// CÓDIGO COMPLETO PARA: src/theme.js

import { createTheme } from '@mui/material/styles'; 

// Define as cores do seu tema para os modos light e dark
const theme = createTheme({
  palette: {
    mode: 'dark', // Definindo um modo padrão escuro para o Side Panel
    primary: {
      main: '#58a6ff', // Azul GitHub (Dark)
      contrastText: '#0d1117',
    },
    secondary: {
      main: '#3fb950', // Verde GitHub (Dark) para sucesso/jobs
      contrastText: '#0d1117',
    },
    // Define os fundos para o modo escuro
    background: {
      default: '#0d1117',
      paper: '#161b22',
    },
    text: {
        primary: '#c9d1d9', // Texto claro
        secondary: '#8b949e', // Texto sutil
    }
  },
  // Garantimos que todos os componentes MUI respeitem essas cores
  components: {
    MuiPaper: {
        styleOverrides: {
            root: {
                backgroundImage: 'none', // Remove gradientes padrão do MUI
            }
        }
    },
    MuiChip: {
        styleOverrides: {
            root: {
                fontWeight: 'bold',
            }
        }
    }
  }
});

export default theme;