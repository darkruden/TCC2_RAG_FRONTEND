// src/App.js (Versão com Barra de Progresso e Correção de Dark Mode)
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
    getIngestStatus
} from './services/api';
import './App.css';

// (Componentes Styled... AppContainer, Tabs, StatusIndicator... permanecem os mesmos)
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

// --- INÍCIO DA CORREÇÃO DE DARK MODE ---
const Message = styled.div`
  padding: 10px;
  margin-top: 15px;
  border-radius: 6px;
  font-size: 14px;
  
  /* Light Mode (default) */
  background-color: ${props => (props.type === 'error' ? '#ffeef0' : (props.type === 'info' ? '#f1f8ff' : '#e6ffed'))};
  color: ${props => (props.type === 'error' ? '#cb2431' : (props.type === 'info' ? '#0366d6' : '#22863a'))};
  border: 1px solid ${props => (props.type === 'error' ? '#f97583' : (props.type === 'info' ? '#0366d6' : '#34d058'))};

  /* Correção para Dark Mode (baseado no seu StyledComponents.js) */
  @media (prefers-color-scheme: dark) {
    background-color: ${props => (props.type === 'error' ? 'rgba(248, 81, 73, 0.1)' : (props.type === 'info' ? 'rgba(88, 166, 255, 0.1)' : 'rgba(86, 211, 100, 0.1)'))};
    color: ${props => (props.type === 'error' ? 'var(--error-color, #f85149)' : (props.type === 'info' ? 'var(--primary-color, #58a6ff)' : 'var(--success-color, #56d364)'))};
    border: 1px solid ${props => (props.type === 'error' ? 'var(--error-color, #f85149)' : (props.type === 'info' ? 'var(--primary-color, #58a6ff)' : 'var(--success-color, #56d364)'))};
  }
`;
// --- FIM DA CORREÇÃO DE DARK MODE ---


// --- INÍCIO DA NOVA BARRA DE PROGRESSO ---
const ProgressBarContainer = styled.div`
  width: 100%;
  height: 8px;
  background-color: #e1e4e8; /* Fundo light mode */
  border-radius: 4px;
  overflow: hidden;
  margin-top: 15px;

  @media (prefers-color-scheme: dark) {
    background-color: var(--border-color, #30363d); /* Fundo dark mode */
  }
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 100%;
  background-color: var(--primary-color, #0366d6);
  animation: indeterminate 2s linear infinite;
  transform-origin: left;

  /* Animação de "ida e volta" */
  @keyframes indeterminate {
    0% {
      transform: translateX(-100%) scaleX(0.5);
    }
    50% {
      transform: translateX(0%) scaleX(0.5);
    }
    100% {
      transform: translateX(100%) scaleX(0.5);
    }
  }
`;
// --- FIM DA NOVA BARRA DE PROGRESSO ---


function App() {
  const [activeTab, setActiveTab] = useState('ingestao');
  const [backendStatus, setBackendStatus] = useState(null);
  
  const [consultaResultado, setConsultaResultado] = useState(null);
  const [consultaLoading, setConsultaLoading] = useState(false);
  const [consultaError, setConsultaError] = useState(null);

  const [ingestLoading, setIngestLoading] = useState(false);
  const [ingestError, setIngestError] = useState(null);
  const [ingestSuccess, setIngestSuccess] = useState(null);
  const [ingestStatusText, setIngestStatusText] = useState(null); // Para o texto "Status: started..."
  
  const [pollingJobId, setPollingJobId] = useState(null);
  const pollingInterval = useRef(null); 

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
          setIngestSuccess(statusData.result || "Ingestão concluída com sucesso!"); // Mensagem final de sucesso
          setIngestStatusText(null); // Limpa o status
          setIngestError(null);
        } else if (statusData.status === 'failed') {
          clearInterval(pollingInterval.current);
          setPollingJobId(null);
          setIngestLoading(false);
          setIngestError(statusData.error || "A ingestão falhou no backend.");
          setIngestStatusText(null); // Limpa o status
          setIngestSuccess(null);
        } else {
          // Atualiza o texto de status (queued ou started)
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
    // ... (lógica da consulta não mudou)
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
    setIngestStatusText(null); // Limpa status anterior
    
    try {
      const resposta = await ingestarRepositorio(dados);
      setIngestStatusText(resposta.mensagem || 'Ingestão enfileirada...'); // Status inicial
      setPollingJobId(resposta.job_id); // Dispara o polling
    } catch (erro) {
      console.error('Erro na ingestão:', erro);
      setIngestError('Erro ao iniciar ingestão.');
      setIngestLoading(false); 
    }
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
          disabled={ingestLoading}
        >
          Ingestão
        </Tab>
        <Tab 
          active={activeTab === 'consulta'} 
          onClick={() => setActiveTab('consulta')}
          disabled={ingestLoading}
        >
          Consulta
        </Tab>
        <Tab 
          active={activeTab === 'relatorio'} 
          onClick={() => setActiveTab('relatorio')}
          disabled={ingestLoading}
        >
          Relatório
        </Tab>
      </Tabs>
      
      {activeTab === 'ingestao' && (
        <>
          <IngestaoForm onSubmit={handleIngestao} loading={ingestLoading} />
          
          {/* --- RENDERIZAÇÃO DA BARRA E MENSAGENS --- */}
          {ingestLoading && (
            <>
              {/* A nova Barra de Progresso */}
              <ProgressBarContainer>
                <ProgressBar />
              </ProgressBarContainer>
              {/* A mensagem de status (azul) */}
              {ingestStatusText && <Message type="info">{ingestStatusText}</Message>}
            </>
          )}
          
          {/* Mensagem final de Sucesso (verde) */}
          {!ingestLoading && ingestSuccess && <Message type="success">{ingestSuccess}</Message>}
          
          {/* Mensagem final de Erro (vermelha) */}
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