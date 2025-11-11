import React, { useState } from 'react';
import styled from 'styled-components';

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

const Input = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  font-size: 14px;
  
  &:focus {
    border-color: #0366d6;
    outline: none;
    box-shadow: 0 0 0 3px rgba(3, 102, 214, 0.3);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  font-size: 14px;
  min-height: 100px;
  resize: vertical;
  
  &:focus {
    border-color: #0366d6;
    outline: none;
    box-shadow: 0 0 0 3px rgba(3, 102, 214, 0.3);
  }
`;

const Button = styled.button`
  background-color: #2ea44f;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #2c974b;
  }
  
  &:disabled {
    background-color: #94d3a2;
    cursor: not-allowed;
  }
`;

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
          <Input
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
          <TextArea
            id="query"
            placeholder="Digite sua consulta em linguagem natural..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            required
          />
        </FormGroup>
        
        <Button type="submit" disabled={loading}>
          {loading ? 'Consultando...' : 'Consultar'}
        </Button>
      </form>
    </FormContainer>
  );
};

export default ConsultaForm;
