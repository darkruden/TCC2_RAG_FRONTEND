import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import ConsultaForm from './components/ConsultaForm';
import ResultadoConsulta from './components/ResultadoConsulta';
import RelatorioForm from './components/RelatorioForm';
import Header from './components/Header';
import { consultarAPI, testarConexao } from './services/api';
import './App.css';

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

function App() {
  const [activeTab, setActiveTab] = useState('consulta');
  const [backendStatus, setBackendStatus] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Verificar conexão com o backend ao iniciar
    const verificarConexao = async () => {
      try {
        const resposta = await testarConexao();
        setBackendStatus(resposta.status === 'online');
      } catch (erro) {
        console.error('Erro ao verificar conexão:', erro);
        setBackendStatus(false);
      }
    };

    verificarConexao();
  }, []);

  const handleConsulta = async (dados) => {
    setLoading(true);
    setError(null);
    
    try {
      const resposta = await consultarAPI(dados);
      setResultado(resposta);
    } catch (erro) {
      console.error('Erro na consulta:', erro);
      setError('Erro ao processar consulta. Verifique a conexão e tente novamente.');
    } finally {
      setLoading(false);
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
          active={activeTab === 'consulta'} 
          onClick={() => setActiveTab('consulta')}
        >
          Consulta
        </Tab>
        <Tab 
          active={activeTab === 'relatorio'} 
          onClick={() => setActiveTab('relatorio')}
        >
          Relatório
        </Tab>
      </Tabs>
      
      {activeTab === 'consulta' && (
        <>
          <ConsultaForm onSubmit={handleConsulta} loading={loading} />
          {resultado && <ResultadoConsulta resultado={resultado} />}
          {error && <div className="error-message">{error}</div>}
        </>
      )}
      
      {activeTab === 'relatorio' && (
        <RelatorioForm />
      )}
    </AppContainer>
  );
}

export default App;
