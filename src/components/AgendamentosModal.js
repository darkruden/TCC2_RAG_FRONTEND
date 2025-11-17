// NOVO ARQUIVO: src/components/AgendamentosModal.js

import React from 'react';
import { 
  Modal, Box, Typography, IconButton, List, ListItem, 
  ListItemText, CircularProgress, Alert, Tooltip 
} from '@mui/material';
import { Delete as DeleteIcon, Close as CloseIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSchedules, deleteSchedule } from '../services/api';

// Estilo do Modal
const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90%',
  maxWidth: 500,
  bgcolor: 'background.paper',
  border: '1px solid #30363d', // Borda sutil
  borderRadius: 2, // 8px
  boxShadow: 24,
  p: 3,
};

const AgendamentosModal = ({ open, onClose, apiClient }) => {
  const queryClient = useQueryClient();

  // 1. Hook (useQuery) para buscar os agendamentos
  const { data: schedules, isLoading, isError, error } = useQuery({
    queryKey: ['schedules'], // Chave de cache
    queryFn: () => getSchedules(apiClient),
    enabled: open, // Só executa a query quando o modal estiver aberto
  });

  // 2. Hook (useMutation) para deletar um agendamento
  const { mutate: performDelete, isPending: isDeleting } = useMutation({
    mutationFn: (scheduleId) => deleteSchedule(apiClient, scheduleId),
    onSuccess: () => {
      // Invalida o cache 'schedules' para forçar um refetch automático
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
    onError: (deleteError) => {
      // (Opcional) Poderíamos mostrar um toast/snackbar de erro aqui
      console.error("Erro ao deletar agendamento:", deleteError);
    }
  });

  const handleDelete = (id) => {
    if (isDeleting) return;
    performDelete(id);
  };

  // 3. Renderização do conteúdo
  const renderContent = () => {
    if (isLoading) {
      return <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress /></Box>;
    }
    if (isError) {
      return <Alert severity="error">Erro ao buscar agendamentos: {error.message}</Alert>;
    }
    if (!schedules || schedules.length === 0) {
      return <Typography sx={{ my: 3, textAlign: 'center' }}>Nenhum agendamento ativo encontrado.</Typography>;
    }

    return (
      <List dense sx={{ maxHeight: 300, overflowY: 'auto' }}>
        {schedules.map((schedule) => (
          <ListItem
            key={schedule.id}
            secondaryAction={
              <Tooltip title="Excluir Agendamento">
                <IconButton 
                  edge="end" 
                  aria-label="delete" 
                  onClick={() => handleDelete(schedule.id)}
                  disabled={isDeleting}
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            }
          >
            <ListItemText
              primary={`${schedule.repositorio} (${schedule.frequencia})`}
              secondary={`Prompt: ${schedule.prompt_relatorio.substring(0, 40)}...`}
            />
          </ListItem>
        ))}
      </List>
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="modal-agendamentos-title"
    >
      <Box sx={style}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography id="modal-agendamentos-title" variant="h6" component="h2">
            Meus Agendamentos
          </Typography>
          <IconButton onClick={onClose} aria-label="Fechar modal">
            <CloseIcon />
          </IconButton>
        </Box>
        {renderContent()}
      </Box>
    </Modal>
  );
};

export default AgendamentosModal;