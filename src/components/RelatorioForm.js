// src/components/RelatorioForm.js (Refatorado com Chakra UI)
import React, { useState } from 'react';
// 1. Importar componentes Chakra
import {
  Box,
  Button,
  ButtonGroup,
  Field,
  FieldLabel,
  Select,
  VStack
} from '@chakra-ui/react';
// 2. Não precisamos mais de 'styled-components'
// import styled from 'styled-components';
// import { Button, Select } from './StyledComponents';

// 3. Todos os 'styled-components' (FormContainer, FormGroup, Label, ButtonGroup) foram removidos.

const RelatorioForm = () => {
  const [loading, setLoading] = useState(false);
  const [formato, setFormato] = useState('markdown');

  // A lógica de 'handleGerarRelatorio' e 'handleDownload' permanece igual
  const handleGerarRelatorio = (e) => {
    e.preventDefault();
    setLoading(true);
    console.log(`Gerando relatório em formato ${formato}...`);
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  };

  const handleDownload = () => {
    console.log("Iniciando download...");
  };

  // --- 4. O 'return' agora usa componentes Chakra UI ---
  return (
    <Box as="form" onSubmit={handleGerarRelatorio} width="100%">
      <VStack spacing={4}>
        
        <Field>
          <FieldLabel htmlFor="formato-relatorio">Formato:</FieldLabel>
          {/* 5. O 'Select' nativo do Chakra */}
          <Select
            id="formato-relatorio"
            value={formato}
            onChange={(e) => setFormato(e.target.value)}
          >
            <option value="markdown">Markdown (.md)</option>
            <option value="pdf">PDF (.pdf)</option>
          </Select>
        </Field>

        {/* 6. 'ButtonGroup' para agrupar botões */}
        <ButtonGroup spacing={2} width="100%">
          <Button
            type="submit"
            colorScheme="blue"
            isLoading={loading}
            loadingText="Gerando..."
            width="100%"
          >
            Gerar Relatório
          </Button>
          
          <Button
            type="button"
            onClick={handleDownload}
            disabled={loading}
            width="100%"
            variant="outline" // Dando um estilo diferente (contorno)
          >
            Download
          </Button>
        </ButtonGroup>
      </VStack>
    </Box>
  );
};

export default RelatorioForm;