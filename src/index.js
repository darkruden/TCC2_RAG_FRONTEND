// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// 1. Importar provedores e tema do MUI
import { Experimental_CssVarsProvider as CssVarsProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme'; // Vamos criar este arquivo a seguir

// NOTA: A importação de 'index.css' foi removida.

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* 2. Envolver o App com os provedores do MUI */}
    <CssVarsProvider theme={theme}>
      <CssBaseline /> {/* 'Reseta' o CSS e aplica o fundo (corrige tela branca) */}
      <App />
    </CssVarsProvider>
  </React.StrictMode>
);