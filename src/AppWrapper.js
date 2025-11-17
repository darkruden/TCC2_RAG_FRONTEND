// CÓDIGO COMPLETO E ATUALIZADO PARA: src/AppWrapper.js
// (Adiciona verificação de hidratação do Zustand)

import React, { useState, useEffect } from 'react';
import { CircularProgress, Box, Button, Typography, Container, Alert } from '@mui/material';
import App from './App';
import Header from './components/Header';
import { loginWithGoogle } from './services/api';
import { useChatStore } from './store/chatStore'; // <-- 1. Importar o store

// --- Funções Helper de Storage (Sem alterações) ---
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

// --- Tela de Login Nativa (Sem alterações) ---
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
  const [isLoadingAuth, setIsLoadingAuth] = useState(true); // <-- Renomeado
  const [authError, setAuthError] = useState(null);
  
  // --- INÍCIO DA ATUALIZAÇÃO ---
  // 2. Estado de hidratação do Zustand
  const [isHydrated, setIsHydrated] = useState(false);

  // 3. Efeito para verificar o Auth
  useEffect(() => {
    const checkAuth = async () => {
      const { apiToken, userEmail } = await getStoredAuth();
      if (apiToken && userEmail) {
        setApiToken(apiToken);
        setUserEmail(userEmail);
      }
      setIsLoadingAuth(false); // <-- Só termina o loading do auth
    };
    checkAuth();
  }, []);

  // 4. Efeito para verificar a Hidratação do Zustand
  useEffect(() => {
    // A persistência do Zustand é assíncrona.
    // Precisamos esperar o 'onFinishHydration' para ter certeza
    // que o histórico de chat foi carregado do chrome.storage.
    const unsub = useChatStore.persist.onFinishHydration(() => {
      setIsHydrated(true);
    });

    // Se já estiver hidratado (cache), define como true
    if (useChatStore.persist.hasHydrated()) {
      setIsHydrated(true);
    }
    
    return () => {
      unsub(); // Limpa a inscrição
    };
  }, []);
  // --- FIM DA ATUALIZAÇÃO ---

  // (handleLogin e handleLogout não mudam)
  const handleLogin = () => {
    if (!window.chrome || !chrome.identity) {
      setAuthError("API de Identidade do Chrome não encontrada. Isso funciona apenas na extensão.");
      return;
    }
    setIsLoading(true);
    setAuthError(null);
    chrome.identity.getAuthToken({ interactive: true }, async (accessToken) => {
      if (chrome.runtime.lastError || !accessToken) {
        console.error(chrome.runtime.lastError);
        setAuthError("Falha ao obter token do Google: " + (chrome.runtime.lastError?.message || "Usuário cancelou."));
        setIsLoading(false);
        return;
      }
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
  // --- Fim (handleLogin, handleLogout) ---

  // 5. O Loading principal agora espera por AMBOS
  if ((isLoadingAuth || !isHydrated) && !authError) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // 6. Renderiza o Login ou o App principal
  return (
    <>
      {!apiToken ? (
        <LoginScreen 
          onLoginClick={handleLogin} 
          error={authError}
          isLoading={isLoadingAuth} // O loading do login só depende do auth
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