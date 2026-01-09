import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { ChatMessage } from '../types/chat';
import type { StoreApi, UseBoundStore } from 'zustand';

export type InputValue = {
  text: string;
  cursorPosition: number;
  lastEditDueToNav: boolean;
};

interface ChatState {
  messages: ChatMessage[];
  isStreaming: boolean;
  isChainInProgress: boolean;
  inputValue: InputValue;
  inputFocused: boolean;
  isFocusSupported: boolean;
  currentDriverId: string;
}

interface ChatActions {
  setMessages: (updater: (prev: ChatMessage[]) => ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  setStreaming: (isStreaming: boolean) => void;
  setChainInProgress: (inProgress: boolean) => void;
  setInputValue: (value: InputValue) => void;
  setInputFocused: (focused: boolean) => void;
  setIsFocusSupported: (supported: boolean) => void;
  setDriver: (id: string) => void;
}

type ChatStore = ChatState & ChatActions;

export const useChatStore: UseBoundStore<StoreApi<ChatStore>> = create<ChatStore>()(
  immer((set) => ({
    messages: [],
    isStreaming: false,
    isChainInProgress: false,
    inputValue: { text: '', cursorPosition: 0, lastEditDueToNav: false },
    inputFocused: true,
    isFocusSupported: false,
    currentDriverId: 'movement',

    setMessages: (updater) =>
      set((state) => {
        state.messages = updater(state.messages);
      }),

    addMessage: (message) =>
      set((state) => {
        state.messages.push(message);
      }),

    setStreaming: (isStreaming) =>
      set((state) => {
        state.isStreaming = isStreaming;
      }),

    setChainInProgress: (inProgress) =>
      set((state) => {
        state.isChainInProgress = inProgress;
      }),

    setInputValue: (value) =>
      set((state) => {
        state.inputValue = value;
      }),

    setInputFocused: (focused) =>
      set((state) => {
        state.inputFocused = focused;
      }),

    setIsFocusSupported: (supported) =>
      set((state) => {
        state.isFocusSupported = supported;
      }),

    setDriver: (id) =>
      set((state) => {
        state.currentDriverId = id;
      }),
  }))
);