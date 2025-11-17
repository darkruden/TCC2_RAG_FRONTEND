// CÓDIGO COMPLETO PARA: src/App.js
// (Refatorado para aceitar props de autenticação do AppWrapper)

import React, { useEffect, useRef, useMemo } from 'react'; // Removido o useState
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
    testarConexao,
    createApiClient // <-- Importa o novo helper
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

// --- 1. ACEITAR PROPS DE AUTH ---
function App({ apiToken, userEmail, onLogout }) {
  
  // ==================================================================
  // 1. Hooks de Gerenciamento de Estado (Zustand)
  // ==================================================================
  
  const {
    messages, addMessage, inputPrompt, setInputPrompt,
    arquivo, setArquivo, clearChat,
    isStreaming, startBotMessage, appendLastMessage, finishBotMessage
  } = useChatStore((state) => state); // Removido 'submitPrompt'

  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);
  
  // (Removido o useState para apiToken e apiUrl)

  // ==================================================================
  // 2. Configuração Centralizada da API
  // ==================================================================

  // (Removido o useEffect que lia do chrome.storage, o AppWrapper faz isso)

  // --- 2. USA O API TOKEN DA PROP ---
  const apiClient = useMemo(() => {
    return createApiClient(apiToken); // Cria o cliente com o token recebido
  }, [apiToken]);

  // ==================================================================
  // 3. Hooks de Estado do Servidor (React Query)
  // ==================================================================

  const { data: backendStatus, isError: backendIsError } = useQuery({
    queryKey: ['backendStatus', apiClient], // A query depende do apiClient (que depende do token)
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

  useEffect(() => {
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
      
      return () => {
        chrome.runtime.onMessage.removeListener(messageListener);
      };

    } else {
      console.warn("API chrome.runtime.onMessage não encontrada (rodando em localhost?). O polling não será recebido aqui.");
    }
  }, [addMessage]);
  
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
  
  // --- LÓGICA DE SUBMIT (Atualizada) ---
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    const prompt = inputPrompt.trim();
    if (isStreaming || (!prompt && !arquivo)) return;
    
    const userPrompt = prompt || (arquivo ? `Analisar o arquivo: ${arquivo.name}` : '');
    
    // 1. Cria o objeto da nova mensagem
    const newMessage = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      text: userPrompt + (arquivo ? `\n(Anexado: ${arquivo.name})` : '')
    };
    
    // 2. Cria a lista de mensagens *completa* que será enviada
    const newMessages = [...messages, newMessage];

    // 3. Atualiza a UI imediatamente (usando as funções do Zustand)
    addMessage(newMessage.sender, newMessage.text);
    setInputPrompt(''); // Limpa o input
    
    try {
      // 4. Envia o histórico COMPLETO para a API
      const data = await iniciarChat(
        apiClient, 
        newMessages,
        userPrompt,
        arquivo
      );
      
      if (arquivo) handleRemoveFile();

      // (Switch case não muda)
      switch (data.response_type) {
        
        case 'stream_answer':
          startBotMessage();
          
          await fetchChatStream({
            streamArgs: data.message,
            apiToken: apiToken, // <-- Passa o token da prop
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

  // --- Renderização (Atualizada) ---
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
        {/* --- 3. PASSA AS PROPS DE AUTH PARA O HEADER --- */}
        <Header userEmail={userEmail} onLogout={onLogout} />
        
        <IconButton onClick={handleClearChat} title="Limpar histórico do chat" size="small" disabled={isStreaming}>
          <ClearAllIcon />
        </IconButton>
      </Box>
      
      {/* ... (Alert de status do backend) ... */}
      
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2.5 }}>
        {/* --- INÍCIO DA CORREÇÃO --- */}
        {/* Renderiza o histórico de mensagens */}
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {/* --- FIM DA CORREÇÃO --- */}
        {/* Div para rolar automaticamente para o final */}
        <div ref={chatEndRef} />
      </Box>
      
      <Box 
        as="form" 
        onSubmit={handleChatSubmit} 
        sx={{
          p: 2.5, borderTop: 1,
          borderColor: 'divider', bgcolor: 'background.paper'
        }}
      >
        {/* ... (Chip do arquivo) ... */}
        
        <Stack direction="row" spacing={1} alignItems="center">
          {/* ... (Botão de anexo) ... */}
          
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            placeholder="Pergunte, ingira ou anexe um..."
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            disabled={isStreaming || !backendStatus}
            autoFocus
            multiline
            maxRows={4}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                if (inputPrompt.trim() || arquivo) {
                  handleChatSubmit(e);
                }
              }
            }}
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