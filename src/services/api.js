// CÓDIGO COMPLETO PARA: src/services/api.js
// (Atualizado para apontar para o app de testes do Heroku)

import axios from 'axios';

// --- FUNÇÃO HELPER DE CONFIGURAÇÃO (ATUALIZADA) ---
export async function getConfig() {
  if (window.chrome && window.chrome.storage) {
    const { apiUrl, apiToken } = await chrome.storage.local.get(['apiUrl', 'apiToken']);
    return {
      // --- MUDANÇA AQUI ---
      apiUrl: apiUrl || 'https://meu-tcc-testes-041c1dd46d1d.herokuapp.com',
      apiToken: apiToken || 'testebrabotoken' // (Mantém o mesmo token de fallback)
    };
  } else {
    // Fallback para dev local
    return {
      // --- E MUDANÇA AQUI ---
      apiUrl: 'https://meu-tcc-testes-041c1dd46d1d.herokuapp.com',
      apiToken: 'testebrabotoken'
    };
  }
}

// --- CLIENTE AXIOS (NÃO MUDA) ---
async function client() {
  const { apiUrl, apiToken } = await getConfig();
  return axios.create({
    baseURL: apiUrl,
    headers: {
      'X-API-Key': apiToken
    },
    timeout: 60000 
  });
}

// --- FUNÇÃO DE CHAT (TEXTO) ---
export const enviarMensagemChat = async (prompt) => {
  try {
    const c = await client();
    // (O endpoint é relativo, então /api/chat está correto)
    const { data } = await c.post('/api/chat', { prompt: prompt });
    return data;
  } catch (error) {
    console.error("Erro em enviarMensagemChat:", error);
    throw error.response?.data || new Error(error.message);
  }
};

// --- FUNÇÃO DE CHAT (ARQUIVO) ---
export const enviarMensagemComArquivo = async (prompt, file) => {
  try {
    const c = await client();
    
    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('arquivo', file);

    // (O endpoint é relativo, /api/chat_file está correto)
    const { data } = await c.post('/api/chat_file', formData, {
      // Axios definirá o Content-Type
    });
    return data;
  } catch (error) {
    console.error("Erro em enviarMensagemComArquivo:", error);
    throw error.response?.data || new Error(error.message);
  }
};


// --- FUNÇÕES DE POLLING (NÃO MUDAM) ---
export const getReportStatus = async (jobId) => {
  try {
    const c = await client();
    const { data } = await c.get(`/api/relatorio/status/${jobId}`);
    return data;
  } catch (error) {
    console.error("Erro em getReportStatus:", error);
    throw error.response?.data || new Error(error.message);
  }
};

export const getIngestStatus = async (jobId) => {
  try {
    const c = await client();
    const { data } = await c.get(`/api/ingest/status/${jobId}`);
    return data; 
  } catch (error) {
    console.error("Erro em getIngestStatus:", error);
    throw error.response?.data || new Error(error.message);
  }
};

// --- FUNÇÃO DE TESTE (NÃO MUDA) ---
export const testarConexao = async () => {
  const c = await client();
  const { data } = await c.get('/health');
  return data;
};