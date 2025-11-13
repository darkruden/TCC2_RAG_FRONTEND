// public/background.js

// --- Constantes ---
const POLLING_INTERVAL_MS = 3000;

// --- Estado da Animação ---
let loadingInterval = null;
const loadingFrames = ['-', '\\', '|', '/'];
let frameIndex = 0;

// =================================================================
//    LÓGICA DE AUTENTICAÇÃO (NOVA, baseada no seu api.js)
// =================================================================
async function getConfigForBackground() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['apiUrl', 'apiToken'], (result) => {
      const config = {
        apiUrl: result.apiUrl || 'https://protected-ridge-40630-cca6313c2003.herokuapp.com',
        apiToken: result.apiToken || 'testebrabotoken' // O mesmo fallback do seu api.js
      };
      resolve(config);
    });
  });
}

// --- Funções de Animação (Badge) ---
// (Estas funções permanecem as mesmas de antes)
function startLoadingAnimation() {
  if (loadingInterval) return;
  frameIndex = 0;
  loadingInterval = setInterval(() => {
    chrome.action.setBadgeText({ text: loadingFrames[frameIndex] });
    chrome.action.setBadgeBackgroundColor({ color: '#0366d6' });
    frameIndex = (frameIndex + 1) % loadingFrames.length;
  }, 200);
}

function stopLoadingAnimation(status) {
  if (loadingInterval) {
    clearInterval(loadingInterval);
    loadingInterval = null;
  }
  frameIndex = 0;
  if (status === 'success') {
    chrome.action.setBadgeText({ text: '✓' });
    chrome.action.setBadgeBackgroundColor({ color: '#28a745' });
  } else if (status === 'fail') {
    chrome.action.setBadgeText({ text: '!' });
    chrome.action.setBadgeBackgroundColor({ color: '#dc3545' });
  }
  
  // A LINHA ABAIXO FOI REMOVIDA:
  // setTimeout(resetBadge, 5000); 
}
// =================================================================

function resetBadge() {
  chrome.action.setBadgeText({ text: 'RAG' });
  chrome.action.setBadgeBackgroundColor({ color: '#0366d6' });
}


// --- LÓGICA DE POLLING (Atualizada) ---

let pollingIntervalId = null;

// Função que chama a API de status
async function checkIngestStatus(jobId) {
  if (!jobId) return;

  // 1. Pega a config (URL e Token) do storage
  const config = await getConfigForBackground();

  try {
    // 2. Faz o 'fetch' com os cabeçalhos de autenticação
    const response = await fetch(`${config.apiUrl}/api/ingest/status/${jobId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': config.apiToken // <-- A LINHA CRÍTICA QUE FALTAVA
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status} ${response.statusText}`);
    }
    
    const statusData = await response.json();

    // Salva o status parcial
    chrome.storage.local.set({ ingestStatusText: `Status: ${statusData.status}...` });

    if (statusData.status === 'finished') {
      console.log('Polling: Ingestão finalizada.');
      stopPolling();
      stopLoadingAnimation('success');
      chrome.storage.local.set({
        ingestSuccess: statusData.result || "Ingestão concluída!",
        ingestLoading: false,
        pollingJobId: null,
        ingestStatusText: null
      });

    } else if (statusData.status === 'failed') {
      console.log('Polling: Ingestão falhou.');
      stopPolling();
      stopLoadingAnimation('fail');
      chrome.storage.local.set({
        ingestError: statusData.error || "A ingestão falhou no backend.",
        ingestLoading: false,
        pollingJobId: null,
        ingestStatusText: null
      });
    }
    // Se for 'pending' ou outro, não faz nada e espera o próximo intervalo

  } catch (err) {
    console.error('Polling: Erro de rede ou autenticação.', err);
    stopPolling();
    stopLoadingAnimation('fail');
    chrome.storage.local.set({
      ingestError: `Erro ao verificar status: ${err.message}`,
      ingestLoading: false,
      pollingJobId: null,
      ingestStatusText: null
    });
  }
}

// Funções para controlar o polling (permanecem iguais)
function startPolling(jobId) {
  if (pollingIntervalId) {
    clearInterval(pollingIntervalId);
  }
  checkIngestStatus(jobId); 
  pollingIntervalId = setInterval(() => checkIngestStatus(jobId), POLLING_INTERVAL_MS);
}

function stopPolling() {
  if (pollingIntervalId) {
    clearInterval(pollingIntervalId);
    pollingIntervalId = null;
  }
}


// --- Listeners de Mensagem e Inicialização ---
// (Permanecem os mesmos)

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  
  if (request.action === 'ingestaoIniciada') {
    console.log('BG: Recebido ingestaoIniciada');
    startLoadingAnimation();
    sendResponse({ success: true });
    return true;

  } else if (request.action === 'iniciarPolling') {
    console.log(`BG: Recebido iniciarPolling com jobId: ${request.jobId}`);
    startPolling(request.jobId);
    sendResponse({ success: true });
    return true;

  } else if (request.action === 'ingestaoFalhou') {
    console.log('BG: Recebido ingestaoFalhou (antes do polling)');
    stopLoadingAnimation('fail');
    sendResponse({ success: true });
    return true;
  
  // ADICIONE ESTE NOVO 'ELSE IF'
  } else if (request.action === 'popupAbertoResetarBadge') {
    console.log('BG: Popup aberto pelo usuário, resetando badge.');
    resetBadge();
    sendResponse({ success: true });
    return true;
  }
});

// Ao iniciar o background script (ou recarregar a extensão)
chrome.runtime.onStartup.addListener(() => {
  resetBadge();
  chrome.storage.local.get(['pollingJobId', 'ingestLoading'], (result) => {
    if (result.pollingJobId) {
      console.log(`BG: Reiniciando polling para ${result.pollingJobId}`);
      startPolling(result.pollingJobId);
      if (result.ingestLoading) {
        startLoadingAnimation();
      }
    }
  });
});

// Configuração inicial ao instalar/recarregar
resetBadge();

// Verifica se há um job ativo ao recarregar a extensão
chrome.storage.local.get(['pollingJobId', 'ingestLoading'], (result) => {
  if (result.pollingJobId) {
    console.log(`BG: Extensão recarregada. Retomando polling para ${result.pollingJobId}`);
    startPolling(result.pollingJobId);
    if (result.ingestLoading) {
      startLoadingAnimation();
    }
  }
});

console.log('GitHub RAG Extension - Background script inicializado');