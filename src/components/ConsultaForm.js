// src/components/ConsultaForm.js (Corrigido para Chakra UI v3)
import React, { useState } from 'react';
import {
  Box,
  Button,
  Field,        // V3
  FieldLabel,   // V3
  Input,
  Textarea,
  VStack
} from '@chakra-ui/react';
// NENHUMA outra importação aqui

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
    <Box as="form" onSubmit={handleSubmit} width="100%">
      <VStack spacing={4}>
        
        <Field isRequired>
          <FieldLabel htmlFor="repositorio">Repositório GitHub:</FieldLabel>
          <Input
            id="repositorio"
            placeholder="usuario/repositorio"
            value={repositorio}
            onChange={(e) => setRepositorio(e.target.value)}
          />
        </Field>
        
        <Field isRequired>
          <FieldLabel htmlFor="query">Consulta:</FieldLabel>
          <Textarea
            id="query"
            placeholder="Digite sua consulta em linguagem natural..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </Field>
        
        <Button
          type="submit"
          colorScheme="blue"
          isLoading={loading}
          loadingText="Consultando..."
          width="100%"
        >
          Consultar
        </Button>
      </VStack>
    </Box>
  );
};

export default ConsultaForm;