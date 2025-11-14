// src/App.js (MUI - Versão Híbrida FINAL com Upload e Relatórios)
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
    // --- MUDANÇA 1: Importar a nova função da API ---
    consultarPorArquivo, 
    testarConexao, 
    ingestarRepositorio, 
    getIngestStatus,
    gerarRelatorio,
    getReportStatus
} from './services/api';

function App() {
  const [activeTab, setActiveTab] = useState('ingestao');
  const [backendStatus, setBackendStatus] = useState(null);
  
  // --- INÍCIO DA ALTERAÇÃO 2: Adicionar estado para Relatórios ---
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState(null);
  const [reportSuccess, setReportSuccess] = useState(null); // Vai guardar a URL final
  const [reportStatusText, setReportStatusText] = useState(null); 
  const [pollingReportJobId, setPollingReportJobId] = useState(null);
  const reportPollingInterval = useRef(null); 
  // --- FIM DA ALTERAÇÃO 2 ---
  // --- Estado da Consulta (Já persistido) ---
  const [repositorioConsulta, setRepositorioConsulta] = useState('');
  const [query, setQuery] = useState('');
  
  // --- MUDANÇA 2: Adicionar estado para o upload de arquivo ---
  const [arquivo, setArquivo] = useState(null); 
  
  const [consultaResultado, setConsultaResultado] = useState(null);
  const [consultaLoading, setConsultaLoading] = useState(false);
  const [consultaError, setConsultaError] = useState(null);

  // --- Estado de Ingestão (Como estava) ---
  const [ingestLoading, setIngestLoading] = useState(false);
  const [ingestError, setIngestError] = useState(null);
  const [ingestSuccess, setIngestSuccess] = useState(null);
  const [ingestStatusText, setIngestStatusText] = useState(null); 
  const [pollingJobId, setPollingJobId] = useState(null);
  
  // ... (useRef e useEffect de testarConexao permanecem iguais) ...
  const pollingInterval = useRef(null); 

  const handleConsultaSubmit = async () => { 
    setConsultaLoading(true);
    setConsultaError(null);
    setConsultaResultado(null); 
    
    try {
      let resposta;
      const repo = repositorioConsulta.trim();

      if (arquivo) {
        // ---- ROTA 1: Consulta por ARQUIVO ----
        // (Chama a nova função de 'api.js')
        resposta = await consultarPorArquivo(repo, arquivo);
        
      } else {
        // ---- ROTA 2: Consulta por TEXTO ----
        // (Lógica antiga que já funcionava)
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

  // --- useEffect de CARREGAR estado (Não vamos persistir o 'arquivo' para simplificar) ---
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

  useEffect(() => {
    const pollReportStatus = async () => {
      if (!pollingReportJobId) return;

      console.log("Polling de Relatório: Verificando status para", pollingReportJobId);
      setReportLoading(true); // Garante que o loading esteja ativo
      
      try {
        const data = await getReportStatus(pollingReportJobId);
        
        if (data.status === 'finished') {
          console.log("Polling de Relatório: Finalizado!");
          setReportLoading(false);
          setPollingReportJobId(null);
          clearInterval(reportPollingInterval.current);
          
          // O 'result' é um dicionário { format: 'html', filepath: '...', filename: '...' }
          // ou uma string de erro
          if (typeof data.result === 'string' && data.result.startsWith('http')) {
            
            const reportUrl = data.result; // O resultado JÁ É a URL
            
            setReportSuccess({ url: reportUrl }); // Salva a URL no estado
            setReportStatusText(`Relatório pronto. Abrindo...`);
            
            // ABRE A URL PÚBLICA DO SUPABASE DIRETAMENTE
            window.open(reportUrl, '_blank');
            
          } else {
            // O worker retornou uma string de erro (ex: "Erro ao fazer upload")
            // ou um resultado inesperado.
            setReportError(data.result || 'Falha ao gerar relatório (resultado inesperado).');
          }
          
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

    // Iniciar o polling se tivermos um ID
    if (pollingReportJobId) {
      // Verifica imediatamente ao carregar
      pollReportStatus(); 
      // E então verifica a cada 5 segundos
      reportPollingInterval.current = setInterval(pollReportStatus, 5000); 
    }

    // Limpeza
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
  

  
  // --- MUDANÇA 3: A Lógica de Consulta agora é Híbrida ---
  // (Renomeado 'handleConsulta' para 'handleConsultaSubmit' para clareza)
  const handleGerarRelatorio = async (dados) => { 
    setReportLoading(true);
    setReportError(null);
    setReportSuccess(null);
    setReportStatusText(null);
    if (window.chrome && window.chrome.storage) {
      chrome.storage.local.remove(['reportError', 'reportSuccess']);
  }
    
  try {
    // 'dados' vem do RelatorioForm: { repositorio, prompt }
    const resposta = await gerarRelatorio(dados); // Chama a api.js
    setReportStatusText(resposta.mensagem || 'Relatório enfileirado...');
    setPollingReportJobId(resposta.job_id); // Inicia o polling (via useEffect)
    
  } catch (erro) {
    console.error('Erro ao gerar relatório:', erro);
    setReportError('Erro ao iniciar relatório.');
    setReportLoading(false); 
  }
};

  // ... (handleIngestao permanece igual) ...
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


  // --- MUDANÇA 4: Limpar o arquivo ao mudar de aba (Boa prática) ---
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setArquivo(null); // Limpa o arquivo selecionado ao trocar de aba
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
          {/* ... (O painel de Ingestao não muda) ... */}
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
          {/* --- MUDANÇA 5: Passar as novas props para o ConsultaForm --- */}
          <ConsultaForm 
            onSubmit={handleConsultaSubmit} // <-- Nome da função atualizado
            loading={consultaLoading}
            query={query}
            setQuery={setQuery}
            repositorio={repositorioConsulta}
            setRepositorio={setRepositorioConsulta}
            arquivo={arquivo}         // <-- Prop nova
            setArquivo={setArquivo}   // <-- Prop nova
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
        {/* Adiciona os Alertas e Progresso, como na Ingestão */}
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
            <Alert severity="success">{reportStatusText || 'Relatório gerado com sucesso!'}</Alert>
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