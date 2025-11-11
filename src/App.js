// src/App.js (Versão com Polling de Status)
import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import ConsultaForm from './components/ConsultaForm';
import ResultadoConsulta from './components/ResultadoConsulta';
import RelatorioForm from './components/RelatorioForm';
import IngestaoForm from './components/IngestaoForm'; 
import Header from './components/Header';
import { 
    consultarAPI, 
    testarConexao, 
    ingestarRepositorio, 
    getIngestStatus // <--- NOVA IMPORTAÇÃO
} from './services/api';
import './App.css';

// (Componentes Styled... AppContainer, Tabs... permanecem os mesmos)
// ...
const AppContainer = styled.div`
  width: 400px;
  min-height: 500px;
  max-height: 600px;
  overflow-y: auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
`;

const Tabs = styled.div`
  display: flex;
  margin-bottom: 20px;
  border-bottom: 1px solid #e1e4e8;
`;

const Tab = styled.button`
  padding: 10px 15px;
  background: ${props => props.active ? '#0366d6' : 'transparent'};
  color: ${props => props.active ? 'white' : '#586069'};
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  border-radius: 6px 6px 0 0;
  
  &:hover {
    background: ${props => props.active ? '#0366d6' : '#f6f8fa'};
  }
  
  /* Desabilita outras abas durante a ingestão */
  &:disabled {
    color: #999;
    cursor: not-allowed;
    background: #f6f8fa;
  }
`;

const StatusIndicator = styled.div`
  padding: 8px;
  margin-bottom: 15px;
  border-radius: 4px;
  font-size: 12px;
  background-color: ${props => props.connected ? '#e6ffed' : '#ffeef0'};
  color: ${props => props.connected ? '#22863a' : '#cb2431'};
  border: 1px solid ${props => props.connected ? '#34d058' : '#f97583'};
`;

const Message = styled.div`
  padding: 10px;
  margin-top: 15px;
  border-radius: 6px;
  font-size: 14px;
  background-color: ${props => (props.type === 'error' ? '#ffeef0' : (props.type === 'info' ? '#f1f8ff' : '#e6ffed'))};
  color: ${props => (props.type === 'error' ? '#cb2431' : (props.type === 'info' ? '#0366d6' : '#22863a'))};
  border: 1px solid ${props => (props.type === 'error' ? '#f97583' : (props.type === 'info' ? '#0366d6' : '#34d058'))};
`;
// ...

function App() {
  const [activeTab, setActiveTab] = useState('ingestao');
  const [backendStatus, setBackendStatus] = useState(null);
  
  // Estados da Consulta
  const [consultaResultado, setConsultaResultado] = useState(null);
  const [consultaLoading, setConsultaLoading] = useState(false);
  const [consultaError, setConsultaError] = useState(null);

  // Estados da Ingestão
  const [ingestLoading, setIngestLoading] = useState(false);
  const [ingestError, setIngestError] = useState(null);
  const [ingestSuccess, setIngestSuccess] = useState(null);
  
  // --- NOVO ESTADO PARA POLLING ---
  const [pollingJobId, setPollingJobId] = useState(null);
  const pollingInterval = useRef(null); // Guarda a referência do intervalo

  // Efeito para verificar conexão (como antes)
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

  // --- NOVO EFEITO PARA POLLING DE STATUS ---
  useEffect(() => {
    // Se não há Job ID para monitorar, pare
    if (!pollingJobId) {
      if (pollingInterval.current) clearInterval(pollingInterval.current);
      return;
    }

    // Se tem um Job ID, comece a verificar
    pollingInterval.current = setInterval(async () => {
      console.log("Verificando status do job:", pollingJobId);
      try {
        const statusData = await getIngestStatus(pollingJobId);
        
        if (statusData.status === 'finished') {
          // SUCESSO!
          clearInterval(pollingInterval.current);
          setPollingJobId(null);
          setIngestLoading(false);
          setIngestSuccess(statusData.result || "Ingestão concluída com sucesso!");
          setIngestError(null);
        } else if (statusData.status === 'failed') {
          // FALHA!
          clearInterval(pollingInterval.current);
          setPollingJobId(null);
          setIngestLoading(false);
          setIngestError(statusData.error || "A ingestão falhou no backend.");
          setIngestSuccess(null);
        } else {
          // AINDA RODANDO ('queued' ou 'started')
          setIngestSuccess(`Status: ${statusData.status}...`);
        }
      } catch (err) {
        console.error("Erro no polling:", err);
        clearInterval(pollingInterval.current);
        setPollingJobId(null);
        setIngestLoading(false);
        setIngestError("Erro ao verificar status da ingestão.");
      }
    }, 3000); // Verifica a cada 3 segundos

    // Limpa o intervalo se o componente for desmontado
    return () => clearInterval(pollingInterval.current);
  }, [pollingJobId]); // Este efeito depende do pollingJobId

  // Handler da Consulta (igual)
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

  // Handler da Ingestão (MODIFICADO)
  const handleIngestao = async (dados) => {
    setIngestLoading(true);
    setIngestError(null);
    setIngestSuccess(null);
    
    try {
      const resposta = await ingestarRepositorio(dados);
      // SUCESSO! Inicia o polling.
      setIngestSuccess(resposta.mensagem || 'Ingestão enfileirada...');
      setPollingJobId(resposta.job_id); // <-- ISSO DISPARA O 'useEffect'
    } catch (erro) {
      console.error('Erro na ingestão:', erro);
      setIngestError('Erro ao iniciar ingestão.');
      setIngestLoading(false); // Para o loading se a chamada inicial falhar
    }
    // Não paramos o 'loading' aqui. O 'useEffect' irá pará-lo.
  };

  return (
    <AppContainer>
      <Header />
      
      {backendStatus !== null && (
        <StatusIndicator connected={backendStatus}>
          {backendStatus 
            ? '✅ Conectado ao backend' 
            : '❌ Não foi possível conectar ao backend'}
        </StatusIndicator>
      )}
      
      <Tabs>
        <Tab 
          active={activeTab === 'ingestao'} 
          onClick={() => setActiveTab('ingestao')}
          disabled={ingestLoading} /* Desabilita a aba */
        >
          Ingestão
        </Tab>
        <Tab 
          active={activeTab === 'consulta'} 
          onClick={() => setActiveTab('consulta')}
          disabled={ingestLoading} /* Desabilita a aba */
        >
          Consulta
        </Tab>
        <Tab 
          active={activeTab === 'relatorio'} 
          onClick={() => setActiveTab('relatorio')}
          disabled={ingestLoading} /* Desabilita a aba */
        >
          Relatório
        </Tab>
      </Tabs>
      
      {activeTab === 'ingestao' && (
        <>
          <IngestaoForm onSubmit={handleIngestao} loading={ingestLoading} />
          {/* Mostra mensagens com cores diferentes */}
          {ingestLoading && ingestSuccess && <Message type="info">{ingestSuccess}</Message>}
          {!ingestLoading && ingestSuccess && <Message type="success">{ingestSuccess}</Message>}
          {ingestError && <Message type="error">{ingestError}</Message>}
        </>
      )}

      {activeTab === 'consulta' && (
        <>
          <ConsultaForm onSubmit={handleConsulta} loading={consultaLoading} />
          {consultaResultado && <ResultadoConsulta resultado={consultaResultado} />}
          {consultaError && <Message type="error">{consultaError}</Message>}
        </>
      )}
      
      {activeTab === 'relatorio' && (
        <RelatorioForm />
      )}
    </AppContainer>
  );
}

export default App;