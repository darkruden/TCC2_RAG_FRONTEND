// src/components/RelatorioForm.js (MUI - Correção Final de Importação)
import React, { useState } from 'react';
import { 
  Stack, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  ButtonGroup,
  Button // <-- AQUI ESTÁ A CORREÇÃO
} from '@mui/material';
import { LoadingButton } from '@mui/lab';

const RelatorioForm = () => {
  const [loading, setLoading] = useState(false);
  const [formato, setFormato] = useState('markdown');

  const handleGerarRelatorio = (e) => {
    e.preventDefault();
    setLoading(true);
    console.log(`Gerando relatório em formato ${formato}...`);
    setTimeout(() => { setLoading(false); }, 2000);
  };

  const handleDownload = () => {
    console.log("Iniciando download...");
  };

  return (
    <Stack as="form" onSubmit={handleGerarRelatorio} spacing={2} width="100%">
      
      <FormControl fullWidth variant="outlined">
        <InputLabel id="formato-relatorio-label">Formato</InputLabel>
        <Select
          labelId="formato-relatorio-label"
          id="formato-relatorio"
          value={formato}
          onChange={(e) => setFormato(e.target.value)}
          label="Formato"
        >
          <MenuItem value="markdown">Markdown (.md)</MenuItem>
          <MenuItem value="pdf">PDF (.pdf)</MenuItem>
        </Select>
      </FormControl>

      <ButtonGroup fullWidth>
        <LoadingButton
          type="submit"
          loading={loading}
          variant="contained"
          fullWidth
        >
          <span>Gerar Relatório</span>
        </LoadingButton>
        
        {/* Este é o botão que estava causando o erro */}
        <Button
          type="button"
          onClick={handleDownload}
          disabled={loading}
          variant="outlined"
          fullWidth
        >
          Download
        </Button>
      </ButtonGroup>
    </Stack>
  );
};

export default RelatorioForm;