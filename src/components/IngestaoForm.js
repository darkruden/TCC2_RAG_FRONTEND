// src/components/IngestaoForm.js (MUI)
import React, { useState, useEffect } from 'react';
import { Stack, TextField, Typography } from '@mui/material';
import { LoadingButton } from '@mui/lab';
// A importação do 'api.js' permanece
import { extrairInfoRepositorio } from '../services/api';

const IngestaoForm = ({ onSubmit, loading }) => {
  const [repositorio, setRepositorio] = useState('');
  const [issuesLimit, setIssuesLimit] = useState(50);
  const [prsLimit, setPrsLimit] = useState(20);
  const [commitsLimit, setCommitsLimit] = useState(30);

  // ... (A lógica de useEffect permanece a mesma) ...
  useEffect(() => {
    if (window.chrome && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].url) {
          const url = tabs[0].url;
          const m = url.match(/github\.com\/([^\/]+\/[^\/]+)/);
          if (m && m[1]) setRepositorio(m[1]);
        }
      });
    } else {
      console.warn("Não é uma extensão, preencha o repo manualmente.");
    }
  }, []);

  const handleSubmit = (e) => {
        e.preventDefault();
        if (!repositorio.trim()) return;
    
        // 1. Organiza os dados em uma variável (opcional, mas mais limpo)
        const dadosIngestao = {
          repositorio: repositorio.trim(),
          issues_limit: parseInt(issuesLimit, 10) || 50,
          prs_limit: parseInt(prsLimit, 10) || 20,
          commits_limit: parseInt(commitsLimit, 10) || 30
        };
    if (window.chrome && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ action: 'ingestaoIniciada' });
    }
    onSubmit(dadosIngestao); 
  };
  
  return (
    <Stack as="form" onSubmit={handleSubmit} spacing={2} width="100%">
      
      <TextField
        label="Repositório GitHub"
        id="repositorio-ingest"
        placeholder="usuario/repositorio"
        value={repositorio}
        onChange={(e) => setRepositorio(e.target.value)}
        required
        fullWidth
        variant="outlined"
      />
        
      <Stack spacing={1}>
        <Typography variant="caption" color="text.secondary" sx={{ml: 0.5}}>
          Limites de Ingestão (Opcional):
        </Typography>
        {/* Stack horizontal para os inputs de número */}
        <Stack direction="row" spacing={1.5}>
          <TextField
            label="Issues"
            type="number"
            value={issuesLimit}
            onChange={(e) => setIssuesLimit(e.target.value)}
            variant="outlined"
            size="small"
          />
          <TextField
            label="PRs"
            type="number"
            value={prsLimit}
            onChange={(e) => setPrsLimit(e.target.value)}
            variant="outlined"
            size="small"
          />
          <TextField
            label="Commits"
            type="number"
            value={commitsLimit}
            onChange={(e) => setCommitsLimit(e.target.value)}
            variant="outlined"
            size="small"
          />
        </Stack>
      </Stack>
        
      <LoadingButton
        type="submit"
        loading={loading}
        variant="contained"
        fullWidth
      >
        <span>Iniciar Ingestão</span>
      </LoadingButton>
    </Stack>
  );
};

export default IngestaoForm;