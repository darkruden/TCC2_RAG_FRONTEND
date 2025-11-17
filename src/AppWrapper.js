// CÓDIGO COMPLETO E ATUALIZADO PARA: src/AppWrapper.js

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
  
  // --- INÍCIO DA CORREÇÃO ---
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
      setIsLoadingAuth(false);
    };
    checkAuth();
  }, []);

  // 4. Efeito para verificar a Hidratação do Zustand
  useEffect(() => {
    // A persistência do Zustand é assíncrona.
    // Precisamos esperar o 'onFinishHydration' para ter certeza
    // que o histórico de chat foi carregado do chrome.storage.
    const unsub = useChatStore.persist.onFinishHydration(() => {
      console.log("AppWrapper: Hidratação do chat concluída.");
      setIsHydrated(true);
    });

    // Se já estiver hidratado (cache), define como true
    if (useChatStore.persist.hasHydrated()) {
      console.log("AppWrapper: Chat já estava hidratado.");
      setIsHydrated(true);
    }
    
    return () => {
      unsub(); // Limpa a inscrição
    };
  }, []);
  // --- FIM DA CORREÇÃO ---

  // Lógica de Login com launchWebAuthFlow
  const handleLogin = () => {
    if (!window.chrome || !chrome.identity) {
      setAuthError("API de Identidade do Chrome não encontrada.");
      return;
    }
    setIsLoadingAuth(true); // Usamos isLoadingAuth, não isLoading (que não existe)
    setAuthError(null);

    // 1. Definição dos parâmetros
    const CLIENT_ID = '831244530124-rv13ko24si2u8edj23agc4c2greva6nq.apps.googleusercontent.com'; //
    const SCOPES = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ]; //
    const REDIRECT_URI = chrome.identity.getRedirectURL();

    // 2. Construção da URL de autorização (Implicit Flow para Access Token)
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${CLIENT_ID}&` +
      `response_type=token&` + // Pedindo o Access Token diretamente
      `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
      `scope=${encodeURIComponent(SCOPES.join(' '))}`;

    // 3. Chamada de launchWebAuthFlow
    chrome.identity.launchWebAuthFlow({ url: authUrl, interactive: true }, async (responseUrl) => {
      
      if (chrome.runtime.lastError || !responseUrl) {
        setAuthError("Falha no login com Google: " + (chrome.runtime.lastError?.message || "Usuário cancelou."));
        setIsLoadingAuth(false);
        return;
      }
      
      // 4. Extração do Access Token da URL de redirecionamento
      const params = new URLSearchParams(responseUrl.split('#')[1]);
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
      // Como estamos usando launchWebAuthFlow/implicit flow, não há token em cache para remover (getAuthToken)
      // O Access Token foi recebido e imediatamente trocado/usado.
      // O logout do Chrome é mais complexo aqui, mas para fins de TCC
      // basta limpar o armazenamento local e o estado.
      console.log("Logout: Limpando tokens locais.");
    }
    useChatStore.getState().clearChat();
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