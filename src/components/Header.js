import React, { useState } from 'react';
import { Box, Typography, IconButton, Menu, MenuItem } from '@mui/material';

// --- INÍCIO DA CORREÇÃO ---
// Adiciona 'Event as EventIcon' à importação existente
import { 
  Menu as MenuIcon, 
  Logout as LogoutIcon,
  Event as EventIcon // <-- ADICIONADO AQUI
} from '@mui/icons-material';
// --- FIM DA CORREÇÃO ---

import logo from '../assets/logo.png';

// --- 1. ACEITAR PROPS DE AUTH ---
const Header = ({ userEmail, onLogout, onOpenSchedules }) => {
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

// --- 2. NOVA FUNÇÃO ---
const handleOpenSchedules = () => {
  handleClose();
  onOpenSchedules(); // Chama a função passada pelo App.js
};

return (
  <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, overflow: 'hidden' }}>
    {/* ... (Logo e Título/Email não mudam) ... */}
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
      <Typography 
        variant="body2" 
        color="text.secondary" 
        noWrap
        title={userEmail}
      >
        {userEmail}
      </Typography>
    </Box>

    {/* --- 3. MENU ATUALIZADO --- */}
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
        {/* --- 4. NOVO BOTÃO DE MENU --- */}
        <MenuItem onClick={handleOpenSchedules}>
          <EventIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
          Meus Agendamentos
        </MenuItem>
        
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