// src/App.js (Corrigido para Chakra UI v3)
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Tabs,
  TabsList,           // V3
  TabsTrigger,        // V3
  TabsContentGroup,   // V3
  TabsContent,        // V3
  Alert,
  AlertIndicator,     // V3
  Progress,
  VStack
} from '@chakra-ui/react';
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
  const [activeTab, setActiveTab] = useState('ingestao'); // V3 usa 'value'
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

  const handleConsulta = async (dados) => {
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

  const handleIngestao = async (dados) => {
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

  return (
    <Box w="400px" minH="500px" maxH="600px" overflowY="auto" p={5}>
      <Header />
      
      {backendStatus !== null && (
        <Alert status={backendStatus ? 'success' : 'error'} mb={4} variant="subtle">
          <AlertIndicator />
          {backendStatus 
            ? 'Conectado ao backend' 
            : 'Não foi possível conectar ao backend'}
        </Alert>
      )}
      
      <Tabs 
        value={activeTab} 
        onValueChange={(e) => setActiveTab(e.value)} // V3
        isLazy
        variant="line"
        colorScheme="blue"
      >
        <TabsList>
          <TabsTrigger value="ingestao" isDisabled={ingestLoading}>Ingestão</TabsTrigger>
          <TabsTrigger value="consulta" isDisabled={ingestLoading}>Consulta</TabsTrigger>
          <TabsTrigger value="relatorio" isDisabled={ingestLoading}>Relatório</TabsTrigger>
        </TabsList>
        
        <TabsContentGroup>
          <TabsContent value="ingestao">
            <IngestaoForm onSubmit={handleIngestao} loading={ingestLoading} />
            <VStack spacing={3} mt={4}>
              {ingestLoading && (
                <>
                  <Progress size="xs" isIndeterminate w="100%" />
                  {ingestStatusText && (
                    <Alert status="info" variant="subtle">
                      <AlertIndicator />
                      {ingestStatusText}
                    </Alert>
                  )}
                </>
              )}
              {!ingestLoading && ingestSuccess && (
                <Alert status="success" variant="subtle">
                  <AlertIndicator />
                  {ingestSuccess}
                </Alert>
              )}
              {ingestError && (
                <Alert status="error" variant="subtle">
                  <AlertIndicator />
                  {ingestError}
                </Alert>
              )}
            </VStack>
          </TabsContent>
          
          <TabsContent value="consulta">
            <ConsultaForm onSubmit={handleConsulta} loading={consultaLoading} />
            {consultaLoading && <Progress size="xs" isIndeterminate mt={4} />}
            {consultaResultado && <ResultadoConsulta resultado={consultaResultado} />}
            {consultaError && (
              <Alert status="error" variant="subtle" mt={4}>
                <AlertIndicator />
                {consultaError}
              </Alert>
            )}
          </TabsContent>
          
          <TabsContent value="relatorio">
            <RelatorioForm />
          </TabsContent>
        </TabsContentGroup>
      </Tabs>
    </Box>
  );
}

export default App;