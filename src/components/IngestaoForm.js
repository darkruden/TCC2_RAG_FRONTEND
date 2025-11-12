// src/components/IngestaoForm.js (Corrigido para Chakra UI v3 - Nomes Finais)
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Field,
  FieldLabel,
  Input,
  NumberInput,
  NumberInputInput, // <-- MUDANÇA (Era NumberInputField)
  HStack,
  VStack
} from '@chakra-ui/react';
import { extrairInfoRepositorio } from '../services/api';

const IngestaoForm = ({ onSubmit, loading }) => {
  const [repositorio, setRepositorio] = useState('');
  const [issuesLimit, setIssuesLimit] = useState(50);
  const [prsLimit, setPrsLimit] = useState(20);
  const [commitsLimit, setCommitsLimit] = useState(30);

  // ... (useEffect e handleSubmit permanecem os mesmos) ...
  useEffect(() => {
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
      console.warn("Não é uma extensão, preencha o repo manualmente.");
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!repositorio.trim()) return;
    
    onSubmit({
      repositorio: repositorio.trim(),
      issues_limit: parseInt(issuesLimit, 10) || 50,
      prs_limit: parseInt(prsLimit, 10) || 20,
      commits_limit: parseInt(commitsLimit, 10) || 30
    });
  };
  
  return (
    <Box as="form" onSubmit={handleSubmit} width="100%">
      <VStack spacing={4}>
        
        <Field isRequired>
          <FieldLabel htmlFor="repositorio-ingest">Repositório GitHub:</FieldLabel>
          <Input
            id="repositorio-ingest"
            placeholder="usuario/repositorio"
            value={repositorio}
            onChange={(e) => setRepositorio(e.target.value)}
          />
        </Field>
        
        <Field>
          <FieldLabel>Limites de Ingestão (Opcional):</FieldLabel>
          <HStack spacing={2}>
            <NumberInput
              value={issuesLimit}
              onValueChange={(e) => setIssuesLimit(e.value)} // v3 passa objeto
              min={0}
            >
              <NumberInputInput title="Issues" /> {/* <-- MUDANÇA */}
            </NumberInput>
            <NumberInput
              value={prsLimit}
              onValueChange={(e) => setPrsLimit(e.value)} // v3 passa objeto
              min={0}
            >
              <NumberInputInput title="Pull Requests" /> {/* <-- MUDANÇA */}
            </NumberInput>
            <NumberInput
              value={commitsLimit}
              onValueChange={(e) => setCommitsLimit(e.value)} // v3 passa objeto
              min={0}
            >
              <NumberInputInput title="Commits" /> {/* <-- MUDANÇA */}
            </NumberInput>
          </HStack>
        </Field>
        
        <Button
          type="submit"
          colorScheme="blue"
          isLoading={loading}
          loadingText="Ingerindo..."
          width="100%"
        >
          Iniciar Ingestão
        </Button>
      </VStack>
    </Box>
  );
};

export default IngestaoForm;