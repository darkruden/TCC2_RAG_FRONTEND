// src/components/ConsultaForm.js (MUI - Estado "levantado")
import React from 'react'; // Não precisamos mais de 'useState'
import { Stack, TextField } from '@mui/material';
import { LoadingButton } from '@mui/lab';

// 1. Receber as novas props de estado do App.js
const ConsultaForm = ({ 
  onSubmit, 
  loading, 
  query, 
  setQuery, 
  repositorio, 
  setRepositorio 
}) => {
  
  // 2. Os 'useState' locais foram REMOVIDOS
  // const [query, setQuery] = useState('');
  // const [repositorio, setRepositorio] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim() || !repositorio.trim()) return;
    // 3. Apenas chama o 'onSubmit' do App.js, sem passar dados
    onSubmit();
  };
  
  return (
    <Stack as="form" onSubmit={handleSubmit} spacing={2} width="100%">
      
      {/* 4. Os 'TextFields' agora são controlados pelas props */}
      <TextField
        label="Repositório GitHub"
        id="repositorio"
        placeholder="usuario/repositorio"
        value={repositorio} // Controlado pelo App.js
        onChange={(e) => setRepositorio(e.target.value)} // Chama o setter do App.js
        required
        fullWidth
        variant="outlined"
      />
      
      <TextField
        label="Consulta"
        id="query"
        placeholder="Digite sua consulta em linguagem natural..."
        value={query} // Controlado pelo App.js
        onChange={(e) => setQuery(e.target.value)} // Chama o setter do App.js
        required
        fullWidth
        multiline
        rows={4}
        variant="outlined"
      />
      
      <LoadingButton
        type="submit"
        loading={loading}
        variant="contained"
        fullWidth
      >
        <span>Consultar</span>
      </LoadingButton>
      
    </Stack>
  );
};

export default ConsultaForm;