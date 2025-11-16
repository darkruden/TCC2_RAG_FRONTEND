// CÓDIGO COMPLETO PARA: src/App.js
// (Implementa Item 2: Persistência do Input de Chat)
// (Remove lógica de download, que agora está no background.js)

import React, { useState, useEffect, useRef } from 'react';
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
import { 
    enviarMensagemChat,
    enviarMensagemComArquivo,
    testarConexao
    // (Não precisamos mais de 'getConfig', 'getIngestStatus', 'getReportStatus')
} from './services/api'; 

// (Componente ChatMessage não muda)
function ChatMessage({ message }) {
  const isUser = message.sender === 'user';
  return (
    <Box sx={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', mb: 2 }}>
      <Paper 
        variant="outlined"
        sx={{ p: 1.5, bgcolor: isUser ? 'primary.main' : 'background.paper',
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
  const [backendStatus, setBackendStatus] = useState(null);
  const [inputPrompt, setInputPrompt] = useState(''); // <-- Item 2
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [arquivo, setArquivo] = useState(null);
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  // --- ITEM 1 & 2: Hook para CARREGAR estado do storage ---
  useEffect(() => {
    if (window.chrome && chrome.storage) {
      // Pede para o background resetar o badge de notificação
      chrome.runtime.sendMessage({ action: 'popupAbertoResetarBadge' });
      
      // Carrega o histórico de chat E o input salvo
      chrome.storage.local.get(['chatMessages', 'inputPrompt'], (result) => {
        if (result.chatMessages && result.chatMessages.length > 0) {
          setMessages(result.chatMessages);
        } else {
          setMessages([{ id: '1', sender: 'bot', text: 'Olá! Como posso ajudar?' }]);
        }
        // Restaura o texto que o usuário estava digitando
        if (result.inputPrompt) {
          setInputPrompt(result.inputPrompt);
        }
      });
    }
  }, []); // Roda apenas uma vez

  // --- ITEM 1: Hook para SALVAR chat ---
  useEffect(() => {
    if (window.chrome && chrome.storage && messages.length > 0) {
      chrome.storage.local.set({ chatMessages: messages });
    }
  }, [messages]);

  // --- ITEM 2: Hook para SALVAR input ---
  useEffect(() => {
    // Salva o rascunho do input
    if (window.chrome && chrome.storage) {
      chrome.storage.local.set({ inputPrompt: inputPrompt });
    }
  }, [inputPrompt]); // Roda toda vez que o input muda

  // Hook para rolar o chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Hook para testar a conexão (não muda)
  useEffect(() => {
    (async () => {
      try {
        const resposta = await testarConexao();
        setBackendStatus(resposta.status === 'online');
      } catch (erro) {
        setBackendStatus(false);
      }
    })();
  }, []);
  
  // --- ITEM 2: Hook para OUVIR o background script ---
  useEffect(() => {
    const messageListener = (request, sender, sendResponse) => {
      console.log("App.js recebeu mensagem:", request);
      
      if (request.action === 'job_finished') {
        // (A lógica de download foi REMOVIDA daqui)
        addMessage('bot', request.message);
      } else if (request.action === 'job_failed') {
        addMessage('bot', `❌ **Tarefa Falhou:** ${request.error}`);
      }
      
      // Confirma o recebimento
      sendResponse({ success: true });
      return true;
    };

    chrome.runtime.onMessage.addListener(messageListener);
    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []); // Roda apenas uma vez
  
  const addMessage = (sender, text) => {
    setMessages(prev => [...prev, { id: Date.now().toString(), sender, text }]);
  };

  // (Funções de Anexo não mudam)
  const handleAttachClick = () => { fileInputRef.current.click(); };
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 500 * 1024) { addMessage('bot', '❌ **Erro:** O arquivo é muito grande (500KB).'); return; }
      if (!file.type.startsWith('text/')) { addMessage('bot', '❌ **Erro:** Tipo de arquivo inválido.'); return; }
      setArquivo(file);
    }
  };
  const handleRemoveFile = () => {
    setArquivo(null);
    if (fileInputRef.current) fileInputRef.current.value = null;
  };
  
  const handleClearChat = () => {
    const initialMessage = [{ id: '1', sender: 'bot', text: 'Olá! Como posso ajudar?' }];
    setMessages(initialMessage);
    setInputPrompt(''); // Limpa o input
    // Limpa o storage
    if (window.chrome && chrome.storage) {
      chrome.storage.local.set({ 
        chatMessages: initialMessage,
        inputPrompt: '' 
      });
    }
  };

  // --- LÓGICA DE SUBMIT ATUALIZADA (Item 2) ---
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    const prompt = inputPrompt.trim();
    if (isLoading || (!prompt && !arquivo)) return;
    
    const userPrompt = prompt || (arquivo ? `Analisar o arquivo: ${arquivo.name}` : '');
    
    addMessage('user', userPrompt + (arquivo ? `\n(Anexado: ${arquivo.name})` : ''));
    
    // --- ITEM 2: Limpa o input E O CACHE do input ---
    setInputPrompt(''); 
    if (window.chrome && chrome.storage) {
      chrome.storage.local.set({ inputPrompt: '' });
    }
    // --- Fim da mudança ---
    
    setIsLoading(true);

    try {
      let data;
      if (arquivo) {
        data = await enviarMensagemComArquivo(userPrompt, arquivo);
        handleRemoveFile();
      } else {
        data = await enviarMensagemChat(userPrompt);
      }
      
      switch (data.response_type) {
        case 'answer':
        case 'clarification':
          addMessage('bot', data.message);
          break;
        case 'job_enqueued':
          addMessage('bot', data.message);
          // Avisa o background para começar o polling
          const jobType = data.message.includes('ingestão') ? 'ingest' : 'report';
          chrome.runtime.sendMessage({
            action: 'startPolling',
            jobId: data.job_id,
            type: jobType
          });
          break;
        case 'error':
        default:
          addMessage('bot', `Houve um erro: ${data.message}`);
          break;
      }
    } catch (error) {
      console.error('Erro no handleChatSubmit:', error);
      addMessage('bot', `Erro ao conectar com o backend: ${error.detail || error.message}`);
    } finally {
      setIsLoading(false);
      if (arquivo) handleRemoveFile();
    }
  };

  // --- POLLING REMOVIDO DAQUI ---

  return (
    <Container 
      disableGutters 
      sx={{ 
        height: '600px',
        minWidth: '380px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        p: 0,
        bgcolor: 'background.default'
      }}
    >
      <Box sx={{ p: 2.5, pb: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Header />
        <IconButton onClick={handleClearChat} title="Limpar histórico do chat" size="small">
          <ClearAllIcon />
        </IconButton>
      </Box>
      
      {backendStatus !== null && (
        <Box sx={{ p: 2.5, pt: 1, pb: 1 }}>
          <Alert severity={backendStatus ? 'success' : 'error'} sx={{ mb: 0 }}>
            {backendStatus ? 'Conectado ao backend' : 'Backend offline'}
          </Alert>
        </Box>
      )}
      
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2.5 }}>
        <Stack spacing={1}>
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          {isLoading && (
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
          p: 2.5,
          borderTop: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper'
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
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
            accept=".txt,.md,text/plain,text/markdown"
          />
          <IconButton 
            onClick={handleAttachClick} 
            disabled={isLoading || !backendStatus}
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
            disabled={isLoading || !backendStatus}
            autoFocus
          />
          <IconButton 
            type="submit" 
            color="primary" 
            disabled={isLoading || (!inputPrompt.trim() && !arquivo)}
          >
            <SendIcon />
          </IconButton>
        </Stack>
      </Box>
      
    </Container> 
  );
}

export default App;