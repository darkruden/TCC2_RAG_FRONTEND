// CÓDIGO COMPLETO PARA: src/AppWrapper.js
// (Implementa o fluxo chrome.identity)

import React, { useState, useEffect } from 'react';
import { CircularProgress, Box, Button, Typography, Container, Alert } from '@mui/material';
import App from './App';
import Header from './components/Header';
import { loginWithGoogle } from './services/api';

// --- Funções Helper de Storage ---
const getStoredAuth = () => {
  return new Promise((resolve) => {
    if (window.chrome && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['apiToken', 'userEmail'], (result) => {
        resolve(result || {});
      });
    } else {
      console.warn("chrome.storage.local não encontrado (rodando em dev?).");
      resolve({});
    }
  });
};

const setStoredAuth = (token, email) => {
  if (window.chrome && chrome.storage && chrome.storage.local) {
    chrome.storage.local.set({ apiToken: token, userEmail: email });
  }
};
// --- Fim dos Helpers ---

// --- Tela de Login Nativa ---
const LoginScreen = ({ onLoginClick, error, isLoading }) => (
  <Container 
    maxWidth="xs"
    sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      height: '100vh',
      p: 3
    }}
  >
    <Header userEmail={null} onLogout={() => {}} /> 
    <Typography variant="h6" gutterBottom>
      Login Necessário
    </Typography>
    <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
      Faça login com sua conta Google para começar a analisar repositórios.
    </Typography>
    
    {isLoading ? (
      <CircularProgress />
    ) : (
      <Button variant="contained" onClick={onLoginClick}>
        Fazer Login com Google
      </Button>
    )}
    {error && (
      <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
        {error}
      </Alert>
    )}
  </Container>
);
// --- Fim da Tela de Login ---


function AppWrapper() {
  const [apiToken, setApiToken] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // 1. Verifica o storage na inicialização
  useEffect(() => {
    const checkAuth = async () => {
      const { apiToken, userEmail } = await getStoredAuth();
      if (apiToken && userEmail) {
        setApiToken(apiToken);
        setUserEmail(userEmail);
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  // 2. Nova função de login (chrome.identity)
  const handleLogin = () => {
    if (!window.chrome || !chrome.identity) {
      setAuthError("API de Identidade do Chrome não encontrada. Isso funciona apenas na extensão.");
      return;
    }
    
    setIsLoading(true);
    setAuthError(null);

    // Esta é a chamada nativa do Chrome
    chrome.identity.getAuthToken({ interactive: true }, async (accessToken) => {
      if (chrome.runtime.lastError || !accessToken) {
        console.error(chrome.runtime.lastError);
        setAuthError("Falha ao obter token do Google: " + (chrome.runtime.lastError?.message || "Usuário cancelou."));
        setIsLoading(false);
        return;
      }

      // 3. Token do Google obtido. Agora, troque pelo nosso token de API pessoal.
      try {
        const { api_key, email } = await loginWithGoogle(accessToken);
        
        if (api_key) {
          setStoredAuth(api_key, email);
          setApiToken(api_key);
          setUserEmail(email);
        } else {
          setAuthError("Falha no login. O backend não retornou uma API key.");
        }
      } catch (err) {
        console.error("Erro no login com backend:", err);
        setAuthError(err.detail || err.message || "Erro desconhecido ao tentar logar.");
        chrome.identity.removeCachedAuthToken({ token: accessToken }, () => {});
      } finally {
        setIsLoading(false);
      }
    });
  };
  
  // 3. Função de Logout
  const handleLogout = () => {
    if (window.chrome && chrome.identity) {
      chrome.identity.getAuthToken({ interactive: false }, (accessToken) => {
        if (accessToken) {
          chrome.identity.removeCachedAuthToken({ token: accessToken }, () => {});
          fetch(`https://accounts.google.com/o/oauth2/revoke?token=${accessToken}`);
        }
      });
    }
    setStoredAuth(null, null); 
    setApiToken(null);
    setUserEmail(null);
  };

  if (isLoading && !authError) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // 4. Renderiza o Login ou o App principal
  return (
    <>
      {!apiToken ? (
        <LoginScreen 
          onLoginClick={handleLogin} 
          error={authError}
          isLoading={isLoading}
        />
      ) : (
        <App 
          apiToken={apiToken} 
          userEmail={userEmail}
          onLogout={handleLogout}
        />
      )}
    </>
  );
}

export default AppWrapper;