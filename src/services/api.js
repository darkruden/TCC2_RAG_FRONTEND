// CÓDIGO COMPLETO E ATUALIZADO PARA: src/services/api.js
// (Força o API_URL para o Heroku)

import axios from 'axios';

// --- INÍCIO DA CORREÇÃO ---
// Removemos a verificação 'process.env.REACT_APP_API_URL'
// para garantir que o build da extensão *sempre* aponte para o Heroku.
const API_URL = 'https://meu-tcc-testes-041c1dd46d1d.herokuapp.com';
// --- FIM DA CORREÇÃO ---


/**
 * Cria uma instância do cliente Axios com a API Key pessoal.
 * @param {string} apiToken O token (API Key) pessoal do usuário
 * @returns {axios.AxiosInstance}
 */
export const createApiClient = (apiToken) => {
  return axios.create({
    baseURL: API_URL, // <-- Agora usa a URL correta
    headers: { 'X-API-Key': apiToken },
    timeout: 60000 
  });
};

/**
 * Envia o Access Token (vindo do chrome.identity) para o backend.
 * @param {string} accessToken O token obtido do chrome.identity.getAuthToken
 * @returns {Promise<object>} Retorna { api_key, email, nome }
 */
export const loginWithGoogle = async (accessToken) => {
  try {
    const { data } = await axios.post(
      `${API_URL}/api/auth/google`, // <-- Agora usa a URL correta
      { credential: accessToken } 
    );
    return data;
  } catch (error) {
    console.error("Erro no login Google:", error);
    throw error.response?.data || new Error(error.message);
  }
};

/**
 * Testa a conexão com o /health usando um cliente autenticado.
 */
export const testarConexao = async (apiClient) => {
  const { data } = await apiClient.get('/health');
  return data;
};

/**
 * Envia o histórico de mensagens para o Roteador de Intenção.
 */
export const iniciarChat = async (apiClient, messages, prompt, file) => {
  try {
    let data;
    const messages_json = JSON.stringify(messages); 

    if (file) {
      const formData = new FormData();
      formData.append('prompt', prompt);
      formData.append('arquivo', file);
      formData.append('messages_json', messages_json);
      ({ data } = await apiClient.post('/api/chat_file', formData));
    } else {
      ({ data } = await apiClient.post('/api/chat', { messages: messages }));
    }
    return data;
    
  } catch (error) {
    console.error("Erro em iniciarChat:", error);
    throw error.response?.data || new Error(error.message);
  }
};

// --- INÍCIO DA ADIÇÃO ---

/**
 * Busca os agendamentos ativos do usuário.
 * @param {axios.AxiosInstance} apiClient O cliente axios autenticado
 * @returns {Promise<Array<object>>} Lista de agendamentos
 */
export const getSchedules = async (apiClient) => {
  try {
    const { data } = await apiClient.get('/api/schedules');
    return data;
  } catch (error) {
    console.error("Erro ao buscar agendamentos:", error);
    throw error.response?.data || new Error(error.message);
  }
};

/**
 * Deleta um agendamento específico.
 * @param {axios.AxiosInstance} apiClient O cliente axios autenticado
 * @param {string} scheduleId O ID do agendamento a ser deletado
 * @returns {Promise<void>}
 */
export const deleteSchedule = async (apiClient, scheduleId) => {
  try {
    await apiClient.delete(`/api/schedules/${scheduleId}`);
  } catch (error) {
    console.error("Erro ao deletar agendamento:", error);
    throw error.response?.data || new Error(error.message);
  }
};
// --- FIM DA ADIÇÃO ---

/**
 * Conecta-se ao endpoint de streaming.
 */
export const fetchChatStream = async ({
  streamArgs,
  apiToken,
  onToken,
  onSources,
  onComplete,
  onError,
}) => {
  console.log("Iniciando fetchChatStream...");
  
  try {
    // Usa a URL direta para garantir
    const response = await fetch(`https://meu-tcc-testes-041c1dd46d1d.herokuapp.com/api/chat_stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiToken,
      },
      body: streamArgs,
    });

    if (!response.ok) {
      const errorBody = await response.json();
      throw new Error(errorBody.detail || `Erro de rede: ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    
    let buffer = "";
    let sourcesParsed = false;
    const DELIMITER = "[[SOURCES_END]]";

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        console.log("Stream concluído.");
        onComplete();
        break;
      }
      
      const chunk = decoder.decode(value, { stream: true });
      
      if (!sourcesParsed) {
        buffer += chunk;
        // Verifica se o delimitador chegou
        if (buffer.includes(DELIMITER)) {
            // Renomeado para evitar conflito de variáveis
            const streamParts = buffer.split(DELIMITER);
            const jsonPart = streamParts[0];
            const textPart = streamParts[1] || ""; 
            
            // 1. Tenta parsear e enviar as fontes
            try {
                const sources = JSON.parse(jsonPart);
                if (onSources) onSources(sources);
            } catch (e) {
                console.error("Erro ao parsear fontes do stream:", e);
            }
            
            // 2. Envia o texto que sobrou imediatamente
            onToken(textPart);
            
            sourcesParsed = true;
            buffer = ""; // Limpa buffer
        }
      } else {
        // Se já parseamos as fontes, tudo que vier é texto puro
        onToken(chunk);
      }
    }

  } catch (error) {
    console.error("Erro no fetchChatStream:", error);
    onError(error);
  }
};