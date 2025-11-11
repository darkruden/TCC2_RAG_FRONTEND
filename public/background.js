// Arquivo de conteúdo para simular o script de background da extensão
// Este arquivo será executado em segundo plano quando a extensão estiver ativa

// Escutar mensagens do content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extrairInfoRepositorio') {
    // Responder com as informações do repositório
    sendResponse({ success: true });
  }
});

// Configurar badge da extensão
chrome.action.setBadgeText({ text: 'RAG' });
chrome.action.setBadgeBackgroundColor({ color: '#0366d6' });

console.log('GitHub RAG Extension - Background script inicializado');
