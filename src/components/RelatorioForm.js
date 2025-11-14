// src/components/RelatorioForm.js (MUI - Controlado por App.js)
import React, { useState } from 'react';
import { 
  Stack, 
  TextField,
  Typography,
  Alert
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
// NÃO PRECISAMOS MAIS DA 'api.js' AQUI

// 1. Recebe 'onSubmit' e 'loading' do App.js
const RelatorioForm = ({ repositorio, onSubmit, loading }) => {
  const [error, setError] = useState('');
  
  // 2. O estado do prompt permanece local, o que é bom
  const [prompt, setPrompt] = useState('Faça uma análise de quem mais contribuiu com commits neste repositório e gere um gráfico de barras.');

  const handleGerarRelatorio = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || !repositorio.trim()) {
      setError('Repositório (na aba Consulta) e Prompt são obrigatórios.');
      return;
    }
    
    setError('');
    
    // 3. Chama a função 'onSubmit' do App.js, passando os dados
    onSubmit({
      repositorio: repositorio,
      prompt: prompt
    });
  };

  return (
    <Stack as="form" onSubmit={handleGerarRelatorio} spacing={2} width="100%">
      
      <TextField
        label="Repositório para Análise"
        value={repositorio}
        disabled
        fullWidth
        variant="outlined"
        // Mostra um helper se estiver vazio
        helperText={!repositorio ? "Defina o repositório na aba 'Consulta'" : ""}
      />

      <TextField
        label="Prompt do Relatório"
        id="prompt"
        placeholder="Ex: quem está produzindo mais? qual integrante precisa de atenção?"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        required
        fullWidth
        multiline
        rows={4}
        variant="outlined"
        disabled={loading} // Controlado pelo App.js
      />
      
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        O relatório será gerado em segundo plano e aberto numa nova aba.
      </Typography>

      <LoadingButton
        type="submit"
        loading={loading} // Controlado pelo App.js
        variant="contained"
        fullWidth
      >
        <span>Gerar Relatório Analítico</span>
      </LoadingButton>
      
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      )}
    </Stack>
  );
};

export default RelatorioForm;