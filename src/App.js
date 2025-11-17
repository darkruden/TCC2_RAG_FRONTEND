// CÓDIGO COMPLETO PARA: src/App.js
// (Versão final com otimizações de performance React.memo/useMemo)

import React, { useEffect, useRef, useMemo, useState } from 'react';
import { 
  Container, Box, Alert, Stack, TextField, IconButton,
  CircularProgress, Paper, Typography, Chip, Tooltip
} from '@mui/material';
import { 
    Send as SendIcon, 
    AttachFile as AttachFileIcon
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown'; 
import Header from './components/Header';
import { useQuery } from '@tanstack/react-query';
import { useChatStore } from './store/chatStore'; 

import { 
    iniciarChat,
    fetchChatStream,
    testarConexao,
    createApiClient 
} from './services/api'; 
import AgendamentosModal from './components/AgendamentosModal';

// Otimização de performance: O componente de mensagem é memorizado
const ChatMessage = React.memo(function ChatMessage({ message }) {
  const isUser = message.sender === 'user';
  return (
    <Box sx={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', mb: 2 }}>
      <Paper 
        variant="outlined"
        sx={{
          p: 1.5, 
          bgcolor: isUser ? 'primary.main' : 'background.paper',
          color: isUser ? 'primary.contrastText' : 'text.primary',
          maxWidth: '80%', 
          borderRadius: isUser ? '20px 20px 5px 20px' : '20px 20px 20px 5px',
          
          // --- ESTILOS PARA O CONTEÚDO MARKDOWN (MANTIDOS) ---
          '& h1, & h2, & h3, & h4, & h5, & h6': {
            mt: 1, 
            mb: 1,
            fontWeight: 'bold',
            color: isUser ? 'inherit' : 'primary.main', 
            borderBottom: 'none' 
          },
          '& code': {
            backgroundColor: isUser ? 'rgba(255, 255, 255, 0.2)' : 'rgba(139, 148, 158, 0.2)', 
            borderRadius: '4px',
            px: '4px',
            py: '2px',
            fontSize: '90%',
          },
          '& pre': {
            backgroundColor: '#0d1117', 
            color: '#c9d1d9',
            p: 1,
            borderRadius: '6px',
            overflowX: 'auto',
            mt: 1,
            mb: 0,
            whiteSpace: 'pre-wrap', 
          },
          '& ul, & ol': {
            pl: 2, 
            mt: 0,
            mb: 0,
            '& li': {
                mt: 0.5,
                mb: 0,
            }
          },
          '& p': {
            m: 0, 
          }
          // --- FIM DOS ESTILOS ---
        }}
      >
        <Typography component="div" variant="body2">
          <ReactMarkdown>{message.text}</ReactMarkdown>
        </Typography>
      </Paper>
    </Box>
  );
});


function App({ apiToken, userEmail, onLogout }) {
  
  const {
    messages, addMessage, inputPrompt, setInputPrompt,
    arquivo, setArquivo, clearChat,
    isStreaming, startBotMessage, appendLastMessage, finishBotMessage
  } = useChatStore((state) => state);

  const [schedulesModalOpen, setSchedulesModalOpen] = useState(false);
  const [activeJob, setActiveJob] = useState(null); 

  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);
  
  const isInputDisabled = isStreaming || !apiToken || activeJob !== null;
  
  const apiClient = useMemo(() => {
    return createApiClient(apiToken); 
  }, [apiToken]);

  const { data: backendStatus, isError: backendIsError } = useQuery({
    queryKey: ['backendStatus', apiClient], 
    queryFn: () => testarConexao(apiClient),
    select: (data) => data.status === 'online',
    retry: 1,
    enabled: !!apiToken
  });
  
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (window.chrome && chrome.runtime && chrome.runtime.onMessage) {
      
      const messageListener = (request, sender, sendResponse) => {
        console.log("App.js recebeu mensagem:", request);
        
        if (request.action === 'job_finished') {
          addMessage('bot', request.message);
          setActiveJob(null);
        } else if (request.action === 'job_failed') {
          addMessage('bot', `❌ **Tarefa Falhou:** ${request.error}`);
          setActiveJob(null);
        } else if (request.action === 'job_status_update' && request.jobId === activeJob?.jobId) {
            setActiveJob(prev => ({ ...prev, message: request.message }));
        }
        
        sendResponse({ success: true });
        return true;
      };

      chrome.runtime.onMessage.addListener(messageListener);
      
      return () => {
        chrome.runtime.onMessage.removeListener(messageListener);
      };

    } else {
      console.warn("API chrome.runtime.onMessage não encontrada.");
    }
  }, [addMessage, activeJob]);
  
  const handleAttachClick = () => { 
    if (isInputDisabled) return;
    fileInputRef.current.click(); 
  };
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
  
  const handleClearChat = () => { 
    if (isInputDisabled) {
      addMessage('bot', "Não posso limpar o chat enquanto um job estiver ativo. Aguarde.");
      return;
    }
    clearChat(); 
  };
  
  // --- LÓGICA DE SUBMIT (sem alterações) ---
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    const prompt = inputPrompt.trim();
    if (isInputDisabled || (!prompt && !arquivo)) return;
    
    const userPrompt = prompt || (arquivo ? `Analisar o arquivo: ${arquivo.name}` : '');
    
    const newMessage = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      text: userPrompt + (arquivo ? `\n(Anexado: ${arquivo.name})` : '')
    };
    
    const newMessages = [...messages, newMessage];

    addMessage(newMessage.sender, newMessage.text);
    setInputPrompt(''); 
    
    try {
      const data = await iniciarChat(
        apiClient, 
        newMessages,
        userPrompt,
        arquivo
      );
      
      if (arquivo) handleRemoveFile();

      switch (data.response_type) {
        
        case 'stream_answer':
          startBotMessage();
          
          await fetchChatStream({
            streamArgs: data.message,
            apiToken: apiToken,
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
          setActiveJob({ jobId: data.job_id, type: 'general', message: data.message });
          
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

  // --- Renderização ---
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
        <Header 
          userEmail={userEmail} 
          onLogout={onLogout} 
          onOpenSchedules={() => setSchedulesModalOpen(true)}
          onClearChat={handleClearChat} 
        />
      </Box>
      
      {backendStatus === false && (
         <Alert severity="error" sx={{ m: 2.5, mt: 0 }}>
           Não foi possível conectar ao backend.
         </Alert>
      )}
      
      {/* CHIP DE STATUS PARA JOB ATIVO */}
      {activeJob && (
         <Chip
           icon={<CircularProgress size={16} color="inherit" sx={{ mr: 1 }} />}
           label={activeJob.message || "Tarefa em andamento..."}
           color="secondary"
           variant="filled"
           sx={{ m: 2.5, mt: 1, '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' } }}
         />
      )}
      
      {/* TEXTO DE DICAS */}
      {!isInputDisabled && messages.length <= 1 && (
        <Box sx={{ px: 2.5, pb: 1, mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
             💡 Dicas: Tente "Ingerir user/repo" ou "Relatório de quem mais contribuiu".
          </Typography>
        </Box>
      )}
      
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2.5, pt: isInputDisabled ? 0 : 2.5 }}>
        {/* Renderiza o histórico de mensagens */}
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {isStreaming && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
            <CircularProgress size={20} sx={{ ml: 1.5 }} />
          </Box>
        )}
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
        {arquivo && (
          <Chip
            label={arquivo.name}
            onDelete={handleRemoveFile}
            color="secondary" 
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
          <Tooltip title={isInputDisabled ? "Aguarde a conclusão da tarefa" : "Anexar arquivo (.txt, .md)"}>
            <IconButton 
              onClick={handleAttachClick} 
              disabled={isInputDisabled || !backendStatus}
              aria-label="Anexar arquivo"
              color={arquivo ? "secondary" : "default"}
            >
              <AttachFileIcon />
            </IconButton>
          </Tooltip>
          
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            placeholder="Pergunte, ingira ou anexe um..."
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            disabled={isInputDisabled || !backendStatus}
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
            disabled={isInputDisabled || (!inputPrompt.trim() && !arquivo)}
          >
            <SendIcon />
          </IconButton>
        </Stack>
      </Box>
      
      <AgendamentosModal 
        open={schedulesModalOpen}
        onClose={() => setSchedulesModalOpen(false)}
        apiClient={apiClient}
      />
      
    </Container> 
  );
}

export default App;