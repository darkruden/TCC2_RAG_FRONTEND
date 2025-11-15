// CÓDIGO COMPLETO PARA: src/services/api.js
// (Adicionada a função 'enviarMensagemComArquivo')

import axios from 'axios';

// --- FUNÇÃO HELPER DE CONFIGURAÇÃO (NÃO MUDA) ---
export async function getConfig() {
  if (window.chrome && window.chrome.storage) {
    const { apiUrl, apiToken } = await chrome.storage.local.get(['apiUrl', 'apiToken']);
    return {
      apiUrl: apiUrl || [cite_start]'https://protected-ridge-40630-cca6313c2003.herokuapp.com', [cite: 7]
      apiToken: apiToken || [cite_start]'testebrabotoken' [cite: 7]
    };
  } else {
    return {
      [cite_start]apiUrl: 'https://protected-ridge-40630-cca6313c2003.herokuapp.com', [cite: 7]
      [cite_start]apiToken: 'testebrabotoken' [cite: 7]
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
// (Sem alterações)
export const enviarMensagemChat = async (prompt) => {
  try {
    const c = await client();
    const { data } = await c.post('/api/chat', { prompt: prompt });
    return data;
  } catch (error) {
    console.error("Erro em enviarMensagemChat:", error);
    throw error.response?.data || new Error(error.message);
  }
};

// --- NOVA FUNÇÃO DE CHAT (ARQUIVO) ---
/**
 * Envia um prompt E um arquivo para um endpoint de chat de upload.
 * @param {string} prompt O texto do usuário.
 * @param {File} file O objeto de arquivo.
 * @returns {Promise<object>} A resposta do roteador de intenção (ChatResponse)
 */
export const enviarMensagemComArquivo = async (prompt, file) => {
  try {
    const c = await client();
    
    // FormData é necessário para 'multipart/form-data'
    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('arquivo', file);

    // Chama o novo endpoint /api/chat_file
    const { data } = await c.post('/api/chat_file', formData, {
      // Axios detectará 'FormData' e definirá o Content-Type correto
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