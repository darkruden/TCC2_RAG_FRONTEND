// CÓDIGO ATUALIZADO: src/store/chatStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// --- NOVA MENSAGEM DE BOAS-VINDAS (Atualizada com a feature de Debugging) ---
const WELCOME_MESSAGE = `👋 **Olá! Sou seu assistente GitRAG.**

Eu cruzo o conhecimento do seu repositório com IA para te ajudar nestas 4 frentes:

1. 🧠 **Tire Dúvidas (RAG):** Pergunte sobre a arquitetura, regras de negócio ou onde uma feature foi implementada.
2. 📎 **Debug & Análise de Arquivos:** Clique no clipe para anexar um **Log de Erro** ou um **Código Externo**. Eu vou analisá-lo usando o contexto do projeto para descobrir a causa raiz.
3. 📊 **Relatórios Gerenciais:** Peça *"Gere um relatório de progresso"* para receber métricas e gráficos visuais no seu email.
4. ⏰ **Monitoramento Autônomo:** Peça *"Agende um relatório diário às 08:00"* e eu vigiarei o repositório para você.

💡 **Tente agora:**
*Anexe um arquivo de log e pergunte: "Por que esse erro está acontecendo?"*`;

// --- Configuração do Storage (Chrome vs Local) ---
const chromeStorage = {
  getItem: (name) => {
    return new Promise((resolve) => {
      if (window.chrome && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get([name], (result) => {
          resolve(result[name] ? JSON.stringify(result[name]) : null);
        });
      } else {
        // Fallback para desenvolvimento local (npm start)
        resolve(localStorage.getItem(name));
      }
    });
  },
  setItem: (name, value) => {
    return new Promise((resolve) => {
      if (window.chrome && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ [name]: JSON.parse(value) }, () => {
          resolve();
        });
      } else {
        localStorage.setItem(name, value);
        resolve();
      }
    });
  },
  removeItem: (name) => {
    return new Promise((resolve) => {
      if (window.chrome && chrome.storage && chrome.storage.local) {
        chrome.storage.local.remove([name], () => {
          resolve();
        });
      } else {
        localStorage.removeItem(name);
        resolve();
      }
    });
  },
};

export const useChatStore = create(
  persist(
    (set, get) => ({
      // Inicia com a mensagem rica
      messages: [
        { id: '1', sender: 'bot', text: WELCOME_MESSAGE }
      ],
      inputPrompt: '',
      arquivo: null,
      isStreaming: false,
      
      setInputPrompt: (prompt) => set({ inputPrompt: prompt }),
      setArquivo: (file) => set({ arquivo: file }),
      
      addMessage: (sender, text) => {
        set((state) => ({
          messages: [...state.messages, { id: Date.now().toString(), sender, text }]
        }));
      },
      
      // Ao limpar o chat, restaura a mensagem de boas-vindas
      clearChat: () => {
        set({
          messages: [
            { id: '1', sender: 'bot', text: WELCOME_MESSAGE }
          ],
          inputPrompt: '',
          arquivo: null,
          isStreaming: false,
        });
      },
      
      submitPrompt: (userPrompt) => {
        get().addMessage('user', userPrompt);
        set({ inputPrompt: '', arquivo: null });
      },

      startBotMessage: () => {
        set((state) => ({
          isStreaming: true,
          messages: [...state.messages, { id: Date.now().toString(), sender: 'bot', text: '' }]
        }));
      },
      
      setLastMessageSources: (sources) => {
        set((state) => ({
          messages: state.messages.map((msg, index) => 
            index === state.messages.length - 1 
            ? { ...msg, sources: sources } 
            : msg
          )
        }));
      },

      appendLastMessage: (token) => {
        set((state) => ({
          messages: state.messages.map((msg, index) => 
            index === state.messages.length - 1 
            ? { ...msg, text: msg.text + token } 
            : msg
          )
        }));
      },
      finishBotMessage: () => {
        set({ isStreaming: false });
      },
    }),
    {
      name: 'tcc-rag-chat-storage',
      storage: createJSONStorage(() => chromeStorage),
    }
  )
);