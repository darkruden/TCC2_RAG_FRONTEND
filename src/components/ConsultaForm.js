// src/components/ConsultaForm.js (Corrigido para Chakra UI v3)
import React, { useState } from 'react';
// 1. Importando os nomes CORRETOS (Field, FieldLabel)
import {
  Box,
  Button,
  Field, // <-- MUDANÇA: Era FormControl
  FieldLabel, // <-- MUDANÇA: Era FormLabel
  Input,
  Textarea,
  VStack
} from '@chakra-ui/react';

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
        
        {/* 2. Usando 'Field' e 'FieldLabel' */}
        <Field isRequired> {/* <-- MUDANÇA */}
          <FieldLabel htmlFor="repositorio">Repositório GitHub:</FieldLabel> {/* <-- MUDANÇA */}
          <Input
            id="repositorio"
            placeholder="usuario/repositorio"
            value={repositorio}
            onChange={(e) => setRepositorio(e.target.value)}
          />
        </Field>
        
        <Field isRequired> {/* <-- MUDANÇA */}
          <FieldLabel htmlFor="query">Consulta:</FieldLabel> {/* <-- MUDANÇA */}
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