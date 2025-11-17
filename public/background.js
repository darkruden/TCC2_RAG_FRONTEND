// CÓDIGO COMPLETO PARA: public/background.js
// (Atualizado para a API do Side Panel e autenticação multiusuário)

// --- Constantes ---
const POLLING_INTERVAL_MS = 5000;
const API_URL = 'https://meu-tcc-testes-041c1dd46d1d.herokuapp.com';

// --- Estado da Animação (Badge) ---
let loadingInterval = null;
const loadingFrames = ['-', '\\', '|', '/'];
let frameIndex = 0;
let pollingJobs = {}; // Armazena { jobId: { type, intervalId } }

// =================================================================
//    LÓGICA DO SIDE PANEL
// =================================================================
try {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
} catch (e) {
  console.warn("Erro ao definir o comportamento do Side Panel (provavelmente recarregamento):", e);
}
// =================================================================


// =================================================================
//    LÓGICA DE AUTENTICAÇÃO (ATUALIZADA)
// =================================================================
async function getApiToken() {
  return new Promise((resolve) => {
    // Busca a 'apiToken' salva pelo AppWrapper.js após o login
    chrome.storage.local.get(['apiToken'], (result) => {
      resolve(result.apiToken || null);
    });
  });
}

// --- Funções de Animação (Badge) ---
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
  const color = status === 'success' ? '#28a745' : '#dc3545';
  const text = status === 'success' ? '✓' : '!';
  chrome.action.setBadgeText({ text: text });
  chrome.action.setBadgeBackgroundColor({ color: color });
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

async function startDownload(filename, apiToken) {
  if (!apiToken) {
    showNotification(`❌ Download Falhou`, "Usuário não autenticado.", filename);
    return;
  }
  try {
    const downloadUrl = `${API_URL}/api/relatorio/download/${filename}`;
    
    chrome.downloads.download({
      url: downloadUrl,
      filename: filename,
      headers: [
        { name: 'X-API-Key', value: apiToken } // Usa o token pessoal
      ]
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error("Erro ao iniciar download:", chrome.runtime.lastError.message);
        chrome.runtime.sendMessage({
          action: 'job_failed',
          jobId: filename,
          error: `Falha ao iniciar download: ${chrome.runtime.lastError.message}`
        });
      }
    });
  } catch (err) {
    console.error("Erro na função startDownload:", err);
  }
}

async function pollJobStatus(jobId, type) {
  if (!jobId || !type) return;

  const apiToken = await getApiToken();
  if (!apiToken) {
    console.error(`Polling: Erro de autenticação para ${jobId}. Token não encontrado.`);
    stopPolling(jobId);
    stopLoadingAnimation('fail');
    return;
  }

  const endpoint = type === 'ingest' 
    ? `/api/ingest/status/${jobId}` 
    : `/api/relatorio/status/${jobId}`;
  const jobTypeDisplay = type === 'ingest' ? 'Ingestão' : 'Relatório';

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': apiToken }
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
      
      if (type === 'ingest') {
        const successMessage = resultData.mensagem || resultData || "Tarefa concluída!";
        chrome.runtime.sendMessage({ action: 'job_finished', jobId, type, message: successMessage });
        showNotification(`✅ ${jobTypeDisplay} Concluída`, successMessage, jobId);
      
      } else if (type === 'report') {
        const filename = resultData;
        chrome.runtime.sendMessage({
          action: 'job_finished',
          jobId: jobId,
          type: type,
          message: `Relatório pronto. Iniciando download de \`${filename}\`...`
        });
        startDownload(filename, apiToken); // Passa o token para o download
      }

    } else if (statusData.status === 'failed') {
      console.log(`Polling: ${jobTypeDisplay} ${jobId} falhou.`);
      stopPolling(jobId);
      stopLoadingAnimation('fail');
      const errorMessage = statusData.error || "A tarefa falhou no backend.";
      chrome.runtime.sendMessage({ action: 'job_failed', jobId, type, error: errorMessage });
      showNotification(`❌ ${jobTypeDisplay} Falhou`, errorMessage, jobId);
    }
    // (Se 'pending' ou 'started', não faz nada e espera o próximo poll)
  } catch (err) {
    console.error(`Polling: Erro de rede ou autenticação para ${jobId}.`, err);
    // Não paramos o polling por erro de rede (pode ser temporário),
    // mas paramos por 401 (que será pego pelo !response.ok)
    if (err.message.includes('401')) {
      stopPolling(jobId);
      stopLoadingAnimation('fail');
    }
  }
}

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

// --- Listeners de Mensagem ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  
  if (request.action === 'startPolling') {
    if (request.jobId && request.type) {
      startPolling(request.jobId, request.type);
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: "jobId ou type faltando." });
    }
    return true; // Indica resposta assíncrona
  }
});

// --- LÓGICA DE REINICIALIZAÇÃO ---
function resumePollingOnStartup() {
  resetBadge();
  chrome.storage.local.get(['activePollingJobs'], (result) => {
    if (result.activePollingJobs && Object.keys(result.activePollingJobs).length > 0) {
      console.log("BG: Reiniciando jobs de polling persistidos...");
      const oldJobs = result.activePollingJobs;
      pollingJobs = {}; 
      for (const jobId in oldJobs) {
        if (oldJobs.hasOwnProperty(jobId)) {
          const job = oldJobs[jobId];
          startPolling(jobId, job.type);
        }
      }
    } else {
      console.log("BG: Nenhum job de polling ativo para reiniciar.");
    }
  });
}

chrome.runtime.onStartup.addListener(resumePollingOnStartup);
resumePollingOnStartup(); // Também executa na instalação/atualização

console.log('GitHub RAG Extension - Background script (Side Panel) inicializado');