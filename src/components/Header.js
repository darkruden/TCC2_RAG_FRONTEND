// src/components/Header.js (Refatorado com Chakra UI)
import React from 'react';
// 1. Importar componentes Chakra
import { Box, Flex, Heading, Image, Text } from '@chakra-ui/react';
import logo from '../assets/logo.png';

// 2. Não precisamos mais de 'styled-components'
// import styled from 'styled-components';

const Header = () => {
  return (
    // 3. 'Flex' substitui 'HeaderContainer'
    <Flex align="center" mb={5}> {/* mb={5} é "margin-bottom: 20px" */}
      {/* 4. 'Image' substitui 'Logo' */}
      <Image
        src={logo}
        alt="GitHub RAG Logo"
        boxSize="40px" // Define width e height
        mr={4} // 'margin-right: 16px'
      />
      
      {/* 5. 'Box' é um container genérico (div) */}
      <Box>
        {/* 6. 'Heading' (h1) substitui 'Title' e herda a cor do tema */}
        <Heading as="h1" size="md">
          GitHub RAG
        </Heading>
        {/* 7. 'Text' substitui 'Subtitle' e usa uma cor de tema (para light/dark) */}
        <Text fontSize="sm" color="gray.500">
          Análise e Rastreabilidade de Requisitos
        </Text>
      </Box>
    </Flex>
  );
};

export default Header;