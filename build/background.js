// CÓDIGO COMPLETO PARA: public/background.js
// (Implementa Item 2: Polling em Segundo Plano para Ingestão e Relatórios)

// --- Constantes ---
const POLLING_INTERVAL_MS = 5000; // Aumentado para 5s

// --- Estado da Animação (Badge) ---
let loadingInterval = null;
const loadingFrames = ['-', '\\', '|', '/'];
let frameIndex = 0;

// --- ESTADO DO POLLING ---
// Um mapa para rastrear múltiplos jobs (ingestão e relatórios)
// Ex: { "job-123": { type: 'ingest', intervalId: 45 }, ... }
let pollingJobs = {};

// =================================================================
//    LÓGICA DE AUTENTICAÇÃO (Igual ao seu)
// =================================================================
async function getConfigForBackground() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['apiUrl', 'apiToken'], (result) => {
      const config = {
        // Usa a URL do seu APP DE TESTES
        apiUrl: result.apiUrl || 'https://meu-tcc-testes-041c1dd46d1d.herokuapp.com',
        apiToken: result.apiToken || 'testebrabotoken'
      };
      resolve(config);
    });
  });
}

// --- Funções de Animação (Badge) ---
// (Sem alterações)
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
  // Removemos o 'setTimeout(resetBadge, 5000);'
}

function resetBadge() {
  chrome.action.setBadgeText({ text: '' }); // Badge limpo
  chrome.action.setBadgeBackgroundColor({ color: '#0366d6' });
}
// =================================================================

// --- LÓGICA DE POLLING (Atualizada) ---

/**
 * Função de notificação nativa do OS.
 */
function showNotification(title, message, jobId) {
  chrome.notifications.create(jobId, {
    type: 'basic',
    iconUrl: 'logo128.png', // (Certifique-se que logo128.png existe no 'public')
    title: title,
    message: message,
    priority: 2
  });
}

/**
 * Função GENÉRICA que chama a API de status.
 * (Combina checkIngestStatus e o novo checkReportStatus)
 */
async function pollJobStatus(jobId, type) {
  if (!jobId || !type) return;

  const config = await getConfigForBackground();
  
  // Define o endpoint correto basedo no tipo
  const endpoint = type === 'ingest' 
    ? `/api/ingest/status/${jobId}` 
    : `/api/relatorio/status/${jobId}`;
  
  const jobTypeDisplay = type === 'ingest' ? 'Ingestão' : 'Relatório';

  try {
    const response = await fetch(`${config.apiUrl}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': config.apiToken
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status} ${response.statusText}`);
    }
    
    const statusData = await response.json();

    if (statusData.status === 'finished') {
      console.log(`Polling: ${jobTypeDisplay} ${jobId} finalizado.`);
      stopPolling(jobId);
      stopLoadingAnimation('success'); // (Pode parar a animação se for o último job)
      
      const successMessage = statusData.result.mensagem || statusData.result || "Tarefa concluída!";
      
      // 1. Notifica o Popup (App.js) se estiver aberto
      chrome.runtime.sendMessage({
        action: 'job_finished',
        jobId: jobId,
        type: type,
        message: successMessage
      });
      
      // 2. Mostra a notificação nativa
      showNotification(`✅ ${jobTypeDisplay} Concluída`, successMessage, jobId);

    } else if (statusData.status === 'failed') {
      console.log(`Polling: ${jobTypeDisplay} ${jobId} falhou.`);
      stopPolling(jobId);
      stopLoadingAnimation('fail');
      
      const errorMessage = statusData.error || "A tarefa falhou no backend.";
      
      // 1. Notifica o Popup (App.js)
      chrome.runtime.sendMessage({
        action: 'job_failed',
        jobId: jobId,
        type: type,
        error: errorMessage
      });
      
      // 2. Mostra a notificação nativa
      showNotification(`❌ ${jobTypeDisplay} Falhou`, errorMessage, jobId);
    }
    // Se for 'pending' ou 'started', não faz nada e espera o próximo intervalo

  } catch (err) {
    console.error(`Polling: Erro de rede ou autenticação para ${jobId}.`, err);
    stopPolling(jobId);
    stopLoadingAnimation('fail');
    // (Poderíamos notificar a falha aqui também)
  }
}

/**
 * Inicia o polling para um novo job.
 */
function startPolling(jobId, type) {
  if (pollingJobs[jobId]) {
    console.log(`Polling para ${jobId} já está rodando.`);
    return;
  }
  
  console.log(`BG: Iniciando polling para ${jobId} (Tipo: ${type})`);
  
  // 1. Inicia a animação (se não estiver rodando)
  startLoadingAnimation();
  
  // 2. Roda a verificação imediatamente
  pollJobStatus(jobId, type); 
  
  // 3. Configura o intervalo
  const intervalId = setInterval(() => pollJobStatus(jobId, type), POLLING_INTERVAL_MS);
  
  // 4. Salva no mapa de estado
  pollingJobs[jobId] = { type: type, intervalId: intervalId };
  
  // 5. Salva no storage para persistência
  chrome.storage.local.set({ activePollingJobs: pollingJobs });
}

/**
 * Para o polling para um job específico.
 */
function stopPolling(jobId) {
  const job = pollingJobs[jobId];
  if (job) {
    console.log(`BG: Parando polling para ${jobId}`);
    clearInterval(job.intervalId);
    delete pollingJobs[jobId];
    
    // Atualiza o storage
    chrome.storage.local.set({ activePollingJobs: pollingJobs });
    
    // Se não houver mais jobs rodando, reseta o badge
    if (Object.keys(pollingJobs).length === 0) {
      setTimeout(resetBadge, 3000); // Reseta após 3s
    }
  }
}

// --- Listeners de Mensagem e Inicialização ---

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  
  // --- AÇÃO ATUALIZADA (Item 2) ---
  if (request.action === 'startPolling') {
    // App.js está pedindo para iniciar o polling
    if (request.jobId && request.type) {
      startPolling(request.jobId, request.type);
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: "jobId ou type faltando." });
    }
    return true; // (Indica resposta assíncrona)
  
  // (Ação antiga 'popupAbertoResetarBadge' - mantida)
  } else if (request.action === 'popupAbertoResetarBadge') {
    console.log('BG: Popup aberto, resetando badge.');
    resetBadge();
    sendResponse({ success: true });
    return true;
  }
  
  // (As ações antigas 'ingestaoIniciada', 'iniciarPolling', 
  // 'ingestaoFalhou' não são mais usadas pelo novo App.js)
});

// --- LÓGICA DE REINICIALIZAÇÃO (Item 2) ---
// (Ao iniciar o background script (ou recarregar a extensão))
function resumePollingOnStartup() {
  resetBadge();
  chrome.storage.local.get(['activePollingJobs'], (result) => {
    if (result.activePollingJobs && Object.keys(result.activePollingJobs).length > 0) {
      console.log("BG: Reiniciando jobs de polling persistidos...");
      
      const oldJobs = result.activePollingJobs;
      pollingJobs = {}; // Reseta o mapa de estado
      
      // Reinicia o polling para cada job salvo
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
// Roda também na instalação/recarregamento
resumePollingOnStartup();

console.log('GitHub RAG Extension - Background script inicializado');