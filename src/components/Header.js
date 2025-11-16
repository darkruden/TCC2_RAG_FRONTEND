// CÓDIGO COMPLETO PARA: src/components/Header.js
// (Atualizado com email do usuário e botão de Logout)

import React, { useState } from 'react';
import { Box, Typography, IconButton, Menu, MenuItem } from '@mui/material';
import { Menu as MenuIcon, Logout as LogoutIcon } from '@mui/icons-material';
import logo from '../assets/logo.png';

// --- 1. ACEITAR PROPS DE AUTH ---
const Header = ({ userEmail, onLogout }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    onLogout();
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, overflow: 'hidden' }}>
      <Box
        component="img"
        src={logo}
        alt="GitHub RAG Logo"
        sx={{ width: 40, height: 40, mr: 1.5 }}
      />
      <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        <Typography variant="h6" component="h1" noWrap>
          GitRAG
        </Typography>
        {/* --- 2. MOSTRAR O EMAIL DO USUÁRIO --- */}
        <Typography 
          variant="body2" 
          color="text.secondary" 
          noWrap
          title={userEmail} // Mostra o email completo no hover
        >
          {userEmail}
        </Typography>
      </Box>

      {/* --- 3. ADICIONAR MENU COM BOTÃO DE LOGOUT --- */}
      <Box sx={{ ml: 'auto' }}>
        <IconButton
          aria-label="menu do usuário"
          aria-controls="menu-appbar"
          aria-haspopup="true"
          onClick={handleMenu}
          color="inherit"
        >
          <MenuIcon />
        </IconButton>
        <Menu
          id="menu-appbar"
          anchorEl={anchorEl}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          keepMounted
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          open={open}
          onClose={handleClose}
        >
          {/* (No futuro, você pode adicionar "Ver Agendamentos" aqui) */}
          <MenuItem onClick={handleLogout}>
            <LogoutIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
            Sair
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
};

export default Header;