// CÓDIGO COMPLETO PARA: src/App.js

import React, { useEffect, useRef, useMemo, useState } from 'react';
import { 
  Container, Box, Alert, Stack, TextField, IconButton,
  CircularProgress, Paper, Typography, Chip, Tooltip, Link, List, ListItem
} from '@mui/material';
import { 
    Send as SendIcon, 
    AttachFile as AttachFileIcon,
    Launch as LaunchIcon,
    BugReport as BugReportIcon,
    CallMerge as PullRequestIcon,
    Commit as CommitIcon,
    Description as FileIcon
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

// --- COMPONENTE CHAT MESSAGE (Memorizado) ---
const ChatMessage = React.memo(function ChatMessage({ message }) {
  const isUser = message.sender === 'user';
  
  const getSourceIcon = (tipo) => {
    switch (tipo) {
      case 'issue': return <BugReportIcon sx={{ fontSize: '0.9rem', mr: 0.5, mt:0.3 }} />;
      case 'pull_request': return <PullRequestIcon sx={{ fontSize: '0.9rem', mr: 0.5, mt:0.3 }} />;
      case 'commit': return <CommitIcon sx={{ fontSize: '0.9rem', mr: 0.5, mt:0.3 }} />;
      default: return <FileIcon sx={{ fontSize: '0.9rem', mr: 0.5, mt:0.3 }} />;
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', mb: 2 }}>
      <Paper 
        variant="outlined"
        sx={{
          p: 1.5, 
          bgcolor: isUser ? 'primary.main' : 'background.paper',
          color: isUser ? 'primary.contrastText' : 'text.primary',
          maxWidth: '85%',
          borderRadius: isUser ? '20px 20px 5px 20px' : '20px 20px 20px 5px',
          
          '& h1, & h2, & h3, & h4, & h5, & h6': { mt: 1, mb: 1, fontWeight: 'bold', color: isUser ? 'inherit' : 'primary.main', borderBottom: 'none' },
          '& code': { backgroundColor: isUser ? 'rgba(255, 255, 255, 0.2)' : 'rgba(139, 148, 158, 0.2)', borderRadius: '4px', px: '4px', py: '2px', fontSize: '90%' },
          '& pre': { backgroundColor: '#0d1117', color: '#c9d1d9', p: 1, borderRadius: '6px', overflowX: 'auto', mt: 1, mb: 0, whiteSpace: 'pre-wrap' },
          '& ul, & ol': { pl: 2, mt: 0, mb: 0, '& li': { mt: 0.5, mb: 0 } },
          '& p': { m: 0 },
          '& a': { color: isUser ? 'inherit' : 'primary.main', textDecoration: 'underline' }
        }}
      >
        <Typography component="div" variant="body2">
          <ReactMarkdown linkTarget="_blank">{message.text}</ReactMarkdown>
        </Typography>

        {message.sources && message.sources.length > 0 && !isUser && (
          <Box sx={{ mt: 2, pt: 1, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <Typography variant="caption" sx={{ opacity: 0.7, fontWeight: 'bold', mb: 0.5, display: 'block' }}>
              Fontes utilizadas:
            </Typography>
            <List dense disablePadding>
              {message.sources.map((fonte, idx) => (
                <ListItem key={idx} disableGutters sx={{ py: 0.2, alignItems: 'flex-start' }}>
                  {getSourceIcon(fonte.tipo)}
                  <Link 
                    href={fonte.url} 
                    target="_blank" 
                    rel="noopener"
                    color="inherit"
                    variant="caption"
                    sx={{ 
                        wordBreak: 'break-all', 
                        display: 'flex', 
                        alignItems: 'center',
                        textDecoration: 'none',
                        '&:hover': { textDecoration: 'underline', color: 'primary.main' }
                    }}
                  >
                    {fonte.file_path || "Fonte Externa"}
                    <LaunchIcon sx={{ fontSize: '0.7rem', ml: 0.5 }} />
                  </Link>
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </Paper>
    </Box>
  );
});

// --- COMPONENTE APP PRINCIPAL ---
function App({ apiToken, userEmail, onLogout }) {
  
  const {
    messages, addMessage, inputPrompt, setInputPrompt,
    arquivo, setArquivo, clearChat,
    isStreaming, startBotMessage, appendLastMessage, finishBotMessage,
    setLastMessageSources
  } = useChatStore((state) => state);

  const [schedulesModalOpen, setSchedulesModalOpen] = useState(false);
  const [activeJob, setActiveJob] = useState(null); 

  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);
  
  const isInputDisabled = isStreaming || !apiToken || activeJob !== null;
  
  const apiClient = useMemo(() => {
    return createApiClient(apiToken); 
  }, [apiToken]);

  const { data: backendStatus } = useQuery({
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
        if (request.action === 'job_finished') {
          addMessage('bot', request.message);
          setActiveJob(null);
        } else if (request.action === 'job_failed') {
          addMessage('bot', `❌ **Tarefa Falhou:** ${request.error}`);
          setActiveJob(null);
        }
        sendResponse({ success: true });
        return true;
      };
      chrome.runtime.onMessage.addListener(messageListener);
      return () => { chrome.runtime.onMessage.removeListener(messageListener); };
    }
  }, [addMessage]);
  
  const handleAttachClick = () => { if (!isInputDisabled) fileInputRef.current.click(); };
  const handleFileChange = (e) => { setArquivo(e.target.files[0]); };
  const handleRemoveFile = () => { setArquivo(null); if (fileInputRef.current) fileInputRef.current.value = null; };
  const handleClearChat = () => { if (!isInputDisabled) clearChat(); };
  
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    const prompt = inputPrompt.trim();
    if (isInputDisabled || (!prompt && !arquivo)) return;
    
    const userPrompt = prompt || (arquivo ? `Analisar o arquivo: ${arquivo.name}` : '');
    const newMessage = { id: `msg_${Date.now()}`, sender: 'user', text: userPrompt + (arquivo ? `\n(Anexado: ${arquivo.name})` : '') };
    const newMessages = [...messages, newMessage];

    addMessage(newMessage.sender, newMessage.text);
    setInputPrompt(''); 
    
    try {
      const data = await iniciarChat(apiClient, newMessages, userPrompt, arquivo);
      if (arquivo) handleRemoveFile();

      switch (data.response_type) {
        case 'stream_answer':
          startBotMessage();
          await fetchChatStream({
            streamArgs: data.message,
            apiToken: apiToken,
            onToken: (token) => { appendLastMessage(token); },
            onSources: (sources) => { setLastMessageSources(sources); },
            onComplete: () => { finishBotMessage(); },
            onError: (err) => { appendLastMessage(`\n\n**Erro:** ${err.message}`); finishBotMessage(); }
          });
          break;
        
        case 'answer':
        case 'clarification':
          addMessage('bot', data.message);
          break;
          
        case 'job_enqueued':
          setActiveJob({ jobId: data.job_id, type: 'general', message: data.message });
          addMessage('bot', data.message);
          if (window.chrome && chrome.runtime) {
            const jobType = data.message.includes('ingestão') ? 'ingest' : 'report';
            chrome.runtime.sendMessage({ action: 'startPolling', jobId: data.job_id, type: jobType });
          }
          break;
          
        default:
          addMessage('bot', `Houve um erro: ${data.message}`);
      }
    } catch (error) {
      addMessage('bot', `Erro: ${error.message}`);
    }
  };

  return (
    <Container disableGutters sx={{ height: '100vh', minWidth: '380px', width: '100%', display: 'flex', flexDirection: 'column', p: 0, bgcolor: 'background.default' }}>
      <Box sx={{ p: 2.5, pb: 0 }}>
        <Header userEmail={userEmail} onLogout={onLogout} onOpenSchedules={() => setSchedulesModalOpen(true)} onClearChat={handleClearChat} />
      </Box>
      
      {backendStatus === false && <Alert severity="error" sx={{ m: 2.5, mt: 0 }}>Backend offline.</Alert>}
      
      {activeJob && (
         <Chip icon={<CircularProgress size={16} color="inherit" />} label={activeJob.message} color="secondary" variant="filled" sx={{ m: 2.5, mt: 1 }} />
      )}
      
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2.5 }}>
        {messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)}
        {isStreaming && <Box sx={{ display: 'flex', mb: 2 }}><CircularProgress size={20} sx={{ ml: 1.5 }} /></Box>}
        <div ref={chatEndRef} />
      </Box>
      
      <Box as="form" onSubmit={handleChatSubmit} sx={{ p: 2.5, borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        {arquivo && <Chip label={arquivo.name} onDelete={handleRemoveFile} color="secondary" size="small" sx={{ mb: 1 }} />}
        <Stack direction="row" spacing={1} alignItems="center">
          <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept=".txt,.md" />
          <Tooltip title="Anexar"><IconButton onClick={handleAttachClick} disabled={isInputDisabled}><AttachFileIcon /></IconButton></Tooltip>
          <TextField fullWidth variant="outlined" size="small" placeholder="Digite sua mensagem..." value={inputPrompt} onChange={(e) => setInputPrompt(e.target.value)} disabled={isInputDisabled} autoFocus />
          <IconButton type="submit" color="primary" disabled={isInputDisabled || (!inputPrompt.trim() && !arquivo)}><SendIcon /></IconButton>
        </Stack>
      </Box>
      <AgendamentosModal open={schedulesModalOpen} onClose={() => setSchedulesModalOpen(false)} apiClient={apiClient} />
    </Container> 
  );
}

export default App;