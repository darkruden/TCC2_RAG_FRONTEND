// CRIE ESTE NOVO ARQUIVO EM: src/AppWrapper.js

import React, { useState, useEffect } from 'react';
import { CircularProgress, Box } from '@mui/material';
import App from './App'; // Seu chat
import Login from './components/Login'; // Nossa nova tela de login

// Esta é uma função helper para nosso armazenamento híbrido
// (baseado no seu chatStore.js)
const getStoredAuth = () => {
  return new Promise((resolve) => {
    if (window.chrome && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['apiToken', 'userEmail'], (result) => {
        resolve(result || {});
      });
    } else {
      // Fallback para dev local
      resolve({
        apiToken: localStorage.getItem('apiToken'),
        userEmail: localStorage.getItem('userEmail'),
      });
    }
  });
};

// Esta é a função que salva o token após o login
const setStoredAuth = (token, email) => {
  if (window.chrome && chrome.storage && chrome.storage.local) {
    chrome.storage.local.set({ apiToken: token, userEmail: email });
  } else {
    localStorage.setItem('apiToken', token);
    localStorage.setItem('userEmail', email);
  }
};


function AppWrapper() {
  const [apiToken, setApiToken] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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

  // 2. Callback que será chamada pela tela de Login
  const handleLoginSuccess = (token, email) => {
    setStoredAuth(token, email);
    setApiToken(token);
    setUserEmail(email);
  };
  
  // 3. Callback para Logout
  const handleLogout = () => {
    // Limpa o storage
    setStoredAuth(null, null); 
    setApiToken(null);
    setUserEmail(null);
  };

  if (isLoading) {
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
        <Login onLoginSuccess={handleLoginSuccess} />
      ) : (
        // Passa o token e o email para o App.js e o Header
        <App 
          apiToken={apiToken} 
          userEmail={userEmail}
          onLogout={handleLogout} // Passa a função de logout
        />
      )}
    </>
  );
}

export default AppWrapper;