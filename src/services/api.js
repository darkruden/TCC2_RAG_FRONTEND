// CÓDIGO COMPLETO PARA: src/services/api.js
// (Refatorado para React Query - Funções puras)

import axios from 'axios';

// --- ATUALIZADO ---
// A lógica de criar o 'client' e 'getConfig' foi movida para o App.js
// onde o React Query será inicializado.
// Estas agora são apenas funções 'puras' que o React Query usará.

export const testarConexao = async (apiClient) => {
  // Recebe o cliente axios como argumento
  const { data } = await apiClient.get('/health');
  return data;
};

export const enviarMensagemChat = async (apiClient, prompt) => {
  const { data } = await apiClient.post('/api/chat', { prompt: prompt });
  return data;
};

export const enviarMensagemComArquivo = async (apiClient, prompt, file) => {
  const formData = new FormData();
  formData.append('prompt', prompt);
  formData.append('arquivo', file);

  const { data } = await apiClient.post('/api/chat_file', formData);
  return data;
};

// (Funções de Polling não são mais necessárias no frontend,
//  o background.js cuida delas)