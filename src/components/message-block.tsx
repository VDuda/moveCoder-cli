import React from 'react'
import { renderMarkdown } from '../utils/markdown-renderer'
import { useTheme } from '../hooks/use-theme'

interface MessageBlockProps {
  content: string
  isUser: boolean
}

export function MessageBlock({ content, isUser }: MessageBlockProps) {
  const theme = useTheme()
  const textColor = theme.foreground

  return (
    <text style={{ wrapMode: 'word', fg: textColor }}>
      {renderMarkdown(content)}
    </text>
  )
}