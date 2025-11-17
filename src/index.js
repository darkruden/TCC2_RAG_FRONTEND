// CÓDIGO COMPLETO PARA: src/index.js
// (Remove a biblioteca @react-oauth/google)

import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import { GoogleOAuthProvider } from '@react-oauth/google'; // <-- REMOVIDO
import theme from './theme';
import AppWrapper from './AppWrapper'; // <-- Aponta para o AppWrapper

const queryClient = new QueryClient();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* O GoogleOAuthProvider foi removido daqui */}
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppWrapper />
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);