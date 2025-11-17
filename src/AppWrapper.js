// CÓDIGO COMPLETO E CORRIGIDO PARA: src/AppWrapper.js
// (Garante a barra final no redirect_uri para compatibilidade com o Google OAuth Policy)

import React, { useState, useEffect } from 'react';
import { CircularProgress, Box, Button, Typography, Container, Alert } from '@mui/material';
import App from './App';
import Header from './components/Header';
import { loginWithGoogle } from './services/api';
import { useChatStore } from './store/chatStore';

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
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  
  // --- INÍCIO DO CÓDIGO (mantido) ---
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { apiToken, userEmail } = await getStoredAuth();
      if (apiToken && userEmail) {
        setApiToken(apiToken);
        setUserEmail(userEmail);
      }
      setIsLoadingAuth(false);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    const unsub = useChatStore.persist.onFinishHydration(() => {
      console.log("AppWrapper: Hidratação do chat concluída.");
      setIsHydrated(true);
    });

    if (useChatStore.persist.hasHydrated()) {
      console.log("AppWrapper: Chat já estava hidratado.");
      setIsHydrated(true);
    }
    
    return () => {
      unsub(); 
    };
  }, []);
  // --- FIM DO CÓDIGO (mantido) ---

  // Lógica de Login com launchWebAuthFlow (COM CORREÇÃO DA BARRA FINAL)
  const handleLogin = () => {
    if (!window.chrome || !chrome.identity) {
      setAuthError("API de Identidade do Chrome não encontrada.");
      return;
    }
    setIsLoadingAuth(true); 
    setAuthError(null);

    // 1. Definição dos parâmetros (USE SEU NOVO CLIENT_ID AQUI)
    const CLIENT_ID = '831244530124-1tj2rcn85vtial9t1o8nrpaskm959362.apps.googleusercontent.com'; // <--- SUBSTITUA AQUI
    const SCOPES = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ]; 
    
    // CORREÇÃO CRÍTICA: Garantir a barra final no URI de redirecionamento
    const REDIRECT_URI_BASE = chrome.identity.getRedirectURL();
    const REDIRECT_URI = REDIRECT_URI_BASE.endsWith('/') ? REDIRECT_URI_BASE : REDIRECT_URI_BASE + '/';


    // 2. Construção da URL de autorização (Implicit Flow para Access Token)
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${CLIENT_ID}&` +
      `response_type=token&` + 
      `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` + // <--- USA A URI CORRIGIDA
      `scope=${encodeURIComponent(SCOPES.join(' '))}`;

    // 3. Chamada de launchWebAuthFlow
    chrome.identity.launchWebAuthFlow({ url: authUrl, interactive: true }, async (responseUrl) => {
      
      if (chrome.runtime.lastError || !responseUrl) {
        setAuthError("Falha no login com Google: " + (chrome.runtime.lastError?.message || "Usuário cancelou."));
        setIsLoadingAuth(false);
        return;
      }
      
      // 4. Extração do Access Token da URL de redirecionamento
      // Verifica se a URL retornada contém a seção de fragmento (Implicit Flow)
      const fragment = responseUrl.split('#')[1];
      if (!fragment) {
           setAuthError("Resposta inválida do Google. Certifique-se de que o response_type=token foi usado.");
           setIsLoadingAuth(false);
           return;
      }
      const params = new URLSearchParams(fragment);
      const accessToken = params.get('access_token');
      
      if (!accessToken) {
        setAuthError("Falha ao obter Access Token da resposta do Google.");
        setIsLoadingAuth(false);
        return;
      }

      // 5. Enviar Access Token para o backend para troca por API Key (Login)
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
      } finally {
        setIsLoadingAuth(false);
      }
    });
  };

  const handleLogout = () => {
    if (window.chrome && chrome.identity) {
      console.log("Logout: Limpando tokens locais.");
    }
    useChatStore.getState().clearChat();
    setStoredAuth(null, null); 
    setApiToken(null);
    setUserEmail(null);
  };
  // --- Fim (handleLogin, handleLogout) ---

  if ((isLoadingAuth || !isHydrated) && !authError) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <>
      {!apiToken ? (
        <LoginScreen 
          onLoginClick={handleLogin} 
          error={authError}
          isLoading={isLoadingAuth}
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