import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ConsultaForm from '../src/components/ConsultaForm';

// Mock para a função onSubmit
const mockOnSubmit = jest.fn();

describe('ConsultaForm Component', () => {
  beforeEach(() => {
    // Limpar mocks antes de cada teste
    mockOnSubmit.mockClear();
  });

  test('renderiza corretamente', () => {
    render(<ConsultaForm onSubmit={mockOnSubmit} loading={false} />);
    
    // Verificar se os elementos principais estão presentes
    expect(screen.getByLabelText(/Repositório GitHub:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Consulta:/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Consultar/i })).toBeInTheDocument();
  });

  test('botão desabilitado durante carregamento', () => {
    render(<ConsultaForm onSubmit={mockOnSubmit} loading={true} />);
    
    // Verificar se o botão está desabilitado
    expect(screen.getByRole('button', { name: /Consultando.../i })).toBeDisabled();
  });

  test('submete formulário com dados válidos', async () => {
    render(<ConsultaForm onSubmit={mockOnSubmit} loading={false} />);
    
    // Preencher campos
    fireEvent.change(screen.getByLabelText(/Repositório GitHub:/i), {
      target: { value: 'usuario/repositorio' },
    });
    
    fireEvent.change(screen.getByLabelText(/Consulta:/i), {
      target: { value: 'Como implementar autenticação?' },
    });
    
    // Submeter formulário
    fireEvent.click(screen.getByRole('button', { name: /Consultar/i }));
    
    // Verificar se onSubmit foi chamado com os dados corretos
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        query: 'Como implementar autenticação?',
        repositorio: 'usuario/repositorio',
        filtros: {}
      });
    });
  });

  test('não submete formulário com dados inválidos', async () => {
    render(<ConsultaForm onSubmit={mockOnSubmit} loading={false} />);
    
    // Submeter formulário sem preencher campos
    fireEvent.click(screen.getByRole('button', { name: /Consultar/i }));
    
    // Verificar se onSubmit não foi chamado
    await waitFor(() => {
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  test('não submete formulário com campos vazios', async () => {
    render(<ConsultaForm onSubmit={mockOnSubmit} loading={false} />);
    
    // Preencher apenas um campo
    fireEvent.change(screen.getByLabelText(/Repositório GitHub:/i), {
      target: { value: 'usuario/repositorio' },
    });
    
    // Submeter formulário
    fireEvent.click(screen.getByRole('button', { name: /Consultar/i }));
    
    // Verificar se onSubmit não foi chamado
    await waitFor(() => {
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });
});
