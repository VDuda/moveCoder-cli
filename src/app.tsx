import React from 'react';
import { Chat } from './chat';
import { useTheme } from './hooks/use-theme';

export const App = () => {
  const theme = useTheme();

  return (
    <box style={{ flexDirection: 'column', width: '100%', height: '100%', backgroundColor: theme.background }}>
      <Chat />
    </box>
  );
};
