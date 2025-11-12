// src/components/ConsultaForm.js (MUI)
import React, { useState } from 'react';
import { Stack, TextField } from '@mui/material';
import { LoadingButton } from '@mui/lab'; // Botão com loading

const ConsultaForm = ({ onSubmit, loading }) => {
  const [query, setQuery] = useState('');
  const [repositorio, setRepositorio] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim() || !repositorio.trim()) return;
    onSubmit({
      query: query.trim(),
      repositorio: repositorio.trim(),
      filtros: {}
    });
  };
  
  return (
    // 'Stack' (vertical por padrão) substitui o form e 'VStack'
    <Stack as="form" onSubmit={handleSubmit} spacing={2} width="100%">
      
      {/* 'TextField' substitui FormControl, FormLabel, e Input */}
      <TextField
        label="Repositório GitHub"
        id="repositorio"
        placeholder="usuario/repositorio"
        value={repositorio}
        onChange={(e) => setRepositorio(e.target.value)}
        required
        fullWidth
        variant="outlined" // Garante a borda e o contraste
      />
      
      <TextField
        label="Consulta"
        id="query"
        placeholder="Digite sua consulta em linguagem natural..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        required
        fullWidth
        multiline // Transforma em <textarea>
        rows={4}
        variant="outlined"
      />
      
      <LoadingButton
        type="submit"
        loading={loading}
        variant="contained" // Botão principal (com fundo)
        fullWidth
      >
        <span>Consultar</span>
      </LoadingButton>
      
    </Stack>
  );
};

export default ConsultaForm;