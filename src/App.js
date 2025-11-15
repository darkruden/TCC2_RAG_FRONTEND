// src/App.js (MUI - Versão Híbrida FINAL com Upload e Relatórios)
// (Implementa a arquitetura de download via Proxy)
import React, { useState, useEffect, useRef } from 'react';
import { 
  Container, Box, Tabs, Tab, Alert, LinearProgress, Stack 
} from '@mui/material';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import ConsultaForm from './components/ConsultaForm';
import ResultadoConsulta from './components/ResultadoConsulta';
import RelatorioForm from './components/RelatorioForm';
import IngestaoForm from './components/IngestaoForm'; 
import Header from './components/Header';
import { 
    consultarAPI, 
    consultarPorArquivo, 
    testarConexao, 
    ingestarRepositorio, 
    getIngestStatus,
    gerarRelatorio,
    getReportStatus
} from './services/api';

// --- ADICIONADO: Função helper para pegar config (necessário para o Token) ---
async function getConfig() {
  // 'chrome' é indefinido fora da extensão, então tratamos isso
  if (window.chrome && window.chrome.storage) {
    const { apiUrl, apiToken } = await chrome.storage.local.get(['apiUrl', 'apiToken']);
    return {
      apiUrl: apiUrl || 'https://protected-ridge-40630-cca6313c2003.herokuapp.com',
      apiToken: apiToken || 'testebrabotoken'
    };
  } else {
    // Fallback para dev local se não estiver na extensão
    return {
      apiUrl: 'https://protected-ridge-40630-cca6313c2003.herokuapp.com',
      apiToken: 'testebrabotoken'
    };
  }
}


function App() {
  const [activeTab, setActiveTab] = useState('ingestao');
  const [backendStatus, setBackendStatus] = useState(null);
  
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState(null);
  const [reportSuccess, setReportSuccess] = useState(null);
  const [reportStatusText, setReportStatusText] = useState(null); 
  const [pollingReportJobId, setPollingReportJobId] = useState(null);
  const reportPollingInterval = useRef(null); 
  
  const [repositorioConsulta, setRepositorioConsulta] = useState('');
  const [query, setQuery] = useState('');
  const [arquivo, setArquivo] = useState(null); 
  
  const [consultaResultado, setConsultaResultado] = useState(null);
  const [consultaLoading, setConsultaLoading] = useState(false);
  const [consultaError, setConsultaError] = useState(null);

  const [ingestLoading, setIngestLoading] = useState(false);
  const [ingestError, setIngestError] = useState(null);
  const [ingestSuccess, setIngestSuccess] = useState(null);
  const [ingestStatusText, setIngestStatusText] = useState(null); 
  const [pollingJobId, setPollingJobId] = useState(null);
  
  const pollingInterval = useRef(null); 

  const handleConsultaSubmit = async () => { 
    setConsultaLoading(true);
    setConsultaError(null);
    setConsultaResultado(null); 
    
    try {
      let resposta;
      const repo = repositorioConsulta.trim();

      if (arquivo) {
        resposta = await consultarPorArquivo(repo, arquivo);
      } else {
        const dados = { 
          query: query.trim(),
          repositorio: repo,
          filtros: {}
        };
        resposta = await consultarAPI(dados);
      }
      setConsultaResultado(resposta); 
      
    } catch (erro) {
      console.error('Erro na consulta:', erro);
      setConsultaError(erro.response?.data?.detail || erro.message || 'Erro ao processar consulta.');
    } finally {
      setConsultaLoading(false);
    }
  };  

  useEffect(() => {
    const verificarConexao = async () => {
      try {
        const resposta = await testarConexao();
        setBackendStatus(resposta.status === 'online');
      } catch (erro) {
        setBackendStatus(false);
      }
    };
    verificarConexao();
  }, []);

  useEffect(() => {
    if (window.chrome && window.chrome.storage) {
      if (chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ action: 'popupAbertoResetarBadge' });
      }
      chrome.storage.local.get([
        'repositorioConsulta', 'query', 'consultaResultado',
        'ingestLoading', 'ingestError', 'ingestSuccess', 'ingestStatusText', 'pollingJobId',
        'reportLoading', 'reportError', 'reportSuccess', 'reportStatusText', 'pollingReportJobId'
      ], (result) => {
        if (result.repositorioConsulta) setRepositorioConsulta(result.repositorioConsulta);
        if (result.query) setQuery(result.query);
        if (result.consultaResultado) setConsultaResultado(result.consultaResultado);
        if (result.ingestLoading) setIngestLoading(result.ingestLoading);
        if (result.ingestError) setIngestError(result.ingestError);
        if (result.ingestSuccess) setIngestSuccess(result.ingestSuccess);
        if (result.ingestStatusText) setIngestStatusText(result.ingestStatusText);
        if (result.pollingJobId) setPollingJobId(result.pollingJobId);
        if (result.ingestSuccess || result.ingestError);
        if (result.reportLoading) setReportLoading(result.reportLoading);
        if (result.reportError) setReportError(result.reportError);
        if (result.reportSuccess) setReportSuccess(result.reportSuccess);
        if (result.reportStatusText) setReportStatusText(result.reportStatusText);
        if (result.pollingReportJobId) setPollingReportJobId(result.pollingReportJobId);
        
        if (result.reportSuccess || result.reportError) {
          chrome.storage.local.remove(['reportSuccess', 'reportError', 'reportStatusText']);
        }
      });
    }
  }, []);

  // --- MUDANÇA CRÍTICA: LÓGICA DE POLLING DE RELATÓRIO ---
  useEffect(() => {
    const pollReportStatus = async () => {
      if (!pollingReportJobId) return;

      console.log("Polling de Relatório: Verificando status para", pollingReportJobId);
      setReportLoading(true);
      
      try {
        const data = await getReportStatus(pollingReportJobId);
        
        if (data.status === 'finished') {
          console.log("Polling de Relatório: Finalizado!");
          setReportLoading(false);
          setPollingReportJobId(null);
          clearInterval(reportPollingInterval.current);
          
          // --- INÍCIO DA MUDANÇA (LÓGICA DE DOWNLOAD) ---
          // data.result agora é o NOME DO ARQUIVO (ex: "report-123.html")
          
          if (typeof data.result === 'string' && data.result.endsWith('.html')) {
            
            const filename = data.result; 
            
            setReportSuccess({ filename: filename });
            setReportStatusText(`Relatório pronto. Baixando...`);
            
            // 1. Pega a config da API (URL do Heroku e Token)
            const { apiUrl, apiToken } = await getConfig(); 
            
            // 2. Constrói a URL para o *nosso* novo endpoint de download
            const downloadUrl = `${apiUrl}/api/relatorio/download/${filename}`;

            // 3. Faz o download usando 'fetch' (para enviar o Token)
            fetch(downloadUrl, {
              method: 'GET',
              headers: {
                'X-API-Key': apiToken
              }
            })
            .then(response => {
              if (!response.ok) {
                throw new Error(`Erro de rede ou permissão: ${response.statusText}`);
              }
              return response.blob();
            })
            .then(blob => {
                // 4. Cria um link invisível para o 'blob'
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = filename; // Define o nome do arquivo baixado
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                setReportStatusText('Download do relatório concluído.');
            })
            .catch(err => {
                console.error('Erro no fetch do download:', err);
                setReportError(`Erro ao baixar o arquivo: ${err.message}`);
                setReportStatusText(null);
            });

          } else {
            // O worker retornou uma string de erro
            setReportError(data.result || 'Falha ao gerar relatório (resultado inesperado).');
          }
          // --- FIM DA MUDANÇA ---
          
        } else if (data.status === 'failed') {
          console.log("Polling de Relatório: Falhou!");
          setReportLoading(false);
          setPollingReportJobId(null);
          clearInterval(reportPollingInterval.current);
          setReportError(data.error || 'Job de relatório falhou.');
          
        } else if (data.status === 'started') {
          setReportStatusText('Worker iniciou a geração do relatório...');
        } else if (data.status === 'queued') {
          setReportStatusText('Relatório aguardando na fila...');
        }
        
      } catch (err) {
        console.error("Erro no polling de relatório:", err);
        setReportLoading(false);
        setPollingReportJobId(null);
        clearInterval(reportPollingInterval.current);
        setReportError('Erro ao verificar status do relatório.');
      }
    };

    if (pollingReportJobId) {
      pollReportStatus(); 
      reportPollingInterval.current = setInterval(pollReportStatus, 5000); 
    }

    return () => {
      if (reportPollingInterval.current) {
        clearInterval(reportPollingInterval.current);
      }
    };
  }, [pollingReportJobId]);

  // --- useEffects para SALVAR estado (Não mudam) ---
  useEffect(() => { if (window.chrome && window.chrome.storage) { chrome.storage.local.set({ repositorioConsulta }); } }, [repositorioConsulta]);
  useEffect(() => { if (window.chrome && window.chrome.storage) { chrome.storage.local.set({ query }); } }, [query]);
  useEffect(() => { if (window.chrome && window.chrome.storage) { chrome.storage.local.set({ consultaResultado }); } }, [consultaResultado]);
  useEffect(() => { if (window.chrome && window.chrome.storage) { chrome.storage.local.set({ ingestLoading }); } }, [ingestLoading]);
  useEffect(() => { if (window.chrome && window.chrome.storage) { chrome.storage.local.set({ ingestError }); } }, [ingestError]);
  useEffect(() => { if (window.chrome && window.chrome.storage) { chrome.storage.local.set({ ingestSuccess }); } }, [ingestSuccess]);
  useEffect(() => { if (window.chrome && window.chrome.storage) { chrome.storage.local.set({ ingestStatusText }); } }, [ingestStatusText]);
  useEffect(() => { if (window.chrome && window.chrome.storage) { chrome.storage.local.set({ pollingJobId }); } }, [pollingJobId]);
  useEffect(() => { if (window.chrome && window.chrome.storage) { chrome.storage.local.set({ reportLoading }); } }, [reportLoading]);
  useEffect(() => { if (window.chrome && window.chrome.storage) { chrome.storage.local.set({ reportError }); } }, [reportError]);
  useEffect(() => { if (window.chrome && window.chrome.storage) { chrome.storage.local.set({ reportSuccess }); } }, [reportSuccess]);
  useEffect(() => { if (window.chrome && window.chrome.storage) { chrome.storage.local.set({ reportStatusText }); } }, [reportStatusText]);
  useEffect(() => { if (window.chrome && window.chrome.storage) { chrome.storage.local.set({ pollingReportJobId }); } }, [pollingReportJobId]);
  
  const handleGerarRelatorio = async (dados) => { 
    setReportLoading(true);
    setReportError(null);
    setReportSuccess(null);
    setReportStatusText(null);
    if (window.chrome && window.chrome.storage) {
      chrome.storage.local.remove(['reportError', 'reportSuccess']);
  }
    
  try {
    const resposta = await gerarRelatorio(dados);
    setReportStatusText(resposta.mensagem || 'Relatório enfileirado...');
    setPollingReportJobId(resposta.job_id);
    
  } catch (erro) {
    console.error('Erro ao gerar relatório:', erro);
    setReportError('Erro ao iniciar relatório.');
    setReportLoading(false); 
  }
};

  const handleIngestao = async (dados) => { 
    setIngestLoading(true);
    setIngestError(null);
    setIngestSuccess(null);
    setIngestStatusText(null);
    if (window.chrome && window.chrome.storage) {
        chrome.storage.local.remove(['ingestError', 'ingestSuccess']);
    }
    try {
      const resposta = await ingestarRepositorio(dados);
      setIngestStatusText(resposta.mensagem || 'Ingestão enfileirada...');
      setPollingJobId(resposta.job_id);
      if (window.chrome && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ 
          action: 'iniciarPolling', 
          jobId: resposta.job_id 
        });
      }
    } catch (erro) {
      console.error('Erro na ingestão:', erro);
      setIngestError('Erro ao iniciar ingestão.');
      setIngestLoading(false); 
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setArquivo(null);
  };

  return (
    <Container maxWidth="xs" disableGutters sx={{ minHeight: '500px', maxHeight: '600px', overflowY: 'auto', p: 2.5 }}>
      <Header />
      
      {backendStatus !== null && (
        <Alert severity={backendStatus ? 'success' : 'error'} sx={{ mb: 2 }}>
          {backendStatus ? 'Conectado ao backend' : 'Não foi possível conectar ao backend'}
        </Alert>
      )}
      
      <TabContext value={activeTab}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <TabList 
            onChange={handleTabChange} 
            aria-label="Abas principais"
            variant="fullWidth"
          >
            <Tab label="Ingestão" value="ingestao" disabled={ingestLoading || consultaLoading} />
            <Tab label="Consulta" value="consulta" disabled={ingestLoading} />
            <Tab label="Relatório" value="relatorio" disabled={ingestLoading || consultaLoading} />
          </TabList>
        </Box>
        
        <TabPanel value="ingestao" sx={{ p: 0, pt: 2 }}>
          <IngestaoForm onSubmit={handleIngestao} loading={ingestLoading} />
          <Stack spacing={1.5} sx={{ mt: 2 }}>
            {ingestLoading && (
              <>
                <LinearProgress />
                {ingestStatusText && (
                  <Alert severity="info">{ingestStatusText}</Alert>
                )}
              </>
            )}
            {!ingestLoading && ingestSuccess && (
              <Alert severity="success">{ingestSuccess}</Alert>
            )}
            {ingestError && (
              <Alert severity="error">{ingestError}</Alert>
            )}
          </Stack>
        </TabPanel>
        
        <TabPanel value="consulta" sx={{ p: 0, pt: 2 }}>
          <ConsultaForm 
            onSubmit={handleConsultaSubmit}
            loading={consultaLoading}
            query={query}
            setQuery={setQuery}
            repositorio={repositorioConsulta}
            setRepositorio={setRepositorioConsulta}
            arquivo={arquivo}
            setArquivo={setArquivo}
          />
          {consultaLoading && <LinearProgress sx={{ mt: 2 }} />}
          {consultaResultado && <ResultadoConsulta resultado={consultaResultado} />}
          {consultaError && (
            <Alert severity="error" sx={{ mt: 2 }}>{consultaError}</Alert>
          )}
        </TabPanel>
        
        <TabPanel value="relatorio" sx={{ p: 0, pt: 2 }}>
        <RelatorioForm 
          repositorio={repositorioConsulta}
          onSubmit={handleGerarRelatorio}
          loading={reportLoading}
        />
        <Stack spacing={1.5} sx={{ mt: 2 }}>
          {reportLoading && (
            <>
              <LinearProgress />
              {reportStatusText && (
                <Alert severity="info">{reportStatusText}</Alert>
              )}
            </>
          )}
          {!reportLoading && reportSuccess && (
            <Alert severity="success">{reportStatusText || 'Download do relatório iniciado!'}</Alert>
          )}
          {reportError && (
            <Alert severity="error">{reportError}</Alert>
          )}
        </Stack>
        </TabPanel>
      </TabContext> 
    </Container> 
  );
}

export default App;