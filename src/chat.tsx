import React, { useRef, useState, useEffect } from 'react';
import { useChatStore } from './state/chat-store';
import { useTheme } from './hooks/use-theme';
import { driverManager } from './drivers';
import { MultilineInput, type MultilineInputHandle } from './components/multiline-input';
import { MessageBlock } from './components/message-block';
import { StatusBar } from './components/status-bar';
import { generateCode } from './utils/ai';

export const Chat = () => {
  const theme = useTheme();
  const { messages, inputValue, setInputValue, addMessage, inputFocused, setInputFocused, setStreaming } = useChatStore();
  const driver = driverManager.getCurrentDriver();
  const inputRef = useRef<MultilineInputHandle>(null);
  const [timerStartTime, setTimerStartTime] = useState<number | null>(null);

  // Auto-focus input
  useEffect(() => {
    if (inputFocused && inputRef.current) {
      inputRef.current.focus();
    }
  }, [inputFocused]);

  const handleSubmit = async () => {
    const text = inputValue.text.trim();
    if (!text) return;

    // User message
    addMessage({
      id: Date.now().toString(),
      variant: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString(),
    });

    setInputValue({ text: '', cursorPosition: 0, lastEditDueToNav: false });
    setStreaming(true);
    setTimerStartTime(Date.now());

    // AI message placeholder
    const aiMsgId = (Date.now() + 1).toString();
    
    try {
      // In a real app, this would be streaming. For now, we await the full response.
      // But we can simulate streaming by adding the message first with empty content/loading state?
      // For now, let's just wait and add.
      const response = await generateCode(text);
      
      addMessage({
        id: aiMsgId,
        variant: 'ai',
        content: response,
        timestamp: new Date().toLocaleTimeString(),
        isComplete: true,
      });
    } catch (err: any) {
       addMessage({
        id: aiMsgId,
        variant: 'ai', // or error variant if we had one
        content: `Error: ${err.message}`,
        timestamp: new Date().toLocaleTimeString(),
        isComplete: true,
      });
    } finally {
      setStreaming(false);
      setTimerStartTime(null);
    }
  };

  return (
    <box style={{ flexDirection: 'column', flexGrow: 1, padding: 0 }}>
      {/* Header */}
      <box style={{ height: 1, borderStyle: 'single', borderColor: theme.secondary, paddingLeft: 1, marginBottom: 0 }}>
        <text content={`MoveCoder - ${driver.name} Driver`} style={{ fg: theme.primary }} />
      </box>

      {/* Messages */}
      <scrollbox 
        style={{ flexGrow: 1, border: false, marginBottom: 0 }}
        stickyScroll
        stickyStart="bottom"
      >
        <box style={{ flexDirection: 'column', padding: 1 }}>
          {messages.map((msg) => (
            <box key={msg.id} style={{ marginBottom: 1, flexDirection: 'column' }}>
              <box style={{ flexDirection: 'row', gap: 1 }}>
                <text content={`[${msg.timestamp}]`} style={{ fg: theme.muted }} />
                <text content={msg.variant === 'user' ? 'YOU' : 'AI'} style={{ fg: msg.variant === 'user' ? theme.userLine : theme.aiLine }} />
              </box>
              <MessageBlock content={msg.content} isUser={msg.variant === 'user'} />
            </box>
          ))}
        </box>
      </scrollbox>

      {/* Status Bar */}
      <StatusBar 
        timerStartTime={timerStartTime}
        isAtBottom={true} // Simplified for now
        scrollToLatest={() => {}} 
        statusIndicatorState={{ kind: 'idle' }}
      />

      {/* Input */}
      <box style={{ height: 3, borderStyle: 'single', borderColor: theme.primary, paddingLeft: 1 }}>
        <MultilineInput
          ref={inputRef}
          value={inputValue.text}
          cursorPosition={inputValue.cursorPosition}
          onChange={(val) => setInputValue({ text: val.text, cursorPosition: val.cursorPosition, lastEditDueToNav: false })}
          onSubmit={handleSubmit}
          focused={inputFocused}
          placeholder="Type a task..."
        />
      </box>
    </box>
  );
};
