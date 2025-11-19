// CÓDIGO COMPLETO E CORRIGIDO PARA: src/store/chatStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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
      messages: [
        { id: '1', sender: 'bot', text: 'Olá! Como posso ajudar? Posso ingerir, consultar ou salvar uma instrução.' }
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
      
      clearChat: () => {
        set({
          messages: [
            { id: '1', sender: 'bot', text: 'Olá! Como posso ajudar?' }
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
      
      // --- AÇÃO NOVA: Salva as fontes na última mensagem ---
      setLastMessageSources: (sources) => {
        set((state) => ({
          messages: state.messages.map((msg, index) => 
            index === state.messages.length - 1 
            ? { ...msg, sources: sources } // Adiciona a propriedade 'sources'
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