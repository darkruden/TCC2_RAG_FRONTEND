// src/components/StyledComponents.js (COM CORREÇÃO DE DARK MODE)
import React from 'react';
import styled, { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  :root {
    /* Light Mode (Padrão) */
    --primary-color: #0366d6;
    --secondary-color: #2ea44f;
    --background-color: #ffffff;
    --input-background-color: #ffffff; /* Fundo do input (branco) */
    --text-color: #24292e;
    --text-color-light: #ffffff;      /* Texto do Botão (branco) */
    --border-color: #e1e4e8;
    --error-color: #cb2431;
    --success-color: #22863a;
    --focus-shadow: 0 0 0 3px rgba(3, 102, 214, 0.3);
  }

  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    color: var(--text-color);
    line-height: 1.5;
    background-color: var(--background-color); /* Aplica o fundo ao body */
  }
  :focus {
    outline: none;
    box-shadow: var(--focus-shadow);
  }

  /* --- CORREÇÃO DE DARK MODE --- */
  @media (prefers-color-scheme: dark) {
    :root {
      --primary-color: #58a6ff;     /* Azul claro (abas, botões) */
      --secondary-color: #3fb950;
      --background-color: #0d1117;     /* Fundo da Página (Preto) */
      --input-background-color: #161b22; /* Fundo do Input (Cinza Escuro) */
      --text-color: #c9d1d9;
      --text-color-light: #0d1117;      /* Texto do Botão (Preto) */
      --border-color: #30363d;
      --error-color: #f85149;
      --success-color: #56d364;
    }
  }
`;

// --- BOTÃO CORRIGIDO ---
const Button = styled.button`
  background-color: var(--primary-color);
  color: var(--text-color-light); /* <-- CORREÇÃO: Usa variável (branco/preto) */
  border: 1px solid var(--border-color); /* <-- Adiciona borda para destacar */
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s;
  
  &:hover { 
    filter: brightness(1.2); /* Clareia/Escurece no hover */
  }
  &:active { transform: translateY(1px); }
  &:focus { box-shadow: var(--focus-shadow); }
  
  &:disabled {
    filter: brightness(0.7);
    cursor: not-allowed;
  }

  /* (Animação de loading continua igual) */
  &.loading::after {
    content: ""; display: inline-block; width: 12px; height: 12px;
    margin-left: 8px; border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%; border-top-color: white;
    animation: spin 1s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

// --- INPUTS/TEXTAREA CORRIGIDOS ---
const Input = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
  background-color: var(--input-background-color); /* <-- CORREÇÃO: Fundo diferente */
  color: var(--text-color);
  
  &:focus {
    border-color: var(--primary-color);
    box-shadow: var(--focus-shadow);
  }
  &::placeholder { color: #6a737d; }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
  min-height: 100px;
  resize: vertical;
  background-color: var(--input-background-color); /* <-- CORREÇÃO: Fundo diferente */
  color: var(--text-color);
  
  &:focus {
    border-color: var(--primary-color);
    box-shadow: var(--focus-shadow);
  }
  &::placeholder { color: #6a737d; }
`;

const Select = styled.select`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
  background-color: var(--input-background-color); /* <-- CORREÇÃO: Fundo diferente */
  color: var(--text-color);
  
  &:focus {
    border-color: var(--primary-color);
    box-shadow: var(--focus-shadow);
  }
`;
// (O resto do arquivo Card, ErrorMessage, etc. pode continuar)
// ...
const Card = styled.div`
  background-color: var(--input-background-color);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;
const ErrorMessage = styled.div``;
const SuccessMessage = styled.div``;


// Exportar componentes
export {
  GlobalStyle,
  Button,
  Input,
  TextArea,
  Select,
  Card,
  ErrorMessage,
  SuccessMessage
};