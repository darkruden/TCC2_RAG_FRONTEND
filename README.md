# GitRAG – Extensão Chrome (Frontend)

Interface de chat inteligente para análise e rastreabilidade de requisitos de software em repositórios GitHub, baseada em **RAG (Retrieval-Augmented Generation)** e integrada a um backend FastAPI.

Este projeto é uma **Extensão do Chrome** que utiliza o **Side Panel (Painel Lateral)** para oferecer um assistente persistente enquanto você navega no GitHub.

---

## 🔗 Repositórios do Projeto

- Backend (FastAPI + RAG + Supabase):  
  https://github.com/darkruden/TCC2_RAG_BACKEND
- Frontend (Extensão Chrome – este repositório):  
  https://github.com/darkruden/TCC2_RAG_FRONTEND

---

## 🚀 Tecnologias

- **React 18** – Biblioteca de UI.
- **Material UI (MUI)** – Componentes visuais com suporte a tema (incluindo Dark Mode).
- **Zustand** – Gerenciamento de estado global (histórico de chat, preferências).
- **React Query** – Estado do servidor (caching de requisições, loading, error handling).
- **Chrome Extension API** – `sidePanel`, `identity` (OAuth2), `storage`, `notifications`.
- **Ferramenta de build** (Vite/Webpack, conforme configuração do projeto).

---

## 🧩 Visão Geral da Extensão

A extensão adiciona um painel lateral ao Chrome que permite:

- Conversar com um assistente inteligente sobre um repositório GitHub específico.
- Enviar arquivos de texto (`.txt`, `.md`) para análise combinada.
- Acompanhar ingestões de repositório e geração de relatórios.
- Configurar agendamentos de relatórios por email, diretamente da UI.

---

## 🛠️ Pré-requisitos

- **Node.js** v18+
- **NPM** (ou **Yarn** / **pnpm**)
- Backend GitRAG rodando (local ou remoto), com suporte a:
  - Chat/RAG
  - Ingestão de repositórios
  - Agendamento e envio de relatórios

---

## ⚙️ Configuração do Ambiente

1. Clone o repositório:

   ```bash
   git clone https://github.com/darkruden/TCC2_RAG_FRONTEND.git
   cd TCC2_RAG_FRONTEND
   ```

2. Crie um arquivo `.env` na raiz do projeto, contendo ao menos:

   ```env
   VITE_API_BASE_URL=https://sua-api-gitrag.com
   # Outras variáveis (ex.: CLIENT_ID do Google) conforme usado no código
   ```

   Observação: em extensões Chrome, as variáveis de ambiente são “embutidas” no momento do build.  
   Sempre que alterar o `.env`, gere um novo build.

3. Instale as dependências:

   ```bash
   npm install
   # ou
   yarn install
   ```

---

## 📦 Build da Extensão

1. Execute o build:

   ```bash
   npm run build
   # ou
   yarn build
   ```

2. Após o build, será criada uma pasta `build/` (ou equivalente, de acordo com a sua configuração).

---

## 🧱 Estrutura do Projeto (Sugestão)

- `public/manifest.json`  
  Arquivo central da extensão. Define permissões, ícones, scripts e configura o **Side Panel**.

- `public/background.js`  
  Service Worker da extensão. Responsável por:
  - Polling de status de ingestão/relatórios.
  - Downloads e notificações.
  - Lógica que continua rodando mesmo sem a UI aberta.

- `src/AppWrapper.js`  
  Camada de autenticação e bootstrap da aplicação React:
  - Gerencia login via **Google OAuth2** usando a API `chrome.identity`.
  - Armazena e renova o token utilizado para chamar o backend.

- `src/services/api.js`  
  Camada de comunicação com o backend:
  - Endpoints para chat, ingestão de repositório, agendamentos.
  - Suporte a **Streaming de texto** (Server-Sent Events ou fetch streaming).

- `src/store/chatStore.js`  
  Store do **Zustand** para:
  - Manter o histórico de mensagens.
  - Persistir dados no `chrome.storage.local`.

---

## 🧪 Scripts Disponíveis

Verifique o `package.json`, mas em geral você terá:

- `npm run dev` – modo desenvolvimento (se configurado).
- `npm run build` – gera a versão final da extensão.
- `npm run lint` – verifica o código com ESLint.

---

## 🧩 Como Carregar a Extensão no Chrome

1. Execute o build:

   ```bash
   npm run build
   ```

2. Abra o Chrome e acesse:

   ```
   chrome://extensions/
   ```

3. Ative o **Modo do desenvolvedor** (canto superior direito).

4. Clique em **Carregar sem compactação** (*Load unpacked*).

5. Selecione a pasta `build/` gerada no passo de build.

6. A extensão será instalada e o ícone ficará disponível na barra do navegador.

---

## ✨ Funcionalidades Principais

- **Chat Contextual (RAG)**  
  Converse com o seu repositório GitHub usando linguagem natural.  
  O backend busca commits, issues, pull requests e arquivos relevantes para responder.

- **Streaming de Respostas**  
  As respostas chegam em tempo real, semelhante a um chat moderno.

- **Análise de Arquivos**  
  Upload de arquivos `.txt` e `.md` para análise combinada com o contexto do repositório.

- **Agendamento de Relatórios**  
  UI para configurar relatórios recorrentes (por exemplo, semanal) enviados por email, utilizando o backend GitRAG.

---

## 🤝 Integração com o Backend

Certifique-se de que o backend esteja configurado e rodando (localmente ou em nuvem) antes de usar a extensão.

- Backend FastAPI + RAG:  
  https://github.com/darkruden/TCC2_RAG_BACKEND

---

## 📄 Licença

Defina aqui a licença escolhida para o projeto (por exemplo, MIT, Apache 2.0, etc.).

---

## 📫 Contato

Caso queira contribuir, abrir issues ou sugerir melhorias, utilize a aba **Issues**:

- Backend: https://github.com/darkruden/TCC2_RAG_BACKEND  
- Frontend: https://github.com/darkruden/TCC2_RAG_FRONTEND
