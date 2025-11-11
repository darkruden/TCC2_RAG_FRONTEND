// src/components/IngestaoForm.js
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
// Importa os estilos que você já criou
import { Button, Input } from './StyledComponents'; 
import { extrairInfoRepositorio } from '../services/api';

// Reutiliza os estilos do seu ConsultaForm
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

// Estilo para campos de número
const NumberInput = styled(Input)`
  width: 80px;
  margin-right: 10px;
`;

const IngestaoForm = ({ onSubmit, loading }) => {
  const [repositorio, setRepositorio] = useState('');
  const [issuesLimit, setIssuesLimit] = useState(50);
  const [prsLimit, setPrsLimit] = useState(20);
  const [commitsLimit, setCommitsLimit] = useState(30);

  // DICA DE MELHORIA: Detecta o repositório automaticamente!
  // Usamos a função 'extrairInfoRepositorio' que você já tem no api.js
  useEffect(() => {
    // Esta função só funciona no 'content.js', mas podemos simular
    // a extração da URL da aba ativa.
    if (window.chrome && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].url) {
          const url = tabs[0].url;
          const m = url.match(/github\.com\/([^\/]+\/[^\/]+)/);
          if (m && m[1]) {
            setRepositorio(m[1]);
          }
        }
      });
    } else {
      // Para testes locais fora da extensão
      console.warn("Não é uma extensão, preencha o repo manualmente.");
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!repositorio.trim()) return;
    
    onSubmit({
      repositorio: repositorio.trim(),
      issues_limit: parseInt(issuesLimit, 10),
      prs_limit: parseInt(prsLimit, 10),
      commits_limit: parseInt(commitsLimit, 10)
    });
  };
  
  return (
    <FormContainer>
      <form onSubmit={handleSubmit}>
        <FormGroup>
          <Label htmlFor="repositorio-ingest">Repositório GitHub:</Label>
          <Input
            type="text"
            id="repositorio-ingest"
            placeholder="usuario/repositorio"
            value={repositorio}
            onChange={(e) => setRepositorio(e.target.value)}
            required
          />
        </FormGroup>
        
        <FormGroup>
          <Label>Limites de Ingestão (Opcional):</Label>
          <div>
            <NumberInput
              type="number"
              title="Issues"
              value={issuesLimit}
              onChange={(e) => setIssuesLimit(e.target.value)}
            />
            <NumberInput
              type="number"
              title="Pull Requests"
              value={prsLimit}
              onChange={(e) => setPrsLimit(e.target.value)}
            />
            <NumberInput
              type="number"
              title="Commits"
              value={commitsLimit}
              onChange={(e) => setCommitsLimit(e.target.value)}
            />
          </div>
        </FormGroup>
        
        <Button type="submit" disabled={loading}>
          {loading ? 'Ingerindo...' : 'Iniciar Ingestão'}
        </Button>
      </form>
    </FormContainer>
  );
};

export default IngestaoForm;