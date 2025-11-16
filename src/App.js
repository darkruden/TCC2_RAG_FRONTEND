// CÓDIGO COMPLETO PARA: src/App.js
// (Refatorado com React Query e Zustand)

import React, { useEffect, useRef, useMemo } from 'react';
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
// 1. Importa os hooks de gerenciamento de estado
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useChatStore } from './store/chatStore'; // (Nosso store Zustand)
import axios from 'axios';

// 2. Importa as funções puras da API
import { 
    enviarMensagemChat,
    enviarMensagemComArquivo,
    testarConexao
} from './services/api'; 

// (Componente ChatMessage não muda)
function ChatMessage({ message }) { /* ... (código idêntico ao anterior) ... */ }
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
  
  // Pega o estado e as ações do nosso store global (Zustand)
  const {
    messages, addMessage, inputPrompt, setInputPrompt,
    arquivo, setArquivo, clearChat, submitPrompt
  } = useChatStore((state) => state);

  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  // ==================================================================
  // 2. Configuração Centralizada da API (para React Query)
  // ==================================================================
  
  // 'useMemo' garante que o cliente axios só seja criado uma vez
  const apiClient = useMemo(() => {
    // Pega a config (sincronamente, pois o popup não pode ser async no topo)
    // Usamos os fallbacks que o background.js usa
    // NOTA: Para isso funcionar 100%, o usuário deve salvar as config na página de opções da extensão
    const apiUrl = 'https://meu-tcc-testes-041c1dd46d1d.herokuapp.com';
    const apiToken = 'testebrabotoken';
    
    // (Idealmente, isso leria do chrome.storage, mas faremos síncrono por enquanto)
    
    return axios.create({
      baseURL: apiUrl,
      headers: { 'X-API-Key': apiToken },
      timeout: 60000 
    });
  }, []); // Array vazio = só roda uma vez

  // ==================================================================
  // 3. Hooks de Estado do Servidor (React Query)
  // ==================================================================

  // Hook para testar a conexão (substitui o useEffect de 'testarConexao')
  const { data: backendStatus, isError: backendIsError } = useQuery({
    queryKey: ['backendStatus'],
    queryFn: () => testarConexao(apiClient),
    select: (data) => data.status === 'online', // Transforma a resposta
    retry: 1, // Tenta apenas uma vez
  });

  // Hook de Mutação (substitui o 'handleChatSubmit' e 'isLoading')
  const chatMutation = useMutation({
    // Define a função que será chamada no 'mutate'
    mutationFn: (variables) => {
      const { userPrompt, file } = variables;
      if (file) {
        return enviarMensagemComArquivo(apiClient, userPrompt, file);
      } else {
        return enviarMensagemChat(apiClient, userPrompt);
      }
    },
    // Callback de Sucesso
    onSuccess: (data) => {
      // 'data' é a resposta do backend
      switch (data.response_type) {
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
    },
    // Callback de Erro
    onError: (error) => {
      addMessage('bot', `Erro ao conectar com o backend: ${error.detail || error.message}`);
    }
  });

  // ==================================================================
  // 4. Hooks de UI (Efeitos e Listeners)
  // ==================================================================

  // Hook para rolar o chat (não muda)
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Hook para OUVIR o background script (não muda)
  useEffect(() => {
    const messageListener = (request, sender, sendResponse) => {
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
  }, [addMessage]); // (Adiciona 'addMessage' como dependência)
  
  // (Funções de Anexo não mudam)
  const handleAttachClick = () => { fileInputRef.current.click(); };
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 500 * 1024) { addMessage('bot', '❌ **Erro:** O arquivo é muito grande (500KB).'); return; }
      if (!file.type.startsWith('text/')) { addMessage('bot', '❌ **Erro:** Tipo de arquivo inválido.'); return; }
      setArquivo(file); // Atualiza o store Zustand
    }
  };
  const handleRemoveFile = () => {
    setArquivo(null); // Atualiza o store Zustand
    if (fileInputRef.current) fileInputRef.current.value = null;
  };
  
  const handleClearChat = () => {
    clearChat(); // Chama a ação do store Zustand
  };

  // --- LÓGICA DE SUBMIT (Simplificada) ---
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    const prompt = inputPrompt.trim();
    
    // Usa o estado de loading do React Query
    if (chatMutation.isPending || (!prompt && !arquivo)) return;
    
    const userPrompt = prompt || (arquivo ? `Analisar o arquivo: ${arquivo.name}` : '');
    
    // 1. Atualiza o estado do chat no Zustand
    submitPrompt(userPrompt + (arquivo ? `\n(Anexado: ${arquivo.name})` : ''));
    
    // 2. Chama a mutação do React Query
    chatMutation.mutate({ userPrompt, file: arquivo });

    // 3. Limpa o arquivo (o input de texto já foi limpo pelo 'submitPrompt')
    if (arquivo) handleRemoveFile();
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
        <IconButton onClick={handleClearChat} title="Limpar histórico do chat" size="small" disabled={chatMutation.isPending}>
          <ClearAllIcon />
        </IconButton>
      </Box>
      
      {/* O 'backendStatus' agora vem do 'useQuery' */}
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
          {/* O 'isLoading' agora é 'isPending' do React Query */}
          {chatMutation.isPending && (
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
            disabled={chatMutation.isPending || !backendStatus}
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
            // Chama a ação do store Zustand para atualizar o estado
            onChange={(e) => setInputPrompt(e.target.value)}
            disabled={chatMutation.isPending || !backendStatus}
            autoFocus
          />
          <IconButton 
            type="submit" 
            color="primary" 
            disabled={chatMutation.isPending || (!inputPrompt.trim() && !arquivo)}
          >
            <SendIcon />
          </IconButton>
        </Stack>
      </Box>
      
    </Container> 
  );
}

export default App;