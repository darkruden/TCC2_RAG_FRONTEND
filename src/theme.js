// src/theme.js
import { extendTheme } from '@mui/material/styles';

// Define as cores do seu tema para os modos light e dark
const theme = extendTheme({
  colorSchemes: {
    light: {
      palette: {
        primary: {
          main: '#0366d6', // Azul GitHub (Light)
        },
        secondary: {
          main: '#2ea44f', // Verde GitHub (Light)
        },
      },
    },
    dark: {
      palette: {
        primary: {
          main: '#58a6ff', // Azul GitHub (Dark)
        },
        secondary: {
          main: '#3fb950', // Verde GitHub (Dark)
        },
        // Define os fundos para o modo escuro
        background: {
          default: '#0d1117',
          paper: '#161b22',
        }
      },
    },
  },
});

export default theme;