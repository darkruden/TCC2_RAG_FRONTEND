// src/components/ResultadoConsulta.js (MUI)
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Box, Typography, Link, List, ListItem, Divider, Paper 
} from '@mui/material';
import { Launch as LaunchIcon } from '@mui/icons-material'; // Ícone de link externo

const ResultadoConsulta = ({ resultado }) => {
  if (!resultado) return null;
  const { resposta, fontes } = resultado;
  
  return (
    // 'Paper' é o "card" de resultado, 'variant="outlined"' dá a borda
    <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
      
      {/* 'Box' para a resposta de markdown */}
      <Box sx={{ mb: 2, fontSize: '0.9rem', '& p': { m: 0 } }}>
        <ReactMarkdown>{resposta}</ReactMarkdown>
      </Box>
      
      {fontes && fontes.length > 0 && (
        <>
          <Divider sx={{ mb: 2 }} />
          
          <Box>
            <Typography variant="h6" component="h4" sx={{ fontSize: '1rem', mb: 1 }}>
              Fontes:
            </Typography>
            <List dense disablePadding>
              {fontes.map((fonte, index) => (
                <ListItem key={index} disableGutters>
                  <Typography variant="body2" component="span">
                    {fonte.tipo === 'issue' && `Issue #${fonte.id}: `}
                    {fonte.tipo === 'pull_request' && `Pull Request #${fonte.id}: `}
                    {fonte.tipo === 'commit' && `Commit ${fonte.sha?.substring(0, 7)}: `}
                  </Typography>
                  
                  {/* 'Link' do MUI */}
                  <Link 
                    href={fonte.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    variant="body2"
                    sx={{ display: 'inline-flex', alignItems: 'center', ml: 0.5, wordBreak: 'break-all' }}
                  >
                    {fonte.url}
                    <LaunchIcon sx={{ fontSize: '0.8rem', ml: 0.5 }} />
                  </Link>
                </ListItem>
              ))}
            </List>
          </Box>
        </>
      )}
    </Paper>
  );
};

export default ResultadoConsulta;