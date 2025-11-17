// CÓDIGO COMPLETO E CORRIGIDO PARA: src/store/chatStore.js
// (Adiciona os estados de streaming que faltavam)

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Define o armazenamento (storage) que o Zustand usará
const chromeStorage = {
  getItem: (name) => {
    return new Promise((resolve) => {
      if (window.chrome && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get([name], (result) => {
          resolve(result[name] ? JSON.stringify(result[name]) : null);
        });
      } else {
        // Fallback para dev local
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

// Cria o "store"
export const useChatStore = create(
  persist(
    (set, get) => ({
      // --- ESTADO (STATE) ---
      messages: [
        { id: '1', sender: 'bot', text: 'Olá! Como posso ajudar?' }
      ],
      inputPrompt: '',
      arquivo: null,
      isStreaming: false, // <-- ADICIONADO
      
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
          isStreaming: false,
        });
      },
      
      // Ação para o submit (usada pelo App.js)
      submitPrompt: (userPrompt) => {
        get().addMessage('user', userPrompt);
        set({ inputPrompt: '', arquivo: null });
      },

      // --- Ações de Streaming (ADICIONADAS) ---
      startBotMessage: () => {
        set((state) => ({
          isStreaming: true,
          messages: [...state.messages, { id: Date.now().toString(), sender: 'bot', text: '' }]
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