// CÓDIGO COMPLETO E CORRIGIDO PARA: src/store/chatStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// --- CONSTANTE DE BOAS-VINDAS (Markdown) ---
const WELCOME_MESSAGE = `👋 **Olá! Sou seu assistente GitRAG.**

Aqui está o que posso fazer por você:

1. 🧠 **Chat com Código:** Pergunte sobre a lógica, arquitetura ou regras de negócio do repositório.
2. 📂 **Análise de Arquivos:** Clique no clipe 📎 para anexar um arquivo (.txt/.md) com instruções e eu analisarei junto com o código.
3. 📊 **Relatórios:** Peça *"Gere um relatório analítico"* para receber uma análise visual no seu email.
4. ⏰ **Agendamento:** Peça *"Agende um relatório diário às 08:00"* para monitoramento automático.

💡 **Exemplo de uso:**
*"Explique como funciona a autenticação neste projeto."*`;

const chromeStorage = {
  getItem: (name) => {
    return new Promise((resolve) => {
      if (window.chrome && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get([name], (result) => {
          resolve(result[name] ? JSON.stringify(result[name]) : null);
        });
      } else {
        console.warn("chrome.storage.local não encontrado, usando localStorage como fallback.");
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
      // Inicializa com a mensagem rica
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
      
      // Reseta para a mensagem rica
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