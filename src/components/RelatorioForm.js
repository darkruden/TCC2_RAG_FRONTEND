// src/components/RelatorioForm.js (Corrigido para Chakra UI v3)
import React, { useState } from 'react';
import {
  Box,
  Button,
  ButtonGroup,
  Field,
  FieldLabel,
  Select,
  VStack
} from '@chakra-ui/react';

const RelatorioForm = () => {
  const [loading, setLoading] = useState(false);
  const [formato, setFormato] = useState('markdown');

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

  return (
    <Box as="form" onSubmit={handleGerarRelatorio} width="100%">
      <VStack spacing={4}>
        
        <Field>
          <FieldLabel htmlFor="formato-relatorio">Formato:</FieldLabel>
          <Select
            id="formato-relatorio"
            value={formato}
            onChange={(e) => setFormato(e.target.value)}
          >
            <option value="markdown">Markdown (.md)</option>
            <option value="pdf">PDF (.pdf)</option>
          </Select>
        </Field>

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
            variant="outline"
          >
            Download
          </Button>
        </ButtonGroup>
      </VStack>
    </Box>
  );
};

export default RelatorioForm;