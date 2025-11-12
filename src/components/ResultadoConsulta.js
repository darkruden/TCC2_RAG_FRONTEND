// src/components/ResultadoConsulta.js (Corrigido para Chakra UI v3 - Nomes Finais)
import React from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Box,
  Heading,
  Link,
  List,
  ListItem,
  Text,
  Separator // <-- MUDANÇA (Era Divider)
} from '@chakra-ui/react';

const ResultadoConsulta = ({ resultado }) => {
  if (!resultado) return null;
  
  const { resposta, fontes } = resultado;
  
  return (
    <Box borderWidth="1px" borderRadius="md" p={4} mt={4}>
      <Box mb={4} className="markdown-body">
        <ReactMarkdown>{resposta}</ReactMarkdown>
      </Box>
      
      {fontes && fontes.length > 0 && (
        <>
          <Separator /> {/* <-- MUDANÇA */}
          
          <Box pt={4}>
            <Heading size="sm" mb={2}>Fontes:</Heading>
            <List spacing={2}>
              {fontes.map((fonte, index) => (
                <ListItem key={index} fontSize="sm">
                  <Text as="span" fontWeight="600" mr={1}>
                    {fonte.tipo === 'issue' && `Issue #${fonte.id}:`}
                    {fonte.tipo === 'pull_request' && `Pull Request #${fonte.id}:`}
                    {fonte.tipo === 'commit' && `Commit ${fonte.sha?.substring(0, 7)}:`}
                  </Text>
                  <Link href={fonte.url} isExternal color="blue.500">
                    {fonte.url}
                  </Link>
                </ListItem>
              ))}
            </List>
          </Box>
        </>
      )}
    </Box>
  );
};

export default ResultadoConsulta;