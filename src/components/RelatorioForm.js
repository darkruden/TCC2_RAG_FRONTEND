import React, { useState } from 'react';
import styled from 'styled-components';
import { gerarRelatorio } from '../services/api';

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

const Select = styled.select`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  font-size: 14px;
  background-color: white;
  
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

const ResultContainer = styled.div`
  margin-top: 20px;
  padding: 15px;
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  background-color: #f6f8fa;
`;

const DownloadLink = styled.a`
  display: inline-block;
  margin-top: 10px;
  color: #0366d6;
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
`;

const ErrorMessage = styled.div`
  margin-top: 10px;
  padding: 8px 12px;
  color: #cb2431;
  background-color: #ffeef0;
  border: 1px solid #f97583;
  border-radius: 6px;
`;

const RelatorioForm = () => {
  const [repositorio, setRepositorio] = useState('');
  const [formato, setFormato] = useState('markdown');
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!repositorio.trim()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const resposta = await gerarRelatorio({
        repositorio: repositorio.trim(),
        formato: formato
      });
      
      setResultado(resposta);
    } catch (erro) {
      console.error('Erro ao gerar relatório:', erro);
      setError('Erro ao gerar relatório. Verifique a conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
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
          <Label htmlFor="formato">Formato do Relatório:</Label>
          <Select
            id="formato"
            value={formato}
            onChange={(e) => setFormato(e.target.value)}
          >
            <option value="markdown">Markdown</option>
            <option value="pdf">PDF</option>
          </Select>
        </FormGroup>
        
        <Button type="submit" disabled={loading}>
          {loading ? 'Gerando...' : 'Gerar Relatório'}
        </Button>
      </form>
      
      {resultado && (
        <ResultContainer>
          <h4>Relatório gerado com sucesso!</h4>
          <p>Formato: {resultado.formato}</p>
          <DownloadLink 
            href={resultado.url} 
            target="_blank" 
            rel="noopener noreferrer"
          >
            Baixar Relatório
          </DownloadLink>
        </ResultContainer>
      )}
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </FormContainer>
  );
};

export default RelatorioForm;
