// src/components/RelatorioForm.js (Refatorado)
import React, { useState } from 'react';
import styled from 'styled-components';
// --- IMPORTA OS COMPONENTES PADRONIZADOS ---
import { Button, Select } from './StyledComponents';

// (Estes estilos locais podem ser mantidos ou movidos)
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
  
  /* Corrigindo a cor do label no dark mode */
  @media (prefers-color-scheme: dark) {
    color: var(--text-color, #c9d1d9);
  }
`;
const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
`;

const RelatorioForm = () => {
  const [loading, setLoading] = useState(false);
  const [formato, setFormato] = useState('markdown');

  const handleGerarRelatorio = (e) => {
    e.preventDefault();
    setLoading(true);
    // Lógica para gerar relatório (simulação)
    console.log(`Gerando relatório em formato ${formato}...`);
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  };

  const handleDownload = () => {
    // Lógica de download
    console.log("Iniciando download...");
  };

  return (
    <FormContainer>
      <form onSubmit={handleGerarRelatorio}>
        <FormGroup>
          <Label htmlFor="formato-relatorio">Formato:</Label>
          {/* --- USA O SELECT PADRONIZADO --- */}
          <Select
            id="formato-relatorio"
            value={formato}
            onChange={(e) => setFormato(e.target.value)}
          >
            <option value="markdown">Markdown (.md)</option>
            <option value="pdf">PDF (.pdf)</option>
          </Select>
        </FormGroup>

        <ButtonGroup>
          {/* --- USA O BUTTON PADRONIZADO --- */}
          <Button type="submit" disabled={loading}>
            {loading ? 'Gerando...' : 'Gerar Relatório'}
          </Button>
          
          {/* (Podemos estilizar este 2º botão de forma diferente se quisermos) */}
          <Button type="button" onClick={handleDownload} disabled={loading}>
            Download
          </Button>
        </ButtonGroup>
      </form>
    </FormContainer>
  );
};

export default RelatorioForm;