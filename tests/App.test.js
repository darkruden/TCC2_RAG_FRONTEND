import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { act } from 'react-dom/test-utils';
import App from '../src/App';
import { testarConexao, consultarAPI } from '../src/services/api';

// Mock do módulo de API
jest.mock('../src/services/api', () => ({
  testarConexao: jest.fn(),
  consultarAPI: jest.fn(),
  gerarRelatorio: jest.fn()
}));

describe('App Component', () => {
  beforeEach(() => {
    // Limpar mocks antes de cada teste
    testarConexao.mockClear();
    consultarAPI.mockClear();
  });

  test('verifica conexão com backend ao iniciar', async () => {
    // Configurar mock para retornar resposta de sucesso
    testarConexao.mockResolvedValue({ status: 'online', version: '0.1.0' });
    
    await act(async () => {
      render(<App />);
    });
    
    // Verificar se a API foi chamada
    expect(testarConexao).toHaveBeenCalled();
    
    // Verificar se o indicador de status é exibido
    await waitFor(() => {
      expect(screen.getByText(/Conectado ao backend/i)).toBeInTheDocument();
    });
  });

  test('exibe erro quando não consegue conectar ao backend', async () => {
    // Configurar mock para retornar erro
    testarConexao.mockRejectedValue(new Error('Falha na conexão'));
    
    await act(async () => {
      render(<App />);
    });
    
    // Verificar se o indicador de erro é exibido
    await waitFor(() => {
      expect(screen.getByText(/Não foi possível conectar ao backend/i)).toBeInTheDocument();
    });
  });

  test('alterna entre abas corretamente', async () => {
    // Configurar mock para retornar resposta de sucesso
    testarConexao.mockResolvedValue({ status: 'online' });
    
    await act(async () => {
      render(<App />);
    });
    
    // Verificar se a aba de consulta está ativa inicialmente
    expect(screen.getByText('Consulta')).toHaveAttribute('active');
    
    // Clicar na aba de relatório
    act(() => {
      screen.getByText('Relatório').click();
    });
    
    // Verificar se a aba de relatório está ativa
    await waitFor(() => {
      expect(screen.getByText('Formato do Relatório:')).toBeInTheDocument();
    });
  });

  test('integração com API de consulta', async () => {
    // Configurar mocks
    testarConexao.mockResolvedValue({ status: 'online' });
    consultarAPI.mockResolvedValue({
      resposta: 'Resposta da consulta',
      fontes: [{ tipo: 'issue', id: 123, url: 'https://github.com/user/repo/issues/123' }]
    });
    
    await act(async () => {
      render(<App />);
    });
    
    // Simular submissão do formulário de consulta
    const handleConsulta = await screen.findByRole('button', { name: /Consultar/i });
    
    // Chamar diretamente a função de consulta com dados simulados
    await act(async () => {
      // Acessar a função handleConsulta diretamente do componente App
      // Isso é uma simplificação para o teste de integração
      const dados = { query: 'Como funciona?', repositorio: 'user/repo' };
      handleConsulta.onclick && handleConsulta.onclick({ preventDefault: () => {} });
      // Alternativa: chamar a função diretamente se acessível
      // app.handleConsulta(dados);
    });
    
    // Verificar se a API foi chamada
    expect(consultarAPI).toHaveBeenCalled();
  });
});
