// src/services/api.js
import axios from 'axios';

async function getConfig() {
  // lê as configs salvas pela extensão
  const { apiUrl, apiToken } = await chrome.storage.local.get(['apiUrl', 'apiToken']);
  return {
    apiUrl: apiUrl || 'https://protected-ridge-40630-cca6313c2003.herokuapp.com',
    apiToken: apiToken || 'testebrabotoken'
  };
}

async function client() {
  const { apiUrl, apiToken } = await getConfig();
  return axios.create({
    baseURL: apiUrl,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiToken
    },
    timeout: 30000
  });
}

export const testarConexao = async () => {
  const c = await client();
  const { data } = await c.get('/health');
  return data;
};

export const consultarAPI = async (dados) => {
  const c = await client();
  const { data } = await c.post('/api/consultar', dados);
  return data;
};

export const gerarRelatorio = async (dados) => {
  const c = await client();
  const { data } = await c.post('/api/relatorio', dados);
  return data;
};

export const extrairInfoRepositorio = () => {
  const url = window.location.href;
  const m = url.match(/github\.com\/([^\/]+\/[^\/]+)/);
  if (m && m[1]) return { repositorio: m[1], url };
  throw new Error('Não foi possível identificar o repositório');
};
