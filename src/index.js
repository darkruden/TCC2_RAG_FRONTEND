// CÓDIGO COMPLETO PARA: src/index.js
// (Atualizado com GoogleOAuthProvider)

import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google'; // <-- 1. Importar
import theme from './theme';
import AppWrapper from './AppWrapper'; // <-- 2. Mudar de App para AppWrapper

// 3. Obtenha seu Client ID (o mesmo que você colocou no Heroku)
const GOOGLE_CLIENT_ID = "SEU_GOOGLE_CLIENT_ID_AQUI"; 

const queryClient = new QueryClient();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* 4. Envolver tudo com o Provider */}
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {/* 5. Renderizar o AppWrapper */}
          <AppWrapper />
        </ThemeProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);