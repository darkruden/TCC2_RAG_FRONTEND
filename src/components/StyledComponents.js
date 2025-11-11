import React from 'react';
import styled, { createGlobalStyle } from 'styled-components';

// Estilos globais para melhorar acessibilidade e responsividade
const GlobalStyle = createGlobalStyle`
  :root {
    --primary-color: #0366d6;
    --secondary-color: #2ea44f;
    --background-color: #ffffff;
    --text-color: #24292e;
    --border-color: #e1e4e8;
    --error-color: #cb2431;
    --success-color: #22863a;
    --focus-shadow: 0 0 0 3px rgba(3, 102, 214, 0.3);
  }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    color: var(--text-color);
    line-height: 1.5;
  }

  /* Melhorias de acessibilidade */
  :focus {
    outline: none;
    box-shadow: var(--focus-shadow);
  }

  /* Melhorias para modo escuro */
  @media (prefers-color-scheme: dark) {
    :root {
      --primary-color: #58a6ff;
      --secondary-color: #3fb950;
      --background-color: #0d1117;
      --text-color: #c9d1d9;
      --border-color: #30363d;
      --error-color: #f85149;
      --success-color: #56d364;
    }
    
    body {
      background-color: var(--background-color);
    }
  }

  /* Melhorias para dispositivos móveis */
  @media (max-width: 480px) {
    body {
      font-size: 14px;
    }
  }
`;

// Componentes base com melhorias de acessibilidade e responsividade
const Button = styled.button`
  background-color: var(--secondary-color);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s;
  
  &:hover {
    background-color: #2c974b;
  }
  
  &:active {
    transform: translateY(1px);
  }
  
  &:focus {
    box-shadow: var(--focus-shadow);
  }
  
  &:disabled {
    background-color: #94d3a2;
    cursor: not-allowed;
  }

  /* Ícone de carregamento */
  &.loading::after {
    content: "";
    display: inline-block;
    width: 12px;
    height: 12px;
    margin-left: 8px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: white;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
  background-color: var(--background-color);
  color: var(--text-color);
  
  &:focus {
    border-color: var(--primary-color);
    box-shadow: var(--focus-shadow);
  }

  &::placeholder {
    color: #6a737d;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
  min-height: 100px;
  resize: vertical;
  background-color: var(--background-color);
  color: var(--text-color);
  
  &:focus {
    border-color: var(--primary-color);
    box-shadow: var(--focus-shadow);
  }

  &::placeholder {
    color: #6a737d;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
  background-color: var(--background-color);
  color: var(--text-color);
  
  &:focus {
    border-color: var(--primary-color);
    box-shadow: var(--focus-shadow);
  }
`;

const Card = styled.div`
  background-color: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const ErrorMessage = styled.div`
  color: var(--error-color);
  background-color: ${props => props.theme.mode === 'dark' ? 'rgba(248, 81, 73, 0.1)' : '#ffeef0'};
  border: 1px solid var(--error-color);
  border-radius: 6px;
  padding: 8px 12px;
  margin-top: 8px;
  font-size: 14px;
`;

const SuccessMessage = styled.div`
  color: var(--success-color);
  background-color: ${props => props.theme.mode === 'dark' ? 'rgba(86, 211, 100, 0.1)' : '#e6ffed'};
  border: 1px solid var(--success-color);
  border-radius: 6px;
  padding: 8px 12px;
  margin-top: 8px;
  font-size: 14px;
`;

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
