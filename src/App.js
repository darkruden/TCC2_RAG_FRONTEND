// src/App.js (MUI - Corrigido com os typos)
import React, { useState, useEffect, useRef } from 'react';
// Importações de layout do MUI
import { 
  Container, Box, Tabs, Tab, Alert, AlertTitle, LinearProgress, Stack 
} from '@mui/material';
// Importações do 'lab' para componentes mais complexos
import { TabContext, TabList, TabPanel } from '@mui/lab';
// Importações dos seus componentes
import ConsultaForm from './components/ConsultaForm';
import ResultadoConsulta from './components/ResultadoConsulta';
import RelatorioForm from './components/RelatorioForm';
import IngestaoForm from './components/IngestaoForm'; 
import Header from './components/Header';
import { 
    consultarAPI, 
    testarConexao, 
    ingestarRepositorio, 
    getIngestStatus
} from './services/api';

function App() {
  const [activeTab, setActiveTab] = useState('ingestao'); // MUI Tabs usam 'value'
  const [backendStatus, setBackendStatus] = useState(null);
  
  const [consultaResultado, setConsultaResultado] = useState(null);
  const [consultaLoading, setConsultaLoading] = useState(false);
  const [consultaError, setConsultaError] = useState(null);

  const [ingestLoading, setIngestLoading] = useState(false);
  const [ingestError, setIngestError] = useState(null);
  const [ingestSuccess, setIngestSuccess] = useState(null);
  const [ingestStatusText, setIngestStatusText] = useState(null); 
  
  const [pollingJobId, setPollingJobId] = useState(null);
  const pollingInterval = useRef(null); 

  // ... (Toda a lógica de useEffect e handlers permanece a mesma) ...
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

  const handleConsulta = async (dados) => { /* ... (lógica igual) ... */ 
    setConsultaLoading(true);
    setConsultaError(null);
    setConsultaResultado(null);
    try {
      const resposta = await consultarAPI(dados);
      setConsultaResultado(resposta);
    } catch (erro) {
      setConsultaError('Erro ao processar consulta.');
    } finally {
      setConsultaLoading(false);
    }
  };
  const handleIngestao = async (dados) => { /* ... (lógica igual) ... */ 
    setIngestLoading(true);
    setIngestError(null);
    setIngestSuccess(null);
    setIngestStatusText(null);
    try {
      const resposta = await ingestarRepositorio(dados);
      setIngestStatusText(resposta.mensagem || 'Ingestão enfileirada...');
      setPollingJobId(resposta.job_id);
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
    // 'Container' centraliza e define a largura. 'disableGutters' remove padding.
    <Container maxWidth="xs" disableGutters sx={{ minHeight: '500px', maxHeight: '600px', overflowY: 'auto', p: 2.5 }}>
      <Header />
      
      {backendStatus !== null && (
        <Alert severity={backendStatus ? 'success' : 'error'} sx={{ mb: 2 }}>
          {backendStatus ? 'Conectado ao backend' : 'Não foi possível conectar ao backend'}
        </Alert>
      )}
      
      {/* 'TabContext' gerencia o estado das abas */}
      <TabContext value={activeTab}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <TabList 
            onChange={handleTabChange} 
            aria-label="Abas principais"
            variant="fullWidth" // Abas ocupam espaço total
          >
            <Tab label="Ingestão" value="ingestao" disabled={ingestLoading} />
            <Tab label="Consulta" value="consulta" disabled={ingestLoading} />
            <Tab label="Relatório" value="relatorio" disabled={ingestLoading} />
          </TabList>
        </Box>
        
        {/* 'TabPanel' remove o padding padrão com sx={{ p: 0 }} */}
        <TabPanel value="ingestao" sx={{ p: 0, pt: 2 }}>
          <IngestaoForm onSubmit={handleIngestao} loading={ingestLoading} />
          {/* 'Stack' é o VStack/HStack do MUI */}
          <Stack spacing={1.5} sx={{ mt: 2 }}>
            {ingestLoading && (
              <>
                <LinearProgress /> {/* Barra de progresso */}
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
          <ConsultaForm onSubmit={handleConsulta} loading={consultaLoading} />
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
      {/* CORREÇÃO 1: Removido o '>>' daqui (era linha 174)
        CORREÇÃO 2: A tag de fechamento agora é </Container> (era </Box>)
      */}
    </Container> 
  );
}

export default App;