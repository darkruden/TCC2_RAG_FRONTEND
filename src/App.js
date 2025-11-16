// CÓDIGO COMPLETO PARA: src/App.js
// (Refatorado para Streaming)

import React, { useEffect, useRef, useMemo, useState } from 'react';
import { 
  Container, Box, Alert, Stack, TextField, IconButton,
  CircularProgress, Paper, Typography, Chip
} from '@mui/material';
import { 
    Send as SendIcon, 
    AttachFile as AttachFileIcon,
    ClearAll as ClearAllIcon
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import Header from './components/Header';
import { useQuery } from '@tanstack/react-query'; // (useMutation não é mais usado)
import { useChatStore } from './store/chatStore'; 
import axios from 'axios';

import { 
    iniciarChat,      // <-- NOVA API
    fetchChatStream,  // <-- NOVA API
    testarConexao
} from './services/api'; 

// (Componente ChatMessage não muda)
function ChatMessage({ message }) { /* ... (código idêntico) ... */ }
function ChatMessage({ message }) {
  const isUser = message.sender === 'user';
  return (
    <Box sx={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', mb: 2 }}>
      <Paper 
        variant="outlined"
        sx={{
          p: 1.5, bgcolor: isUser ? 'primary.main' : 'background.paper',
          color: isUser ? 'primary.contrastText' : 'text.primary',
          maxWidth: '80%', borderRadius: isUser ? '20px 20px 5px 20px' : '20px 20px 20px 5px',
        }}
      >
        <Typography component="div" variant="body2">
          <ReactMarkdown>{message.text}</ReactMarkdown>
        </Typography>
      </Paper>
    </Box>
  );
}


function App() {
  // ==================================================================
  // 1. Hooks de Gerenciamento de Estado (Zustand)
  // ==================================================================
  
  // (O estado 'isLoading' local foi removido, agora usamos 'isStreaming' do store)
  const {
    messages, addMessage, inputPrompt, setInputPrompt,
    arquivo, setArquivo, clearChat, submitPrompt,
    isStreaming, startBotMessage, appendLastMessage, finishBotMessage // <-- Novas ações
  } = useChatStore((state) => state);

  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);
  
  // (Estado local para o token, necessário para o 'useMemo')
  const [apiToken, setApiToken] = useState('testebrabotoken');
  const apiUrl = 'https://meu-tcc-testes-041c1dd46d1d.herokuapp.com';

  // ==================================================================
  // 2. Configuração Centralizada da API
  // ==================================================================
  
  // (Lê o token do storage ao carregar)
  useEffect(() => {
    if (window.chrome && chrome.storage) {
      chrome.storage.local.get(['apiToken'], (result) => {
        if (result.apiToken) {
          setApiToken(result.apiToken);
        }
      });
    }
  }, []);

  const apiClient = useMemo(() => {
    return axios.create({
      baseURL: apiUrl,
      headers: { 'X-API-Key': apiToken },
      timeout: 60000 
    });
  }, [apiUrl, apiToken]); // Recria se o token mudar

  // ==================================================================
  // 3. Hooks de Estado do Servidor (React Query)
  // ==================================================================

  const { data: backendStatus, isError: backendIsError } = useQuery({
    queryKey: ['backendStatus', apiClient], // (apiClient é uma dependência)
    queryFn: () => testarConexao(apiClient),
    select: (data) => data.status === 'online',
    retry: 1,
  });

  // (O 'useMutation' foi REMOVIDO)
  
  // ==================================================================
  // 4. Hooks de UI (Efeitos e Listeners)
  // ==================================================================

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const messageListener = (request, sender, sendResponse) => {
      // (Ouve apenas jobs, o chat stream é tratado no submit)
      if (request.action === 'job_finished') {
        addMessage('bot', request.message);
      } else if (request.action === 'job_failed') {
        addMessage('bot', `❌ **Tarefa Falhou:** ${request.error}`);
      }
      sendResponse({ success: true });
      return true;
    };
    chrome.runtime.onMessage.addListener(messageListener);
    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, [addMessage]);
  
  // (Funções de Anexo não mudam)
  const handleAttachClick = () => { fileInputRef.current.click(); };
  const handleFileChange = (e) => { /* ... (código idêntico) ... */ };
  const handleRemoveFile = () => { /* ... (código idêntico) ... */ };
  const handleClearChat = () => { clearChat(); };
  
  // --- LÓGICA DE SUBMIT (Totalmente Refatorada para Streaming) ---
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    const prompt = inputPrompt.trim();
    if (isStreaming || (!prompt && !arquivo)) return;
    
    const userPrompt = prompt || (arquivo ? `Analisar o arquivo: ${arquivo.name}` : '');
    
    // 1. Atualiza o estado do chat no Zustand
    submitPrompt(userPrompt + (arquivo ? `\n(Anexado: ${arquivo.name})` : ''));
    
    try {
      // 2. Chama o Roteador de Intenção (NÃO-streaming)
      const data = await iniciarChat(apiClient, userPrompt, arquivo);
      
      // 3. Limpa o arquivo (se houver)
      if (arquivo) handleRemoveFile();

      // 4. Roteia a resposta
      switch (data.response_type) {
        
        case 'stream_answer':
          // --- INÍCIO DO STREAMING ---
          startBotMessage(); // Adiciona uma mensagem de bot vazia
          
          await fetchChatStream({
            streamArgs: data.message, // O JSON de args (repo, prompt)
            apiToken: apiToken,
            apiUrl: apiUrl,
            onToken: (token) => {
              appendLastMessage(token); // Anexa o token ao store
            },
            onComplete: () => {
              finishBotMessage(); // Para o indicador de "digitando"
            },
            onError: (err) => {
              appendLastMessage(`\n\n**Erro no stream:** ${err.message}`);
              finishBotMessage();
            }
          });
          break;
          // --- FIM DO STREAMING ---
          
        case 'answer':
        case 'clarification':
          addMessage('bot', data.message);
          break;
          
        case 'job_enqueued':
          addMessage('bot', data.message);
          // Avisa o background.js para iniciar o polling
          const jobType = data.message.includes('ingestão') ? 'ingest' : 'report';
          chrome.runtime.sendMessage({
            action: 'startPolling',
            jobId: data.job_id,
            type: jobType
          });
          break;
          
        default:
          addMessage('bot', `Houve um erro: ${data.message}`);
          break;
      }
      
    } catch (error) {
      console.error('Erro no handleChatSubmit:', error);
      addMessage('bot', `Erro ao conectar com o backend: ${error.detail || error.message}`);
      if (arquivo) handleRemoveFile();
    }
  };

  return (
    <Container 
      disableGutters 
      sx={{ 
        height: '100vh', minWidth: '380px', width: '100%',
        display: 'flex', flexDirection: 'column',
        p: 0, bgcolor: 'background.default'
      }}
    >
      <Box sx={{ p: 2.5, pb: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Header />
        <IconButton onClick={handleClearChat} title="Limpar histórico do chat" size="small" disabled={isStreaming}>
          <ClearAllIcon />
        </IconButton>
      </Box>
      
      {backendStatus !== null && (
        <Box sx={{ p: 2.5, pt: 1, pb: 1 }}>
          <Alert severity={backendStatus ? 'success' : (backendIsError ? 'error' : 'info')} sx={{ mb: 0 }}>
            {backendStatus ? 'Conectado ao backend' : 'Backend offline'}
          </Alert>
        </Box>
      )}
      
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2.5 }}>
        <Stack spacing={1}>
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          {/* 'isLoading' agora é 'isStreaming' do store */}
          {isStreaming && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
              <CircularProgress size={20} sx={{ml: 2}} />
            </Box>
          )}
          <div ref={chatEndRef} />
        </Stack>
      </Box>
      
      <Box 
        as="form" 
        onSubmit={handleChatSubmit} 
        sx={{
          p: 2.5, borderTop: 1,
          borderColor: 'divider', bgcolor: 'background.paper'
        }}
      >
        {arquivo && (
          <Chip
            label={arquivo.name}
            onDelete={handleRemoveFile}
            color="primary"
            size="small"
            sx={{ mb: 1 }}
          />
        )}
        
        <Stack direction="row" spacing={1} alignItems="center">
          <input
            type="file" ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
            accept=".txt,.md,text/plain,text/markdown"
          />
          <IconButton 
            onClick={handleAttachClick} 
            disabled={isStreaming || !backendStatus}
            aria-label="Anexar arquivo"
          >
            <AttachFileIcon />
          </IconButton>
          
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            placeholder="Pergunte, ingira ou anexe uma instrução..."
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            disabled={isStreaming || !backendStatus}
            autoFocus
          />
          <IconButton 
            type="submit" 
            color="primary" 
            disabled={isStreaming || (!inputPrompt.trim() && !arquivo)}
          >
            <SendIcon />
          </IconButton>
        </Stack>
      </Box>
      
    </Container> 
  );
}

export default App;