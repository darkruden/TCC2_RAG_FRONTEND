// src/App.js (MUI - Com persistência TOTAL de estado)
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
    consultarAPI, testarConexao, ingestarRepositorio, getIngestStatus
} from './services/api';

function App() {
  const [activeTab, setActiveTab] = useState('ingestao');
  const [backendStatus, setBackendStatus] = useState(null);
  
  // --- Estado da Consulta (Já persistido) ---
  const [repositorioConsulta, setRepositorioConsulta] = useState('');
  const [query, setQuery] = useState('');
  const [consultaResultado, setConsultaResultado] = useState(null);
  const [consultaLoading, setConsultaLoading] = useState(false);
  const [consultaError, setConsultaError] = useState(null);

  // --- INÍCIO DA MUDANÇA: Estado de Ingestão (Agora persistido) ---
  const [ingestLoading, setIngestLoading] = useState(false);
  const [ingestError, setIngestError] = useState(null);
  const [ingestSuccess, setIngestSuccess] = useState(null);
  const [ingestStatusText, setIngestStatusText] = useState(null); 
  const [pollingJobId, setPollingJobId] = useState(null);
  // --- FIM DA MUDANÇA ---
  
  const pollingInterval = useRef(null); 

  // ... (useEffect de testarConexao permanece igual) ...
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

  // ... (useEffect de polling permanece igual - ele vai funcionar automaticamente
  //      quando o 'pollingJobId' for carregado do storage) ...
  useEffect(() => {
    if (!pollingJobId) {
      if (pollingInterval.current) clearInterval(pollingInterval.current);
      return;
    }
    pollingInterval.current = setInterval(async () => {
      try {
        const statusData = await getIngestStatus(pollingJobId);
        if (statusData.status === 'finished') {
          clearInterval(pollingInterval.current);
          setPollingJobId(null);
          setIngestLoading(false);
          setIngestSuccess(statusData.result || "Ingestão concluída com sucesso!");
          setIngestStatusText(null);
          setIngestError(null);
        } else if (statusData.status === 'failed') {
          clearInterval(pollingInterval.current);
          setPollingJobId(null);
          setIngestLoading(false);
          setIngestError(statusData.error || "A ingestão falhou no backend.");
          setIngestStatusText(null);
        } else {
          setIngestStatusText(`Status: ${statusData.status}...`);
        }
      } catch (err) {
        clearInterval(pollingInterval.current);
        setPollingJobId(null);
        setIngestLoading(false);
        setIngestError("Erro ao verificar status da ingestão.");
      }
    }, 3000);
    return () => clearInterval(pollingInterval.current);
  }, [pollingJobId]);


  // --- MUDANÇA: useEffect de CARREGAR estado (agora inclui ingestão) ---
  useEffect(() => {
    if (window.chrome && window.chrome.storage) {
      chrome.storage.local.get([
        // Chaves da Consulta
        'repositorioConsulta', 'query', 'consultaResultado',
        // Novas Chaves da Ingestão
        'ingestLoading', 'ingestError', 'ingestSuccess', 'ingestStatusText', 'pollingJobId'
      ], (result) => {
        // Carrega Consulta
        if (result.repositorioConsulta) setRepositorioConsulta(result.repositorioConsulta);
        if (result.query) setQuery(result.query);
        if (result.consultaResultado) setConsultaResultado(result.consultaResultado);
        
        // Carrega Ingestão
        if (result.ingestLoading) setIngestLoading(result.ingestLoading);
        if (result.ingestError) setIngestError(result.ingestError);
        if (result.ingestSuccess) setIngestSuccess(result.ingestSuccess);
        if (result.ingestStatusText) setIngestStatusText(result.ingestStatusText);
        if (result.pollingJobId) setPollingJobId(result.pollingJobId); // <-- Isso reinicia o polling!
      });
    }
  }, []); // Só roda na abertura

  // --- MUDANÇA: useEffects para SALVAR estado (agora inclui ingestão) ---
  
  // Salva estado da Consulta
  useEffect(() => { if (window.chrome && window.chrome.storage) { chrome.storage.local.set({ repositorioConsulta }); } }, [repositorioConsulta]);
  useEffect(() => { if (window.chrome && window.chrome.storage) { chrome.storage.local.set({ query }); } }, [query]);
  useEffect(() => { if (window.chrome && window.chrome.storage) { chrome.storage.local.set({ consultaResultado }); } }, [consultaResultado]);
  
  // Salva estado da Ingestão
  useEffect(() => { if (window.chrome && window.chrome.storage) { chrome.storage.local.set({ ingestLoading }); } }, [ingestLoading]);
  useEffect(() => { if (window.chrome && window.chrome.storage) { chrome.storage.local.set({ ingestError }); } }, [ingestError]);
  useEffect(() => { if (window.chrome && window.chrome.storage) { chrome.storage.local.set({ ingestSuccess }); } }, [ingestSuccess]);
  useEffect(() => { if (window.chrome && window.chrome.storage) { chrome.storage.local.set({ ingestStatusText }); } }, [ingestStatusText]);
  useEffect(() => { if (window.chrome && window.chrome.storage) { chrome.storage.local.set({ pollingJobId }); } }, [pollingJobId]);

  // ... (handleConsulta permanece igual) ...
  const handleConsulta = async () => { 
    setConsultaLoading(true);
    setConsultaError(null);
    setConsultaResultado(null); 
    try {
      const dados = { 
        query: query.trim(),
        repositorio: repositorioConsulta.trim(),
        filtros: {}
      };
      const resposta = await consultarAPI(dados);
      setConsultaResultado(resposta); 
    } catch (erro) {
      setConsultaError('Erro ao processar consulta.');
    } finally {
      setConsultaLoading(false);
    }
  };

  // --- MUDANÇA: handleIngestao agora limpa o storage antes de começar ---
  const handleIngestao = async (dados) => { 
    setIngestLoading(true);
    setIngestError(null);
    setIngestSuccess(null);
    setIngestStatusText(null);
    
    // Limpa mensagens antigas do storage
    if (window.chrome && window.chrome.storage) {
        chrome.storage.local.remove(['ingestError', 'ingestSuccess']);
    }

    try {
      const resposta = await ingestarRepositorio(dados);
      setIngestStatusText(resposta.mensagem || 'Ingestão enfileirada...');
      setPollingJobId(resposta.job_id); // Isso salva o Job ID no storage (via useEffect)
    } catch (erro) {
      console.error('Erro na ingestão:', erro);
      setIngestError('Erro ao iniciar ingestão.');
      setIngestLoading(false); 
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    // O JSX/HTML permanece o mesmo da última versão corrigida
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
            <Tab label="Ingestão" value="ingestao" disabled={ingestLoading} />
            <Tab label="Consulta" value="consulta" disabled={ingestLoading} />
            <Tab label="Relatório" value="relatorio" disabled={ingestLoading} />
          </TabList>
        </Box>
        
        <TabPanel value="ingestao" sx={{ p: 0, pt: 2 }}>
          {/* O IngestaoForm não precisa mudar */}
          <IngestaoForm onSubmit={handleIngestao} loading={ingestLoading} />
          <Stack spacing={1.5} sx={{ mt: 2 }}>
            {/* Todos estes 'Alerts' e o 'LinearProgress' agora vão
              mostrar o estado correto mesmo se o popup for fechado
              e reaberto no meio de uma ingestão.
            */}
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
            onSubmit={handleConsulta} 
            loading={consultaLoading}
            query={query}
            setQuery={setQuery}
            repositorio={repositorioConsulta}
            setRepositorio={setRepositorioConsulta}
          />
          {consultaLoading && <LinearProgress sx={{ mt: 2 }} />}
          {consultaResultado && <ResultadoConsulta resultado={consultaResultado} />}
          {consultaError && (
            <Alert severity="error" sx={{ mt: 2 }}>{consultaError}</Alert>
          )}
        </TabPanel>
        
        <TabPanel value="relatorio" sx={{ p: 0, pt: 2 }}>
          <RelatorioForm />
        </TabPanel>
      </TabContext> 
    </Container> 
  );
}

export default App;