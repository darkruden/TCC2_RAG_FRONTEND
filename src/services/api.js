// CÓDIGO COMPLETO PARA: src/services/api.js
// (Refatorado para Streaming)

import axios from 'axios';

// (NOTA: O apiClient agora é criado no App.js e passado como argumento)

export const testarConexao = async (apiClient) => {
  const { data } = await apiClient.get('/health');
  return data;
};

/**
 * Envia o prompt inicial para o Roteador de Intenção.
 * @param {axios.AxiosInstance} apiClient O cliente axios
 * @param {string} prompt O prompt do usuário
 * @param {File | null} file Opcional: Um arquivo
 * @returns {Promise<object>} A *resposta do roteador* (ex: { response_type: 'stream_answer', ... })
 */
export const iniciarChat = async (apiClient, prompt, file) => {
  try {
    let data;
    if (file) {
      // Rota de Upload de Arquivo
      const formData = new FormData();
      formData.append('prompt', prompt);
      formData.append('arquivo', file);
      ({ data } = await apiClient.post('/api/chat_file', formData));
    } else {
      // Rota de Texto
      ({ data } = await apiClient.post('/api/chat', { prompt: prompt }));
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
 * @param {string} apiToken O token de API
 * @param {string} apiUrl A URL da API
 * @param {function(string)} onToken Recebe cada token de texto
 * @param {function()} onComplete Chamado quando o stream termina
 * @param {function(Error)} onError Chamado em caso de erro
 */
export const fetchChatStream = async ({
  streamArgs,
  apiToken,
  apiUrl,
  onToken,
  onComplete,
  onError,
}) => {
  console.log("Iniciando fetchChatStream...");
  
  try {
    const response = await fetch(`${apiUrl}/api/chat_stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiToken,
      },
      body: streamArgs, // 'message' do /api/chat (que é um JSON.stringify)
    });

    if (!response.ok) {
      throw new Error(`Erro de rede: ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');

    // Loop de leitura do stream
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        console.log("Stream concluído.");
        onComplete(); // Avisa que terminou
        break;
      }
      
      const chunk = decoder.decode(value);
      onToken(chunk); // Envia o token para o store
    }

  } catch (error) {
    console.error("Erro no fetchChatStream:", error);
    onError(error);
  }
};