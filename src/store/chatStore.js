// CÓDIGO COMPLETO PARA: src/store/chatStore.js
// (Corrigido: Remove a declaração duplicada de 'chromeStorage' 
// e adiciona fallback para 'localStorage' para 'npm start' funcionar)

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Define o armazenamento (storage) que o Zustand usará
const chromeStorage = {
  getItem: (name) => {
    return new Promise((resolve) => {
      // Verifica se a API 'chrome.storage' existe
      if (window.chrome && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get([name], (result) => {
          // Resolve com o valor (ou null se não encontrado)
          resolve(result[name] ? JSON.stringify(result[name]) : null);
        });
      } else {
        // Fallback para localStorage (para 'npm start' no navegador)
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
        // Fallback para localStorage
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
        // Fallback para localStorage
        localStorage.removeItem(name);
        resolve();
      }
    });
  },
};

// (A definição duplicada que causou o erro foi REMOVIDA)

// Cria o "store"
export const useChatStore = create(
  // 1. 'persist' salva automaticamente o estado
  persist(
    (set, get) => ({
      // --- ESTADO (STATE) ---
      messages: [
        { id: '1', sender: 'bot', text: 'Olá! Como posso ajudar? Posso ingerir, consultar ou salvar uma instrução.' }
      ],
      inputPrompt: '',
      arquivo: null,
      
      // --- AÇÕES (ACTIONS) ---
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
        });
      },
      
      // Ação para o submit, que limpa o input
      submitPrompt: (userPrompt) => {
        get().addMessage('user', userPrompt);
        set({ inputPrompt: '', arquivo: null });
      },
    }),
    {
      // 2. Configuração da persistência
      name: 'tcc-rag-chat-storage', // Nome da chave no storage
      storage: createJSONStorage(() => chromeStorage), // Usa o storage híbrido
    }
  )
);