import React from 'react';
import styled from 'styled-components';
import logo from '../assets/logo.png';

const HeaderContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 20px;
`;

const Logo = styled.img`
  width: 40px;
  height: 40px;
  margin-right: 15px;
`;

const Title = styled.h1`
  font-size: 20px;
  font-weight: 600;
  color: #24292e;
  margin: 0;
`;

const Subtitle = styled.p`
  font-size: 12px;
  color: #586069;
  margin: 5px 0 0 0;
`;

const Header = () => {
  return (
    <HeaderContainer>
      <Logo src={logo} alt="GitHub RAG Logo" />
      <div>
        <Title>GitHub RAG</Title>
        <Subtitle>Análise e Rastreabilidade de Requisitos</Subtitle>
      </div>
    </HeaderContainer>
  );
};

export default Header;
