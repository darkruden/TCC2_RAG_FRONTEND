// src/components/ConsultaForm.js (Refatorado)
import React, { useState } from 'react';
import styled from 'styled-components';
// --- IMPORTA OS COMPONENTES PADRONIZADOS ---
import { Button, Input, TextArea } from './StyledComponents';

const FormContainer = styled.div`
  margin-bottom: 20px;
`;

const FormGroup = styled.div`
  margin-bottom: 15px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 5px;
  font-weight: 600;
  font-size: 14px;
  color: #24292e;
`;

// --- AS DEFINIÇÕES DE INPUT, TEXTAREA E BUTTON FORAM REMOVIDAS ---
// (Agora estamos usando as globais)

const ConsultaForm = ({ onSubmit, loading }) => {
  const [query, setQuery] = useState('');
  const [repositorio, setRepositorio] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!query.trim() || !repositorio.trim()) {
      return;
    }
    
    onSubmit({
      query: query.trim(),
      repositorio: repositorio.trim(),
      filtros: {}
    });
  };
  
  return (
    <FormContainer>
      <form onSubmit={handleSubmit}>
        <FormGroup>
          <Label htmlFor="repositorio">Repositório GitHub:</Label>
          <Input  /* <-- Usa o Input padronizado */
            type="text"
            id="repositorio"
            placeholder="usuario/repositorio"
            value={repositorio}
            onChange={(e) => setRepositorio(e.target.value)}
            required
          />
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="query">Consulta:</Label>
          <TextArea /* <-- Usa o TextArea padronizado */
            id="query"
            placeholder="Digite sua consulta em linguagem natural..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            required
          />
        </FormGroup>
        
        <Button /* <-- Usa o Button padronizado (agora azul) */
          type="submit" 
          disabled={loading}
        >
          {loading ? 'Consultando...' : 'Consultar'}
        </Button>
      </form>
    </FormContainer>
  );
};

export default ConsultaForm;