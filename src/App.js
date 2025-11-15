// CÓDIGO COMPLETO PARA: src/App.js
// (Layout corrigido e UI de anexo de arquivo adicionada)

import React, { useState, useEffect, useRef } from 'react';
import { 
  Container, Box, Alert, Stack, TextField, IconButton,
  CircularProgress, Paper, Typography, Chip // <-- Chip adicionado
} from '@mui/material';
import { 
    Send as SendIcon, 
    AttachFile as AttachFileIcon // <-- Ícone de anexo
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import Header from './components/Header';
import { 
    enviarMensagemChat,
    enviarMensagemComArquivo, // <-- NOVA FUNÇÃO (será criada)
    testarConexao, 
    getIngestStatus,
    getReportStatus,
    getConfig
} from './services/api'; // (Assumindo que api.js será atualizado)

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
  const [messages, setMessages] = useState([
    { id: '1', sender: 'bot', text: 'Olá! Como posso ajudar? Você pode ingerir, consultar ou salvar uma instrução anexando um arquivo .txt.' }
  ]);
  
  // --- NOVO ESTADO E REF PARA ARQUIVOS ---
  const [arquivo, setArquivo] = useState(null);
  const fileInputRef = useRef(null); // Ref para o input de arquivo oculto

  // (Lógica de Polling - não muda)
  const [pollingIngestJobId, setPollingIngestJobId] = useState(null);
  const [pollingReportJobId, setPollingReportJobId] = useState(null);
  const ingestInterval = useRef(null);
  const reportInterval = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
  
  const addMessage = (sender, text) => {
    setMessages(prev => [...prev, { id: Date.now().toString(), sender, text }]);
  };

  // --- NOVA LÓGICA DE UPLOAD ---
  const handleAttachClick = () => {
    // Clica no input de arquivo oculto
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 500 * 1024) { // Limite de 500KB
        addMessage('bot', '❌ **Erro:** O arquivo é muito grande (limite de 500KB).');
        return;
      }
      if (!file.type.startsWith('text/')) {
        addMessage('bot', '❌ **Erro:** Tipo de arquivo inválido. Apenas .txt ou .md são permitidos.');
        return;
      }
      setArquivo(file);
    }
  };

  const handleRemoveFile = () => {
    setArquivo(null);
    fileInputRef.current.value = null; // Limpa o input
  };
  
  // --- LÓGICA DE SUBMIT ATUALIZADA ---
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    const prompt = inputPrompt.trim();
    
    // Não permite envio se estiver carregando ou se não houver prompt E arquivo
    if (isLoading || (!prompt && !arquivo)) return;
    
    // Se tiver um arquivo, o prompt é opcional
    const userPrompt = prompt || (arquivo ? `Analisar o arquivo: ${arquivo.name}` : '');
    
    addMessage('user', userPrompt + (arquivo ? `\n(Anexado: ${arquivo.name})` : ''));
    setInputPrompt('');
    setIsLoading(true);

    try {
      let data;
      
      if (arquivo) {
        // --- ROTA DE ARQUIVO ---
        // Chama a nova função de API com FormData
        data = await enviarMensagemComArquivo(userPrompt, arquivo);
        // Limpa o arquivo após o envio
        handleRemoveFile();
      } else {
        // --- ROTA DE TEXTO (Antiga) ---
        data = await enviarMensagemChat(userPrompt);
      }
      
      // Processa a resposta do Roteador (não muda)
      switch (data.response_type) {
        case 'answer':
        case 'clarification':
          addMessage('bot', data.message);
          break;
        case 'job_enqueued':
          addMessage('bot', data.message);
          if (data.message.includes('ingestão')) {
            setPollingIngestJobId(data.job_id);
          } else if (data.message.includes('relatório')) {
            setPollingReportJobId(data.job_id);
          }
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
      // Garante que o estado do arquivo seja limpo
      if (arquivo) handleRemoveFile();
    }
  };

  // (Lógica de Polling de Ingestão - não muda)
  useEffect(() => {
    const pollIngestStatus = async () => { /* ... (código idêntico ao anterior) ... */ };
    if (pollingIngestJobId) {
      const pollIngestStatus = async () => {
        if (!pollingIngestJobId) return;
        try {
          const data = await getIngestStatus(pollingIngestJobId);
          if (data.status === 'finished') {
            addMessage('bot', `✅ **Ingestão Concluída:** ${data.result.mensagem || 'Repositório processado!'}`);
            setPollingIngestJobId(null); clearInterval(ingestInterval.current);
          } else if (data.status === 'failed') {
            addMessage('bot', `❌ **Ingestão Falhou:** ${data.error || 'Erro desconhecido.'}`);
            setPollingIngestJobId(null); clearInterval(ingestInterval.current);
          }
        } catch (err) {
          addMessage('bot', `❌ **Erro de Polling:** ${err.message}`);
          setPollingIngestJobId(null); clearInterval(ingestInterval.current);
        }
      };
      pollIngestStatus();
      ingestInterval.current = setInterval(pollIngestStatus, 5000);
    }
    return () => { if (ingestInterval.current) clearInterval(ingestInterval.current); };
  }, [pollingIngestJobId]);

  // (Lógica de Polling de Relatório - não muda)
  useEffect(() => {
    const pollReportStatus = async () => { /* ... (código idêntico ao anterior) ... */ };
    if (pollingReportJobId) {
      const pollReportStatus = async () => {
        if (!pollingReportJobId) return;
        try {
          const data = await getReportStatus(pollingReportJobId);
          if (data.status === 'finished') {
            const filename = data.result;
            addMessage('bot', `✅ **Relatório Pronto!** Iniciando download de \`${filename}\`...`);
            const { apiUrl, apiToken } = await getConfig(); 
            const downloadUrl = `${apiUrl}/api/relatorio/download/${filename}`;
            fetch(downloadUrl, { method: 'GET', headers: { 'X-API-Key': apiToken } })
            .then(response => {
              if (!response.ok) throw new Error(`Erro de rede: ${response.statusText}`);
              return response.blob();
            })
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none'; a.href = url; a.download = filename;
                document.body.appendChild(a); a.click();
                window.URL.revokeObjectURL(url); document.body.removeChild(a);
                addMessage('bot', 'Download concluído!');
            })
            .catch(err => {
                addMessage('bot', `❌ **Falha no Download:** ${err.message}`);
            });
            setPollingReportJobId(null); clearInterval(reportInterval.current);
          } else if (data.status === 'failed') {
            addMessage('bot', `❌ **Relatório Falhou:** ${data.error || 'Erro desconhecido.'}`);
            setPollingReportJobId(null); clearInterval(reportInterval.current);
          }
        } catch (err) {
          addMessage('bot', `❌ **Erro de Polling:** ${err.message}`);
          setPollingReportJobId(null); clearInterval(reportInterval.current);
        }
      };
      pollReportStatus(); 
      reportInterval.current = setInterval(pollReportStatus, 5000); 
    }
    return () => { if (reportInterval.current) clearInterval(reportInterval.current); };
  }, [pollingReportJobId]);


  return (
    // --- CORREÇÃO DE LAYOUT (PROBLEMA 1) ---
    <Container 
      disableGutters 
      sx={{ 
        height: '600px', // Altura fixa
        minWidth: '380px', // Largura mínima (corrige compressão)
        width: '100%',     // Permite expandir
        display: 'flex',
        flexDirection: 'column',
        p: 0,
        bgcolor: 'background.default'
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
      
      {/* --- UI DE INPUT ATUALIZADA (PROBLEMA 2) --- */}
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
        {/* Chip do arquivo anexado */}
        {arquivo && (
          <Chip
            label={arquivo.name}
            onDelete={handleRemoveFile}
            color="primary"
            size="small"
            sx={{ mb: 1 }}
          />
        )}
        
        {/* Input de texto e botões */}
        <Stack direction="row" spacing={1} alignItems="center">
          
          {/* Input de arquivo (oculto) */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
            accept=".txt,.md,text/plain,text/markdown"
          />
          
          {/* Botão de Anexo */}
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