import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RelatorioForm from '../src/components/RelatorioForm';
import { gerarRelatorio } from '../src/services/api';

// Mock do módulo de API
jest.mock('../src/services/api', () => ({
  gerarRelatorio: jest.fn()
}));

describe('RelatorioForm Component', () => {
  beforeEach(() => {
    // Limpar mocks antes de cada teste
    gerarRelatorio.mockClear();
  });

  test('renderiza corretamente', () => {
    render(<RelatorioForm />);
    
    // Verificar se os elementos principais estão presentes
    expect(screen.getByLabelText(/Repositório GitHub:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Formato do Relatório:/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Gerar Relatório/i })).toBeInTheDocument();
  });

  test('submete formulário com dados válidos', async () => {
    // Configurar mock para retornar resposta de sucesso
    gerarRelatorio.mockResolvedValue({
      url: 'https://exemplo.com/relatorio.md',
      formato: 'markdown'
    });
    
    render(<RelatorioForm />);
    
    // Preencher campo de repositório
    fireEvent.change(screen.getByLabelText(/Repositório GitHub:/i), {
      target: { value: 'usuario/repositorio' },
    });
    
    // Selecionar formato
    fireEvent.change(screen.getByLabelText(/Formato do Relatório:/i), {
      target: { value: 'markdown' },
    });
    
    // Submeter formulário
    fireEvent.click(screen.getByRole('button', { name: /Gerar Relatório/i }));
    
    // Verificar se a API foi chamada com os parâmetros corretos
    expect(gerarRelatorio).toHaveBeenCalledWith({
      repositorio: 'usuario/repositorio',
      formato: 'markdown'
    });
    
    // Verificar se a mensagem de sucesso é exibida
    await waitFor(() => {
      expect(screen.getByText(/Relatório gerado com sucesso!/i)).toBeInTheDocument();
      expect(screen.getByText(/Formato: markdown/i)).toBeInTheDocument();
      expect(screen.getByText(/Baixar Relatório/i)).toHaveAttribute('href', 'https://exemplo.com/relatorio.md');
    });
  });

  test('exibe mensagem de erro quando a API falha', async () => {
    // Configurar mock para retornar erro
    gerarRelatorio.mockRejectedValue(new Error('Falha na API'));
    
    render(<RelatorioForm />);
    
    // Preencher campo de repositório
    fireEvent.change(screen.getByLabelText(/Repositório GitHub:/i), {
      target: { value: 'usuario/repositorio' },
    });
    
    // Submeter formulário
    fireEvent.click(screen.getByRole('button', { name: /Gerar Relatório/i }));
    
    // Verificar se a mensagem de erro é exibida
    await waitFor(() => {
      expect(screen.getByText(/Erro ao gerar relatório/i)).toBeInTheDocument();
    });
  });

  test('botão fica desabilitado durante o carregamento', async () => {
    // Configurar mock para atrasar a resposta
    gerarRelatorio.mockImplementation(() => new Promise(resolve => {
      setTimeout(() => {
        resolve({
          url: 'https://exemplo.com/relatorio.md',
          formato: 'markdown'
        });
      }, 100);
    }));
    
    render(<RelatorioForm />);
    
    // Preencher campo de repositório
    fireEvent.change(screen.getByLabelText(/Repositório GitHub:/i), {
      target: { value: 'usuario/repositorio' },
    });
    
    // Submeter formulário
    fireEvent.click(screen.getByRole('button', { name: /Gerar Relatório/i }));
    
    // Verificar se o botão está desabilitado e mostra texto de carregamento
    expect(screen.getByRole('button', { name: /Gerando.../i })).toBeDisabled();
    
    // Aguardar conclusão
    await waitFor(() => {
      expect(screen.getByText(/Relatório gerado com sucesso!/i)).toBeInTheDocument();
    });
  });

  test('não submete formulário com repositório vazio', async () => {
    render(<RelatorioForm />);
    
    // Submeter formulário sem preencher o repositório
    fireEvent.click(screen.getByRole('button', { name: /Gerar Relatório/i }));
    
    // Verificar se a API não foi chamada
    expect(gerarRelatorio).not.toHaveBeenCalled();
  });
});
