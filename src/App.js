// CÓDIGO COMPLETO PARA: src/App.js
// (Corrigido com uma "guarda" para a API chrome.runtime)

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
import { useQuery } from '@tanstack/react-query';
import { useChatStore } from './store/chatStore'; 
import axios from 'axios';

import { 
    iniciarChat,
    fetchChatStream,
    testarConexao
} from './services/api'; 

// (Componente ChatMessage não muda)
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
  
  const {
    messages, addMessage, inputPrompt, setInputPrompt,
    arquivo, setArquivo, clearChat, submitPrompt,
    isStreaming, startBotMessage, appendLastMessage, finishBotMessage
  } = useChatStore((state) => state);

  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);
  
  const [apiToken, setApiToken] = useState('testebrabotoken');
  const apiUrl = 'https://meu-tcc-testes-041c1dd46d1d.herokuapp.com';

  // ==================================================================
  // 2. Configuração Centralizada da API
  // ==================================================================
  
  useEffect(() => {
    // (Este 'if' já estava correto, protegendo contra 'chrome.storage' undefined)
    if (window.chrome && chrome.storage && chrome.storage.local) {
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
  }, [apiUrl, apiToken]);

  // ==================================================================
  // 3. Hooks de Estado do Servidor (React Query)
  // ==================================================================

  const { data: backendStatus, isError: backendIsError } = useQuery({
    queryKey: ['backendStatus', apiClient],
    queryFn: () => testarConexao(apiClient),
    select: (data) => data.status === 'online',
    retry: 1,
  });
  
  // ==================================================================
  // 4. Hooks de UI (Efeitos e Listeners)
  // ==================================================================

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- INÍCIO DA CORREÇÃO ---
  // (O erro 'onMessage' undefined acontece aqui)
  useEffect(() => {
    // Adicionamos esta verificação:
    // Só tenta escutar mensagens se a API 'chrome.runtime' existir.
    if (window.chrome && chrome.runtime && chrome.runtime.onMessage) {
      
      const messageListener = (request, sender, sendResponse) => {
        console.log("App.js recebeu mensagem:", request);
        
        if (request.action === 'job_finished') {
          addMessage('bot', request.message);
        } else if (request.action === 'job_failed') {
          addMessage('bot', `❌ **Tarefa Falhou:** ${request.error}`);
        }
        
        sendResponse({ success: true });
        return true;
      };

      chrome.runtime.onMessage.addListener(messageListener);
      
      // Retorna a função de limpeza
      return () => {
        chrome.runtime.onMessage.removeListener(messageListener);
      };

    } else {
      // Se estiver em localhost, apenas avisa no console
      console.warn("API chrome.runtime.onMessage não encontrada (rodando em localhost?). O polling não será recebido aqui.");
    }
  }, [addMessage]); // (A dependência 'addMessage' está correta)
  // --- FIM DA CORREÇÃO ---
  
  // (Funções de Anexo não mudam)
  const handleAttachClick = () => { fileInputRef.current.click(); };
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 500 * 1024) { addMessage('bot', '❌ **Erro:** O arquivo é muito grande (500KB).'); return; }
    if (!file.type.startsWith('text/')) { addMessage('bot', '❌ **Erro:** Tipo de arquivo inválido.'); return; }
    setArquivo(file);
  };
  const handleRemoveFile = () => {
    setArquivo(null);
    if (fileInputRef.current) fileInputRef.current.value = null;
  };
  const handleClearChat = () => { clearChat(); };
  
  // --- LÓGICA DE SUBMIT (Sem alterações) ---
  // --- LÓGICA DE SUBMIT (Refatorada para Contexto) ---
  // --- LÓGICA DE SUBMIT (Refatorada para Contexto) ---
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    const prompt = inputPrompt.trim();
    if (isStreaming || (!prompt && !arquivo)) return;
    
    const userPrompt = prompt || (arquivo ? `Analisar o arquivo: ${arquivo.name}` : '');
    
    // --- INÍCIO DA ATUALIZAÇÃO (Memória de Chat) ---

    // 1. Cria o objeto da nova mensagem
    const newMessage = {
      id: `msg_${Date.now()}`, // ID local temporário
      sender: 'user',
      text: userPrompt + (arquivo ? `\n(Anexado: ${arquivo.name})` : '')
    };
    
    // 2. Cria a lista de mensagens *completa* que será enviada
    const newMessages = [...messages, newMessage];

    // 3. Atualiza a UI imediatamente (usando as funções do Zustand)
    addMessage(newMessage.sender, newMessage.text);
    setInputPrompt(''); // Limpa o input
    
    // (A função 'submitPrompt' foi substituída pelas duas linhas acima)
    
    // --- FIM DA ATUALIZAÇÃO ---
    
    try {
      // 4. Envia o histórico COMPLETO para a API
      const data = await iniciarChat(
        apiClient, 
        newMessages, // <-- O histórico completo
        userPrompt,  // <-- O prompt atual (necessário para o FormData do /chat_file)
        arquivo
      );
      
      if (arquivo) handleRemoveFile();

      // O 'switch' case abaixo não precisa de alterações
      switch (data.response_type) {
        
        case 'stream_answer':
          startBotMessage();
          
          await fetchChatStream({
            streamArgs: data.message,
            apiToken: apiToken,
            apiUrl: apiUrl,
            onToken: (token) => {
              appendLastMessage(token);
            },
            onComplete: () => {
              finishBotMessage();
            },
            onError: (err) => {
              appendLastMessage(`\n\n**Erro no stream:** ${err.message}`);
              finishBotMessage();
            }
          });
          break;
          
        case 'answer':
        case 'clarification':
          addMessage('bot', data.message);
          break;
          
        case 'job_enqueued':
          addMessage('bot', data.message);
          
          if (window.chrome && chrome.runtime && chrome.runtime.sendMessage) {
            const jobType = data.message.includes('ingestão') ? 'ingest' : 'report';
            chrome.runtime.sendMessage({
              action: 'startPolling',
              jobId: data.job_id,
              type: jobType
            });
          } else {
            console.warn("Não é possível iniciar o polling (API do Chrome não encontrada).");
          }
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

  // --- Renderização (Sem alterações) ---
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