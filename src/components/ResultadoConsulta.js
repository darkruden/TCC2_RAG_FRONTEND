// src/components/ResultadoConsulta.js (MUI)
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Box, Typography, Link, List, ListItem, Divider, Paper 
} from '@mui/material';
// NOVO: Importação de ícones específicos para as fontes
import { 
  Launch as LaunchIcon, 
  BugReport as BugReportIcon,     // Para Issue
  CallMerge as PullRequestIcon,   // Para Pull Request (Merge)
  Commit as CommitIcon            // Para Commit
} from '@mui/icons-material'; 

const ResultadoConsulta = ({ resultado }) => {
  if (!resultado) return null;
  const { resposta, fontes } = resultado;
  
  // Função auxiliar para retornar o ícone correto
  const getSourceIcon = (tipo) => {
    switch (tipo) {
      case 'issue':
        return <BugReportIcon sx={{ fontSize: '1.0rem', mr: 0.5 }} />;
      case 'pull_request':
        return <PullRequestIcon sx={{ fontSize: '1.0rem', mr: 0.5 }} />;
      case 'commit':
        return <CommitIcon sx={{ fontSize: '1.0rem', mr: 0.5 }} />;
      default:
        return null;
    }
  };

  return (
    // 'Paper' é o "card" de resultado, 'variant="outlined"' dá a borda
    <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
      
      {/* 'Box' para a resposta de markdown */}
      <Box sx={{ mb: 2, fontSize: '0.9rem', '& p': { m: 0 } }}>
      <ReactMarkdown
          // Esta linha força todos os links gerados pelo LLM
          // a abrirem em uma nova aba no clique esquerdo.
          linkTarget="_blank" 
        >
          {resposta}
        </ReactMarkdown>
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
                <ListItem 
                    key={index} 
                    disableGutters 
                    sx={{ display: 'flex', alignItems: 'flex-start' }}
                >
                  
                  {/* NOVO: Ícone específico da Fonte */}
                  {getSourceIcon(fonte.tipo)}

                  <Typography variant="body2" component="span" sx={{ flexShrink: 0 }}>
                    {fonte.tipo === 'issue' && `Issue #${fonte.id}: `}
                    {fonte.tipo === 'pull_request' && `Pull Request #${fonte.id}: `}
                    {fonte.tipo === 'commit' && `Commit ${fonte.sha?.substring(0, 7)}: `}
                  </Typography>
                  
                  {/* 'Link' do MUI - Limita o texto da URL para evitar overflow no painel lateral */}
                  <Link 
                    href={fonte.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    variant="body2"
                    sx={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        ml: 0.5, 
                        wordBreak: 'break-all', 
                        fontSize: '0.8rem' 
                    }}
                  >
                    {fonte.url.length > 50 ? fonte.url.substring(0, 47) + '...' : fonte.url} 
                    <LaunchIcon sx={{ fontSize: '0.8rem', ml: 0.5, flexShrink: 0 }} />
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