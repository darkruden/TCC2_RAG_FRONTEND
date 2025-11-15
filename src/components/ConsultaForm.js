// src/components/ConsultaForm.js (MUI - Híbrido com Upload)
import React, { useState } from 'react';
import { Stack, TextField, Button, Typography, Chip } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import UploadFileIcon from '@mui/icons-material/UploadFile';

// 1. Receber as novas props de estado para o ARQUIVO
const ConsultaForm = ({ 
  onSubmit, 
  loading, 
  query, 
  setQuery, 
  repositorio, 
  setRepositorio,
  arquivo,       // <-- Prop de estado para o arquivo
  setArquivo     // <-- Setter do estado do arquivo
}) => {
  
  // 2. O handleSubmit agora só chama o onSubmit (como antes)
  // A lógica de qual API chamar (texto vs arquivo) ficará no App.js
  const handleSubmit = (e) => {
    e.preventDefault();
    // A validação agora é: (ter um arquivo) OU (ter texto e repo)
    if (!arquivo && (!query.trim() || !repositorio.trim())) return;
    onSubmit();
  };

  // 3. Handler para o input de arquivo
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setArquivo(file);
      // Limpa a consulta de texto se um arquivo for selecionado
      setQuery(''); 
    }
  };

  // 4. Handler para remover o arquivo selecionado
  const handleRemoveFile = () => {
    setArquivo(null);
  };
  
  return (
    <Stack as="form" onSubmit={handleSubmit} spacing={2} width="100%">
      
      <TextField
        label="Repositório GitHub"
        id="repositorio"
        placeholder="usuario/repositorio"
        value={repositorio}
        onChange={(e) => setRepositorio(e.target.value)}
        required
        fullWidth
        variant="outlined"
        disabled={loading} // Desabilita enquanto carrega
      />
      
      {/* 5. Lógica de UI: Mostra o arquivo OU o campo de texto */}
      {arquivo ? (
        // Se tiver um arquivo, mostra o "Chip" (etiqueta) do arquivo
        <Chip
          icon={<UploadFileIcon />}
          label={arquivo.name}
          onDelete={handleRemoveFile}
          color="primary"
          variant="outlined"
          sx={{ mt: 2, mb: 1 }}
        />
      ) : (
        // Se NÃO tiver arquivo, mostra o campo de texto
        <>
          <TextField
            label="Consulta por Texto"
            id="query"
            placeholder="Digite sua consulta em linguagem natural..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            required
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            disabled={loading}
          />
          
          <Typography variant="body2" align="center" sx={{ color: 'text.secondary' }}>
            OU
          </Typography>

          {/* Botão que parece um input de arquivo */}
          <Button
            component="label" // Faz o botão agir como um <label>
            variant="outlined"
            startIcon={<UploadFileIcon />}
            fullWidth
            disabled={loading}
          >
            Consulta por Arquivo (.txt, .md)
            {/* O input de arquivo real fica escondido */}
            <input 
              type="file" 
              hidden 
              accept=".txt,.md,text/plain,text/markdown"
              onChange={handleFileChange}
            />
          </Button>
        </>
      )}
      
      <LoadingButton
        type="submit"
        loading={loading}
        variant="contained"
        fullWidth
      >
        <span>Consultar</span>
      </LoadingButton>
      
    </Stack>
  );
};

export default ConsultaForm;