// CÓDIGO COMPLETO PARA: src/App.js
// (Refatorado para a interface de Chat "Gemini-like")

import React, { useState, useEffect, useRef } from 'react';
import { 
  Container, Box, Alert, Stack, TextField, IconButton,
  CircularProgress, Paper, Typography
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import ReactMarkdown from 'react-markdown'; // Para renderizar as respostas
import Header from './components/Header';
import { 
    enviarMensagemChat, // Nova API
    testarConexao, 
    getIngestStatus,
    getReportStatus,
    getConfig // Importamos o getConfig para o download
} from './services/api';

// --- Componente de Mensagem do Chat ---
// (Um sub-componente para manter o App.js limpo)
function ChatMessage({ message }) {
  const isUser = message.sender === 'user';
  
  return (
    <Box sx={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      mb: 2,
    }}>
      <Paper 
        variant="outlined"
        sx={{
          p: 1.5,
          bgcolor: isUser ? 'primary.main' : 'background.paper',
          color: isUser ? 'primary.contrastText' : 'text.primary',
          maxWidth: '80%',
          borderRadius: isUser ? '20px 20px 5px 20px' : '20px 20px 20px 5px',
        }}
      >
        {/* Usamos ReactMarkdown para renderizar a resposta da IA */}
        <Typography component="div" variant="body2">
          <ReactMarkdown>{message.text}</ReactMarkdown>
        </Typography>
      </Paper>
    </Box>
  );
}

function App() {
  const [backendStatus, setBackendStatus] = useState(null);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Loading geral do chat
  
  // Lista de mensagens do chat
  const [messages, setMessages] = useState([
    { id: '1', sender: 'bot', text: 'Olá! Como posso ajudar? Você pode me pedir para ingerir um repositório, responder perguntas ou gerar relatórios.' }
  ]);
  
  // --- LÓGICA DE POLLING (Adaptada do seu App.js antigo) ---
  const [pollingIngestJobId, setPollingIngestJobId] = useState(null);
  const [pollingReportJobId, setPollingReportJobId] = useState(null);
  const ingestInterval = useRef(null);
  const reportInterval = useRef(null);

  // Hook para rolar o chat para baixo
  const chatEndRef = useRef(null);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Hook para testar a conexão (igual ao antigo)
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
  
  // --- FUNÇÃO HELPER: Adicionar mensagem ao chat ---
  const addMessage = (sender, text) => {
    setMessages(prev => [...prev, { id: Date.now().toString(), sender, text }]);
  };

  // --- FUNÇÃO PRINCIPAL: Enviar Chat ---
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!inputPrompt.trim() || isLoading) return;
    
    const userPrompt = inputPrompt.trim();
    addMessage('user', userPrompt);
    setInputPrompt('');
    setIsLoading(true);

    try {
      // 1. Envia o prompt para o novo endpoint /api/chat
      const data = await enviarMensagemChat(userPrompt);
      
      // 2. Processa a resposta do Roteador de Intenção
      switch (data.response_type) {
        case 'answer': // Resposta RAG
        case 'clarification': // Pedido de clarificação
          addMessage('bot', data.message);
          break;
          
        case 'job_enqueued': // Ingestão ou Relatório
          addMessage('bot', data.message);
          // Verifica qual job foi enfileirado
          if (data.message.includes('ingestão')) {
            setPollingIngestJobId(data.job_id);
          } else if (data.message.includes('relatório')) {
            setPollingReportJobId(data.job_id);
          }
          break;
          
        case 'error': // Erro do backend
        default:
          addMessage('bot', `Houve um erro: ${data.message}`);
          break;
      }
      
    } catch (error) {
      console.error('Erro no handleChatSubmit:', error);
      addMessage('bot', `Erro ao conectar com o backend: ${error.detail || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // --- LÓGICA DE POLLING DE INGESTÃO ---
  useEffect(() => {
    const pollIngestStatus = async () => {
      if (!pollingIngestJobId) return;

      console.log("Polling de Ingestão: Verificando status para", pollingIngestJobId);
      
      try {
        const data = await getIngestStatus(pollingIngestJobId);
        
        if (data.status === 'finished') {
          addMessage('bot', `✅ **Ingestão Concluída:** ${data.result.mensagem || 'Repositório processado!'}`);
          setPollingIngestJobId(null);
          clearInterval(ingestInterval.current);
        } else if (data.status === 'failed') {
          addMessage('bot', `❌ **Ingestão Falhou:** ${data.error || 'Erro desconhecido.'}`);
          setPollingIngestJobId(null);
          clearInterval(ingestInterval.current);
        }
        // Se for 'queued' ou 'started', continua em silêncio...
        
      } catch (err) {
        addMessage('bot', `❌ **Erro de Polling:** ${err.message}`);
        setPollingIngestJobId(null);
        clearInterval(ingestInterval.current);
      }
    };

    if (pollingIngestJobId) {
      pollIngestStatus(); // Verifica imediatamente
      ingestInterval.current = setInterval(pollIngestStatus, 5000); 
    }
    return () => {
      if (ingestInterval.current) clearInterval(ingestInterval.current);
    };
  }, [pollingIngestJobId]);


  // --- LÓGICA DE POLLING DE RELATÓRIO (com Download) ---
  useEffect(() => {
    const pollReportStatus = async () => {
      if (!pollingReportJobId) return;

      console.log("Polling de Relatório: Verificando status para", pollingReportJobId);
      
      try {
        const data = await getReportStatus(pollingReportJobId);
        
        if (data.status === 'finished') {
          console.log("Polling de Relatório: Finalizado!");
          const filename = data.result; // O backend agora retorna o filename
          
          addMessage('bot', `✅ **Relatório Pronto!** Iniciando download de \`${filename}\`...`);
          
          // --- Lógica de Download (do seu App.js antigo) ---
          const { apiUrl, apiToken } = await getConfig(); 
          const downloadUrl = `${apiUrl}/api/relatorio/download/${filename}`;

          fetch(downloadUrl, {
            method: 'GET',
            headers: { 'X-API-Key': apiToken }
          })
          .then(response => {
            if (!response.ok) throw new Error(`Erro de rede: ${response.statusText}`);
            return response.blob();
          })
          .then(blob => {
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.style.display = 'none';
              a.href = url;
              a.download = filename;
              document.body.appendChild(a);
              a.click();
              window.URL.revokeObjectURL(url);
              document.body.removeChild(a);
              addMessage('bot', 'Download concluído!');
          })
          .catch(err => {
              console.error('Erro no fetch do download:', err);
              addMessage('bot', `❌ **Falha no Download:** ${err.message}`);
          });
          
          setPollingReportJobId(null);
          clearInterval(reportInterval.current);
          
        } else if (data.status === 'failed') {
          addMessage('bot', `❌ **Relatório Falhou:** ${data.error || 'Erro desconhecido.'}`);
          setPollingReportJobId(null);
          clearInterval(reportInterval.current);
        }
        
      } catch (err) {
        addMessage('bot', `❌ **Erro de Polling:** ${err.message}`);
        setPollingReportJobId(null);
        clearInterval(reportInterval.current);
      }
    };

    if (pollingReportJobId) {
      pollReportStatus(); 
      reportInterval.current = setInterval(pollReportStatus, 5000); 
    }
    return () => {
      if (reportInterval.current) clearInterval(reportInterval.current);
    };
  }, [pollingReportJobId]);


  return (
    // Definimos uma altura fixa para a extensão e usamos Flexbox
    <Container 
      maxWidth="xs" 
      disableGutters 
      sx={{ 
        height: '600px', // Altura fixa da extensão
        display: 'flex',
        flexDirection: 'column',
        p: 0
      }}
    >
      <Box sx={{ p: 2.5, pb: 0 }}>
        <Header />
      </Box>
      
      {backendStatus !== null && (
        <Box sx={{ p: 2.5, pt: 1, pb: 1 }}>
          <Alert severity={backendStatus ? 'success' : 'error'} sx={{ mb: 0 }}>
            {backendStatus ? 'Conectado ao backend' : 'Backend offline'}
          </Alert>
        </Box>
      )}
      
      {/* --- ÁREA DO CHAT (com scroll) --- */}
      <Box sx={{
        flexGrow: 1, // Ocupa todo o espaço disponível
        overflowY: 'auto', // Adiciona scroll
        p: 2.5,
      }}>
        <Stack spacing={1}>
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
              <CircularProgress size={20} sx={{ml: 2}} />
            </Box>
          )}
          {/* Ref para rolar para o fim */}
          <div ref={chatEndRef} />
        </Stack>
      </Box>
      
      {/* --- ÁREA DO INPUT (Fixa no rodapé) --- */}
      <Box 
        as="form" 
        onSubmit={handleChatSubmit} 
        sx={{
          p: 2.5,
          borderTop: 1,
          borderColor: 'divider',
          bgcolor: 'background.default'
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            placeholder="Ingerir, consultar ou gerar relatório..."
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            disabled={isLoading || !backendStatus}
          />
          <IconButton type="submit" color="primary" disabled={isLoading || !inputPrompt.trim()}>
            <SendIcon />
          </IconButton>
        </Stack>
      </Box>
      
    </Container> 
  );
}

export default App;