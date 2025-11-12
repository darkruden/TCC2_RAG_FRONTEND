// src/components/Header.js (MUI)
import React from 'react';
import { Box, Typography } from '@mui/material';
import logo from '../assets/logo.png'; // Caminho para o logo permanece

const Header = () => {
  return (
    // 'Box' é o 'div' principal do MUI. 'sx' é como estilizamos.
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5 }}> {/* mb: 2.5 é 20px */}
      <Box
        component="img"
        src={logo}
        alt="GitHub RAG Logo"
        sx={{ width: 40, height: 40, mr: 2 }} // mr: 2 é 16px
      />
      <Box>
        <Typography variant="h6" component="h1">
          GitHub RAG
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Análise e Rastreabilidade de Requisitos
        </Typography>
      </Box>
    </Box>
  );
};

export default Header;