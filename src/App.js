// CÓDIGO COMPLETO PARA: src/App.js
// (Implementa Itens 1 e 2: Persistência de Chat e Polling via Background)

import React, { useState, useEffect, useRef } from 'react';
import { 
  Container, Box, Alert, Stack, TextField, IconButton,
  CircularProgress, Paper, Typography, Chip
} from '@mui/material';
import { 
    Send as SendIcon, 
    AttachFile as AttachFileIcon,
    ClearAll as ClearAllIcon // <-- Ícone para limpar chat
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import Header from './components/Header';
import { 
    enviarMensagemChat,
    enviarMensagemComArquivo,
    testarConexao, 
    // getIngestStatus e getReportStatus são REMOVIDOS daqui
    // O background script cuidará disso
    getConfig
} from './services/api';

// (Componente ChatMessage não muda)
function ChatMessage({ message }) {
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
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // --- ITEM 1: Persistência do Chat ---
  const [messages, setMessages] = useState([]); // Começa vazio
  
  const [arquivo, setArquivo] = useState(null);
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  // --- ITEM 1: Hook para CARREGAR chat do storage ---
  useEffect(() => {
    // Carrega o histórico de mensagens salvo quando o popup abre
    if (window.chrome && chrome.storage) {
      chrome.storage.local.get(['chatMessages'], (result) => {
        if (result.chatMessages && result.chatMessages.length > 0) {
          setMessages(result.chatMessages);
        } else {
          // Define a mensagem inicial se o histórico estiver vazio
          setMessages([{ id: '1', sender: 'bot', text: 'Olá! Como posso ajudar? Posso ingerir, consultar ou salvar uma instrução anexando um arquivo .txt.' }]);
        }
      });
    }
  }, []); // Roda apenas uma vez na inicialização

  // --- ITEM 1: Hook para SALVAR chat no storage ---
  useEffect(() => {
    // Salva o histórico de mensagens a cada mudança
    if (window.chrome && chrome.storage && messages.length > 0) {
      chrome.storage.local.set({ chatMessages: messages });
    }
  }, [messages]); // Roda toda vez que 'messages' muda

  // Hook para rolar o chat para baixo
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
      // O background.js nos enviará mensagens quando um job terminar
      if (request.action === 'job_finished') {
        addMessage('bot', `✅ **Tarefa Concluída:** ${request.message}`);
      } else if (request.action === 'job_failed') {
        addMessage('bot', `❌ **Tarefa Falhou:** ${request.error}`);
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    // Limpa o listener quando o componente desmonta
    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []); // Roda apenas uma vez
  
  const addMessage = (sender, text) => {
    setMessages(prev => [...prev, { id: Date.now().toString(), sender, text }]);
  };

  const handleAttachClick = () => { fileInputRef.current.click(); };
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 500 * 1024) {
        addMessage('bot', '❌ **Erro:** O arquivo é muito grande (limite de 500KB).'); return;
      }
      if (!file.type.startsWith('text/')) {
        addMessage('bot', '❌ **Erro:** Tipo de arquivo inválido. Apenas .txt ou .md.'); return;
      }
      setArquivo(file);
    }
  };
  const handleRemoveFile = () => {
    setArquivo(null);
    if (fileInputRef.current) fileInputRef.current.value = null;
  };
  
  // --- ITEM 1: Função para Limpar o Chat ---
  const handleClearChat = () => {
    const initialMessage = [{ id: '1', sender: 'bot', text: 'Olá! Como posso ajudar?' }];
    setMessages(initialMessage);
    // Limpa também o storage
    if (window.chrome && chrome.storage) {
      chrome.storage.local.set({ chatMessages: initialMessage });
    }
  };

  // --- LÓGICA DE SUBMIT ATUALIZADA (Item 2) ---
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    const prompt = inputPrompt.trim();
    if (isLoading || (!prompt && !arquivo)) return;
    
    const userPrompt = prompt || (arquivo ? `Analisar o arquivo: ${arquivo.name}` : '');
    
    addMessage('user', userPrompt + (arquivo ? `\n(Anexado: ${arquivo.name})` : ''));
    setInputPrompt('');
    setIsLoading(true);

    try {
      let data;
      if (arquivo) {
        data = await enviarMensagemComArquivo(userPrompt, arquivo);
        handleRemoveFile();
      } else {
        data = await enviarMensagemChat(userPrompt);
      }
      
      // Processa a resposta do Roteador
      switch (data.response_type) {
        case 'answer':
        case 'clarification':
          addMessage('bot', data.message);
          break;
          
        case 'job_enqueued':
          addMessage('bot', data.message);
          
          // --- ITEM 2: AVISA O BACKGROUND PARA COMEÇAR O POLLING ---
          const jobType = data.message.includes('ingestão') ? 'ingest' : 'report';
          chrome.runtime.sendMessage({
            action: 'startPolling',
            jobId: data.job_id,
            type: jobType
          });
          // O App.js não faz mais o polling.
          // ----------------------------------------------------
          
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

  // --- REMOVIDO (Item 2) ---
  // O useEffect[pollingIngestJobId] foi totalmente removido.
  // O useEffect[pollingReportJobId] foi totalmente removido.
  // O background.js agora cuida disso.

  return (
    <Container 
      disableGutters 
      sx={{ 
        height: '600px',
        minWidth: '380px', // <-- Correção de layout
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        p: 0,
        bgcolor: 'background.default'
      }}
    >
      <Box sx={{ p: 2.5, pb: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Header />
        {/* --- ITEM 1: Botão de Limpar Chat --- */}
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
            autoFocus // Foca o input ao abrir
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