// src/services/api.js
import axios from 'axios';

// 1. A FUNÇÃO getConfig NÃO MUDA
async function getConfig() {
  const { apiUrl, apiToken } = await chrome.storage.local.get(['apiUrl', 'apiToken']);
  return {
    apiUrl: apiUrl || 'https://protected-ridge-40630-cca6313c2003.herokuapp.com',
    apiToken: apiToken || 'testebrabotoken'
  };
}

// 2. O 'client' MUDOU: Removemos o 'Content-Type' padrão.
//    Isso é CRUCIAL. O Axios agora definirá o Content-Type
//    automaticamente (json para texto, multipart/form-data para arquivos).
async function client() {
  const { apiUrl, apiToken } = await getConfig();
  return axios.create({
    baseURL: apiUrl,
    headers: {
      // 'Content-Type': 'application/json', <-- REMOVIDO!
      'X-API-Key': apiToken
    },
    timeout: 60000 // Aumentado para 60s para uploads
  });
}

// 3. testarConexao NÃO MUDA
export const testarConexao = async () => {
  const c = await client();
  const { data } = await c.get('/health');
  return data;
};

// 4. consultarAPI NÃO MUDA
export const consultarAPI = async (dados) => {
  const c = await client();
  const { data } = await c.post('/api/consultar', dados);
  return data;
};

// 5. INÍCIO DAS NOVAS FUNÇÕES E MUDANÇAS

/**
 * NOVA FUNÇÃO: Envia uma consulta via upload de arquivo.
 */
export const consultarPorArquivo = async (repositorio, arquivo) => {
  const c = await client();
  
  // Cria um FormData para enviar o arquivo
  const formData = new FormData();
  formData.append('repositorio', repositorio);
  formData.append('arquivo', arquivo); // O objeto 'File' do input

  // Faz o POST para a nova rota /api/consultar_arquivo
  const { data } = await c.post('/api/consultar_arquivo', formData);
  return data;
};

/**
 * FUNÇÃO ATUALIZADA: gerarRelatorio agora envia o prompt
 * e sabe como lidar com a resposta .html.
 */
export const gerarRelatorio = async (dados) => {
  // 'dados' é: { repositorio: "user/repo", prompt: "..." }
  const c = await client();
  // O backend agora retorna: { "mensagem": "...", "job_id": "..." }
  const { data } = await c.post('/api/relatorio', dados);
  return data; // Retorna o { mensagem, job_id }
};

// --- INÍCIO DA NOVA FUNÇÃO ---
/**
 * NOVA FUNÇÃO: Verifica o status de um job de relatório.
 */
export const getReportStatus = async (jobId) => {
  const c = await client();
  // Chama o novo endpoint de status de relatório
  const { data } = await c.get(`/api/relatorio/status/${jobId}`);
  return data; // Retorna { status: '...', result: '...', error: '...' }
};

// 6. ingestarRepositorio NÃO MUDA
export const ingestarRepositorio = async (dados) => {
  const c = await client();
  const { data } = await c.post('/api/ingest', dados);
  return data;
};

// 7. extrairInfoRepositorio NÃO MUDA
export const extrairInfoRepositorio = () => {
  const url = window.location.href;
  const m = url.match(/github\.com\/([^\/]+\/[^\/]+)/);
  if (m && m[1]) return { repositorio: m[1], url };
  throw new Error('Não foi possível identificar o repositório');
};

// 8. getIngestStatus NÃO MUDA
export const getIngestStatus = async (jobId) => {
  const c = await client();
  const { data } = await c.get(`/api/ingest/status/${jobId}`);
  return data; 
};