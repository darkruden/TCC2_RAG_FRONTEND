// NOVO ARQUIVO: src/components/Login.js
// (Tela de login com o botão do Google)

import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { Box, Typography, Container, Alert, CircularProgress } from '@mui/material';
import Header from './Header'; // Reutiliza seu componente Header
import { loginWithGoogle } from '../services/api'; // A nova função que criaremos

const Login = ({ onLoginSuccess }) => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async (credentialResponse) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 1. O Google nos dá um 'credential' (token JWT)
      const credential = credentialResponse.credential;
      
      // 2. Enviamos esse token para o nosso backend (/api/auth/google)
      const { api_key, email } = await loginWithGoogle(credential);
      
      // 3. Se o backend validar e nos retornar nossa API key pessoal...
      if (api_key) {
        // 4. ...nós chamamos o callback do AppWrapper para salvar o token e logar
        onLoginSuccess(api_key, email);
      } else {
        setError("Falha no login. O backend não retornou uma API key.");
      }
      
    } catch (err) {
      console.error("Erro no handleGoogleLogin:", err);
      setError(err.detail || err.message || "Erro desconhecido ao tentar logar.");
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    console.error("Erro no popup de login do Google.");
    setError("Não foi possível conectar com o Google. Verifique popups bloqueados.");
  };

  return (
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
      <Header />
      
      <Typography variant="h6" gutterBottom>
        Login Necessário
      </Typography>
      <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
        Faça login com sua conta Google para começar a analisar repositórios.
      </Typography>
      
      {isLoading ? (
        <CircularProgress />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          <GoogleLogin
            onSuccess={handleGoogleLogin}
            onError={handleGoogleError}
            useOneTap // Tenta logar automaticamente se o usuário já estiver logado no Google
          />
          
          {error && (
            <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
              {error}
            </Alert>
          )}
        </Box>
      )}
    </Container>
  );
};

export default Login;