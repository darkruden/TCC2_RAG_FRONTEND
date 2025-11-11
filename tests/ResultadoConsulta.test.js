import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ResultadoConsulta from '../src/components/ResultadoConsulta';

describe('ResultadoConsulta Component', () => {
  const mockResultado = {
    resposta: '# Análise\nEste é um texto de resposta em **Markdown**.',
    fontes: [
      {
        tipo: 'issue',
        id: 123,
        url: 'https://github.com/usuario/repositorio/issues/123'
      },
      {
        tipo: 'pull_request',
        id: 456,
        url: 'https://github.com/usuario/repositorio/pull/456'
      },
      {
        tipo: 'commit',
        sha: 'abc1234567',
        url: 'https://github.com/usuario/repositorio/commit/abc1234567'
      }
    ]
  };

  test('não renderiza nada quando resultado é null', () => {
    const { container } = render(<ResultadoConsulta resultado={null} />);
    expect(container.firstChild).toBeNull();
  });

  test('renderiza resposta em markdown', () => {
    render(<ResultadoConsulta resultado={mockResultado} />);
    
    // Verificar se o conteúdo da resposta está presente
    expect(screen.getByText('Análise')).toBeInTheDocument();
    expect(screen.getByText(/Este é um texto de resposta em/)).toBeInTheDocument();
  });

  test('renderiza fontes corretamente', () => {
    render(<ResultadoConsulta resultado={mockResultado} />);
    
    // Verificar se as fontes estão presentes
    expect(screen.getByText(/Fontes:/i)).toBeInTheDocument();
    expect(screen.getByText(/Issue #123:/i)).toBeInTheDocument();
    expect(screen.getByText(/Pull Request #456:/i)).toBeInTheDocument();
    expect(screen.getByText(/Commit abc123/i)).toBeInTheDocument();
    
    // Verificar se os links estão presentes
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(3);
    expect(links[0]).toHaveAttribute('href', 'https://github.com/usuario/repositorio/issues/123');
    expect(links[1]).toHaveAttribute('href', 'https://github.com/usuario/repositorio/pull/456');
    expect(links[2]).toHaveAttribute('href', 'https://github.com/usuario/repositorio/commit/abc1234567');
  });

  test('não renderiza seção de fontes quando não há fontes', () => {
    const resultadoSemFontes = {
      resposta: 'Resposta sem fontes',
      fontes: []
    };
    
    render(<ResultadoConsulta resultado={resultadoSemFontes} />);
    
    // Verificar se a seção de fontes não está presente
    expect(screen.queryByText(/Fontes:/i)).not.toBeInTheDocument();
  });
});
