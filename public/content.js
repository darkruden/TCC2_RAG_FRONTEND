// CÓDIGO COMPLETO PARA: public/content.js

// Arquivo de conteúdo para simular o script de content da extensão
// Este script será injetado nas páginas do GitHub

// Função para extrair informações do repositório atual
function extrairInfoRepositorio() {
  const url = window.location.href;
  const match = url.match(/github\.com\/([^\/]+\/[^\/]+)/);
  
  if (match && match[1]) {
    return {
      repositorio: match[1],
      url: url
    };
  }
  
  return null;
}

// Comunicar com o background script
try {
  chrome.runtime.sendMessage(
    { action: 'extrairInfoRepositorio', data: extrairInfoRepositorio() },
    (response) => {
      if (chrome.runtime.lastError) {
        // console.warn("Erro ao enviar msg para background:", chrome.runtime.lastError.message);
      } else {
        // console.log('Resposta do background script:', response);
      }
    }
  );
} catch (e) {
  // console.warn("Não foi possível comunicar com o background (provavelmente recarregando).");
}


// Adicionar listener para mensagens do popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getRepositorioInfo') {
    sendResponse(extrairInfoRepositorio());
  }
  // Necessário para sendResponse assíncrono (embora este seja síncrono)
  return false; 
});

console.log('GitHub RAG Extension - Content script inicializado');