// CÓDIGO COMPLETO E ATUALIZADO PARA: src/services/api.js
// (Refatorado para Auth com chrome.identity e Memória de Chat)

import axios from 'axios';

// URL base do seu backend
const API_URL = process.env.REACT_APP_API_URL || 'https://meu-tcc-testes-041c1dd46d1d.herokuapp.com';

/**
 * Cria uma instância do cliente Axios com a API Key pessoal.
 * @param {string} apiToken O token (API Key) pessoal do usuário
 * @returns {axios.AxiosInstance}
 */
export const createApiClient = (apiToken) => {
  return axios.create({
    baseURL: API_URL,
    headers: { 'X-API-Key': apiToken },
    timeout: 60000 
  });
};

/**
 * (FUNÇÃO DE LOGIN ATUALIZADA)
 * Envia o Access Token (vindo do chrome.identity) para o backend.
 * @param {string} accessToken O token obtido do chrome.identity.getAuthToken
 * @returns {Promise<object>} Retorna { api_key, email, nome }
 */
export const loginWithGoogle = async (accessToken) => {
  try {
    // Usa um cliente axios simples, pois não temos a X-API-Key ainda
    const { data } = await axios.post(
      `${API_URL}/api/auth/google`, 
      { credential: accessToken } // O backend espera 'credential'
    );
    return data;
  } catch (error) {
    console.error("Erro no login Google:", error);
    throw error.response?.data || new Error(error.message);
  }
};

/**
 * Testa a conexão com o /health usando um cliente autenticado.
 * @param {axios.AxiosInstance} apiClient O cliente axios JÁ AUTENTICADO
 */
export const testarConexao = async (apiClient) => {
  const { data } = await apiClient.get('/health');
  return data;
};

/**
 * (FUNÇÃO DE CHAT ATUALIZADA)
 * Envia o histórico de mensagens para o Roteador de Intenção.
 * @param {axios.AxiosInstance} apiClient O cliente axios autenticado
 * @param {Array<Object>} messages O histórico de mensagens
 * @param {string} prompt O prompt *atual* do usuário (para upload de arquivo)
 * @param {File | null} file Opcional: Um arquivo
 * @returns {Promise<object>} A *resposta do roteador*
 */
export const iniciarChat = async (apiClient, messages, prompt, file) => {
  try {
    let data;
    const messages_json = JSON.stringify(messages); 

    if (file) {
      // Rota de Upload de Arquivo
      const formData = new FormData();
      formData.append('prompt', prompt);
      formData.append('arquivo', file);
      formData.append('messages_json', messages_json);
      ({ data } = await apiClient.post('/api/chat_file', formData));
    } else {
      // Rota de Texto (envia o histórico completo)
      ({ data } = await apiClient.post('/api/chat', { messages: messages }));
    }
    return data;
    
  } catch (error) {
    console.error("Erro em iniciarChat:", error);
    throw error.response?.data || new Error(error.message);
  }
};

/**
 * Conecta-se ao endpoint de streaming e atualiza o chat.
 * @param {object} streamArgs Argumentos da resposta 'stream_answer'
 * @param {string} apiToken O token de API pessoal
 * @param {function(string)} onToken Recebe cada token de texto
 * @param {function()} onComplete Chamado quando o stream termina
 * @param {function(Error)} onError Chamado em caso de erro
 */
export const fetchChatStream = async ({
  streamArgs,
  apiToken,
  onToken,
  onComplete,
  onError,
}) => {
  console.log("Iniciando fetchChatStream...");
  
  try {
    const response = await fetch(`${API_URL}/api/chat_stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiToken,
      },
      body: streamArgs, // 'message' do /api/chat (que é um JSON.stringify)
    });

    if (!response.ok) {
      const errorBody = await response.json();
      throw new Error(errorBody.detail || `Erro de rede: ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        console.log("Stream concluído.");
        onComplete();
        break;
      }
      
      const chunk = decoder.decode(value);
      onToken(chunk);
    }

  } catch (error) {
    console.error("Erro no fetchChatStream:", error);
    onError(error);
  }
};