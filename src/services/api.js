// CÓDIGO COMPLETO PARA: src/services/api.js
// (Refatorado para a API de Chat Unificada)

import axios from 'axios';

// --- FUNÇÃO HELPER DE CONFIGURAÇÃO (NÃO MUDA) ---
export async function getConfig() {
  if (window.chrome && window.chrome.storage) {
    const { apiUrl, apiToken } = await chrome.storage.local.get(['apiUrl', 'apiToken']);
    return {
      apiUrl: apiUrl || 'https://protected-ridge-40630-cca6313c2003.herokuapp.com',
      apiToken: apiToken || 'testebrabotoken'
    };
  } else {
    // Fallback para dev local
    return {
      apiUrl: 'https://protected-ridge-40630-cca6313c2003.herokuapp.com',
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
      // (Corretamente sem 'Content-Type' padrão)
    },
    timeout: 60000 
  });
}

// --- NOVA FUNÇÃO DE CHAT ---
/**
 * Envia um prompt do usuário para o endpoint de chat unificado.
 * @param {string} prompt O texto do usuário.
 * @returns {Promise<object>} A resposta do roteador de intenção (ChatResponse)
 */
export const enviarMensagemChat = async (prompt) => {
  try {
    const c = await client();
    const { data } = await c.post('/api/chat', { prompt: prompt });
    return data; // Retorna: { response_type, message, job_id, ... }
  } catch (error) {
    console.error("Erro em enviarMensagemChat:", error);
    // Repassa o erro de forma estruturada
    throw error.response?.data || new Error(error.message);
  }
};

// --- FUNÇÕES DE POLLING (NÃO MUDAM) ---
// (Essas funções são essenciais para o novo App.js)

/**
 * Verifica o status de um job de RELATÓRIO.
 */
export const getReportStatus = async (jobId) => {
  try {
    const c = await client();
    const { data } = await c.get(`/api/relatorio/status/${jobId}`);
    return data; // Retorna { status: '...', result: '...', error: '...' }
  } catch (error) {
    console.error("Erro em getReportStatus:", error);
    throw error.response?.data || new Error(error.message);
  }
};

/**
 * Verifica o status de um job de INGESTÃO.
 */
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
/**
 * Verifica a saúde do backend.
 */
export const testarConexao = async () => {
  const c = await client();
  const { data } = await c.get('/health');
  return data;
};