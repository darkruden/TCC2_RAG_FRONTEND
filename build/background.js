// CÓDIGO COMPLETO PARA: public/background.js
// (Implementa Item 2: Polling e Download no Background)

// --- Constantes ---
const POLLING_INTERVAL_MS = 5000;

// --- Estado da Animação (Badge) ---
let loadingInterval = null;
const loadingFrames = ['-', '\\', '|', '/'];
let frameIndex = 0;

// --- Estado do Polling ---
let pollingJobs = {};

// =================================================================
//    LÓGICA DE AUTENTICAÇÃO
// =================================================================
async function getConfigForBackground() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['apiUrl', 'apiToken'], (result) => {
      const config = {
        apiUrl: result.apiUrl || 'https://meu-tcc-testes-041c1dd46d1d.herokuapp.com',
        apiToken: result.apiToken || 'testebrabotoken'
      };
      resolve(config);
    });
  });
}

// --- Funções de Animação (Badge) ---
// (Sem alterações)
function startLoadingAnimation() { /* ... */ }
function stopLoadingAnimation(status) { /* ... */ }
function resetBadge() { /* ... */ }
// (Funções de animação omitidas por brevidade, mas são as mesmas de antes)
function startLoadingAnimation() {
  if (loadingInterval) return;
  frameIndex = 0;
  loadingInterval = setInterval(() => {
    chrome.action.setBadgeText({ text: loadingFrames[frameIndex] });
    frameIndex = (frameIndex + 1) % loadingFrames.length;
  }, 200);
}
function stopLoadingAnimation(status) {
  if (loadingInterval) {
    clearInterval(loadingInterval);
    loadingInterval = null;
  }
  if (status === 'success') {
    chrome.action.setBadgeText({ text: '✓' });
    chrome.action.setBadgeBackgroundColor({ color: '#28a745' });
  } else if (status === 'fail') {
    chrome.action.setBadgeText({ text: '!' });
    chrome.action.setBadgeBackgroundColor({ color: '#dc3545' });
  }
}
function resetBadge() {
  chrome.action.setBadgeText({ text: '' });
  chrome.action.setBadgeBackgroundColor({ color: '#0366d6' });
}
// =================================================================

// --- LÓGICA DE POLLING E DOWNLOAD ---

function showNotification(title, message, jobId) {
  chrome.notifications.create(jobId, {
    type: 'basic',
    iconUrl: 'logo128.png',
    title: title,
    message: message,
    priority: 2
  });
}

// --- NOVA FUNÇÃO DE DOWNLOAD (Item 1: Correção do Bug) ---
/**
 * Inicia o download usando a API chrome.downloads
 */
async function startDownload(filename) {
  try {
    const config = await getConfigForBackground();
    const downloadUrl = `${config.apiUrl}/api/relatorio/download/${filename}`;

    console.log(`BG: Iniciando download de ${downloadUrl}`);
    
    chrome.downloads.download({
      url: downloadUrl,
      filename: filename, // Sugere o nome do arquivo
      headers: [
        // Envia o token de autenticação
        { name: 'X-API-Key', value: config.apiToken }
      ]
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error("Erro ao iniciar download:", chrome.runtime.lastError.message);
        // Informa o popup do erro
        chrome.runtime.sendMessage({
          action: 'job_failed',
          jobId: filename, // Usa o filename como ID
          error: `Falha ao iniciar download: ${chrome.runtime.lastError.message}`
        });
        showNotification(`❌ Download Falhou`, `Não foi possível iniciar o download: ${chrome.runtime.lastError.message}`, filename);
      } else {
        console.log(`BG: Download iniciado com ID: ${downloadId}`);
        // (A notificação de sucesso agora vem do próprio download)
      }
    });

  } catch (err) {
    console.error("Erro na função startDownload:", err);
  }
}


/**
 * Função GENÉRICA que chama a API de status.
 */
async function pollJobStatus(jobId, type) {
  if (!jobId || !type) return;

  const config = await getConfigForBackground();
  const endpoint = type === 'ingest' 
    ? `/api/ingest/status/${jobId}` 
    : `/api/relatorio/status/${jobId}`;
  const jobTypeDisplay = type === 'ingest' ? 'Ingestão' : 'Relatório';

  try {
    const response = await fetch(`${config.apiUrl}${endpoint}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': config.apiToken }
    });
    
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status} ${response.statusText}`);
    }
    
    const statusData = await response.json();

    if (statusData.status === 'finished') {
      console.log(`Polling: ${jobTypeDisplay} ${jobId} finalizado.`);
      stopPolling(jobId);
      stopLoadingAnimation('success');
      
      const resultData = statusData.result;
      
      // --- LÓGICA DE SUCESSO ATUALIZADA ---
      if (type === 'ingest') {
        const successMessage = resultData.mensagem || resultData || "Tarefa concluída!";
        chrome.runtime.sendMessage({ action: 'job_finished', jobId, type, message: successMessage });
        showNotification(`✅ ${jobTypeDisplay} Concluída`, successMessage, jobId);
      
      } else if (type === 'report') {
        // O 'resultData' é o NOME DO ARQUIVO (ex: "relatorio.html")
        const filename = resultData;
        
        // 1. Informa o popup (App.js) que o download vai começar
        chrome.runtime.sendMessage({
          action: 'job_finished',
          jobId: jobId,
          type: type,
          message: `Relatório pronto. Iniciando download de \`${filename}\`...`
        });
        
        // 2. Inicia o download (a correção do bug)
        startDownload(filename);
        
        // (A notificação de "sucesso" será a do próprio download)
      }

    } else if (statusData.status === 'failed') {
      console.log(`Polling: ${jobTypeDisplay} ${jobId} falhou.`);
      stopPolling(jobId);
      stopLoadingAnimation('fail');
      
      const errorMessage = statusData.error || "A tarefa falhou no backend.";
      
      chrome.runtime.sendMessage({ action: 'job_failed', jobId, type, error: errorMessage });
      showNotification(`❌ ${jobTypeDisplay} Falhou`, errorMessage, jobId);
    }

  } catch (err) {
    console.error(`Polling: Erro de rede ou autenticação para ${jobId}.`, err);
    stopPolling(jobId);
    stopLoadingAnimation('fail');
  }
}

// (Funções startPolling, stopPolling, e os listeners
//  permanecem os mesmos da etapa anterior)
function startPolling(jobId, type) {
  if (pollingJobs[jobId]) return;
  console.log(`BG: Iniciando polling para ${jobId} (Tipo: ${type})`);
  startLoadingAnimation();
  pollJobStatus(jobId, type); 
  const intervalId = setInterval(() => pollJobStatus(jobId, type), POLLING_INTERVAL_MS);
  pollingJobs[jobId] = { type: type, intervalId: intervalId };
  chrome.storage.local.set({ activePollingJobs: pollingJobs });
}

function stopPolling(jobId) {
  const job = pollingJobs[jobId];
  if (job) {
    console.log(`BG: Parando polling para ${jobId}`);
    clearInterval(job.intervalId);
    delete pollingJobs[jobId];
    chrome.storage.local.set({ activePollingJobs: pollingJobs });
    if (Object.keys(pollingJobs).length === 0) {
      setTimeout(resetBadge, 3000);
    }
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startPolling') {
    if (request.jobId && request.type) {
      startPolling(request.jobId, request.type);
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: "jobId ou type faltando." });
    }
    return true;
  } else if (request.action === 'popupAbertoResetarBadge') {
    console.log('BG: Popup aberto, resetando badge.');
    resetBadge();
    sendResponse({ success: true });
    return true;
  }
});

function resumePollingOnStartup() {
  resetBadge();
  chrome.storage.local.get(['activePollingJobs'], (result) => {
    if (result.activePollingJobs && Object.keys(result.activePollingJobs).length > 0) {
      console.log("BG: Reiniciando jobs de polling persistidos...");
      const oldJobs = result.activePollingJobs;
      pollingJobs = {}; 
      for (const jobId in oldJobs) {
        const job = oldJobs[jobId];
        startPolling(jobId, job.type);
      }
    } else {
      console.log("BG: Nenhum job de polling ativo para reiniciar.");
    }
  });
}

chrome.runtime.onStartup.addListener(resumePollingOnStartup);
resumePollingOnStartup();

console.log('GitHub RAG Extension - Background script inicializado');