// src/components/Header.js (Corrigido para Chakra UI v3)
import React from 'react';
import { Box, Flex, Heading, Image, Text } from '@chakra-ui/react';
import logo from '../assets/logo.png';

const Header = () => {
  return (
    <Flex align="center" mb={5}>
      <Image
        src={logo}
        alt="GitHub RAG Logo"
        boxSize="40px"
        mr={4}
      />
      <Box>
        <Heading as="h1" size="md">
          GitHub RAG
        </Heading>
        <Text fontSize="sm" color="gray.500">
          Análise e Rastreabilidade de Requisitos
        </Text>
      </Box>
    </Flex>
  );
};

export default Header;