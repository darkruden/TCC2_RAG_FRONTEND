// CÓDIGO COMPLETO E REFATORADO: src/components/AgendamentosModal.js

import React, { useState } from 'react';
import { 
  Modal, Box, Typography, IconButton, CircularProgress, Alert, 
  Card, CardContent, CardActions, TextField, Button, Chip, Stack, Divider
} from '@mui/material';
import { 
  Delete as DeleteIcon, 
  Close as CloseIcon, 
  Edit as EditIcon, 
  Save as SaveIcon,
  GitHub as GitHubIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSchedules, deleteSchedule, updateSchedule } from '../services/api';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '95%',
  maxWidth: 600,
  maxHeight: '85vh', // Limite de altura
  bgcolor: 'background.paper',
  border: '1px solid #30363d',
  borderRadius: 2,
  boxShadow: 24,
  p: 3,
  overflow: 'hidden', // Para o scroll interno funcionar
  display: 'flex',
  flexDirection: 'column'
};

// --- Componente Individual de Item (Card) ---
const ScheduleItem = ({ schedule, onDelete, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  
  // Estados locais para edição
  const [titulo, setTitulo] = useState(schedule.titulo || '');
  const [prompt, setPrompt] = useState(schedule.prompt_relatorio || '');

  const handleSave = () => {
    onUpdate(schedule.id, { 
      titulo: titulo, 
      prompt_relatorio: prompt 
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    // Reverte alterações
    setTitulo(schedule.titulo || '');
    setPrompt(schedule.prompt_relatorio || '');
    setIsEditing(false);
  };

  // Extrai nome curto do repo (user/repo)
  const repoName = schedule.repositorio.replace('https://github.com/', '').split('/tree')[0];

  return (
    <Card variant="outlined" sx={{ mb: 2, bgcolor: 'background.default', borderColor: 'divider' }}>
      <CardContent sx={{ pb: 1 }}>
        
        {/* --- CABEÇALHO DO CARD --- */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
            {isEditing ? (
                <TextField 
                    label="Título do Agendamento" 
                    value={titulo} 
                    onChange={(e) => setTitulo(e.target.value)}
                    size="small" 
                    fullWidth 
                    autoFocus
                />
            ) : (
                <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    {schedule.titulo || "Sem Título (Automático)"}
                </Typography>
            )}
        </Stack>

        {/* --- DETALHES --- */}
        <Stack direction="row" spacing={1} alignItems="center" mb={2}>
            <Chip 
                icon={<GitHubIcon sx={{ fontSize: 16 }} />} 
                label={repoName} 
                size="small" 
                variant="outlined" 
                onClick={() => window.open(schedule.repositorio, '_blank')}
                sx={{ cursor: 'pointer', maxWidth: 200 }}
            />
            <Chip 
                icon={<ScheduleIcon sx={{ fontSize: 16 }} />} 
                label={`${schedule.frequencia} às ${schedule.hora_utc.substring(0,5)} UTC`} 
                size="small" 
                color="secondary" 
                variant="outlined"
            />
        </Stack>

        <Divider sx={{ my: 1.5 }} />

        {/* --- PROMPT --- */}
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
            Prompt / Instrução:
        </Typography>
        {isEditing ? (
            <TextField
                multiline
                rows={3}
                fullWidth
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                variant="outlined"
                sx={{ mt: 1 }}
                placeholder="Edite o que o relatório deve focar..."
            />
        ) : (
            <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary', fontStyle: 'italic' }}>
                "{schedule.prompt_relatorio}"
            </Typography>
        )}

      </CardContent>

      {/* --- AÇÕES --- */}
      <CardActions sx={{ justifyContent: 'flex-end', pt: 0, pr: 2, pb: 2 }}>
        {isEditing ? (
            <>
                <Button size="small" onClick={handleCancel} color="inherit">Cancelar</Button>
                <Button size="small" onClick={handleSave} variant="contained" startIcon={<SaveIcon />}>Salvar</Button>
            </>
        ) : (
            <>
                <Button size="small" onClick={() => setIsEditing(true)} startIcon={<EditIcon />}>
                    Editar
                </Button>
                <Button size="small" onClick={() => onDelete(schedule.id)} color="error" startIcon={<DeleteIcon />}>
                    Excluir
                </Button>
            </>
        )}
      </CardActions>
    </Card>
  );
};

const AgendamentosModal = ({ open, onClose, apiClient }) => {
  const queryClient = useQueryClient();

  // Queries
  const { data: schedules, isLoading, isError, error } = useQuery({
    queryKey: ['schedules'],
    queryFn: () => getSchedules(apiClient),
    enabled: open,
  });

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: (id) => deleteSchedule(apiClient, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['schedules'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateSchedule(apiClient, id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['schedules'] }),
  });

  const renderContent = () => {
    if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress /></Box>;
    if (isError) return <Alert severity="error">Erro: {error.message}</Alert>;
    if (!schedules || schedules.length === 0) return <Typography align="center" sx={{ mt: 4, color: 'text.secondary' }}>Nenhum agendamento ativo.</Typography>;

    return (
      <Box sx={{ overflowY: 'auto', flexGrow: 1, pr: 1, mt: 1 }}>
        {schedules.map((schedule) => (
          <ScheduleItem 
            key={schedule.id} 
            schedule={schedule} 
            onDelete={(id) => deleteMutation.mutate(id)}
            onUpdate={(id, data) => updateMutation.mutate({ id, data })}
          />
        ))}
      </Box>
    );
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h6" component="h2">Meus Agendamentos</Typography>
          <IconButton onClick={onClose}><CloseIcon /></IconButton>
        </Stack>
        <Divider />
        {renderContent()}
      </Box>
    </Modal>
  );
};

export default AgendamentosModal;