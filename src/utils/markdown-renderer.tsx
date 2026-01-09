import { TextAttributes } from '@opentui/core'
import React from 'react'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import { unified } from 'unified'

import type { ReactNode } from 'react'

const KeyedFragment = React.Fragment as React.FC<{ key?: string | number; children?: ReactNode }>

export interface MarkdownPalette {
  inlineCodeFg: string
  codeBackground: string
  codeHeaderFg: string
  headingFg: Record<number, string>
  listBulletFg: string
  blockquoteBorderFg: string
  blockquoteTextFg: string
  dividerFg: string
  codeTextFg: string
  codeMonochrome: boolean
  linkFg: string
}

const defaultPalette: MarkdownPalette = {
  inlineCodeFg: '#86efac',
  codeBackground: '#0d1117',
  codeHeaderFg: '#666',
  headingFg: {
    1: 'magenta',
    2: 'green',
    3: 'green',
    4: 'green',
    5: 'green',
    6: 'green',
  },
  listBulletFg: 'white',
  blockquoteBorderFg: 'gray',
  blockquoteTextFg: 'gray',
  dividerFg: '#666',
  codeTextFg: 'brightWhite',
  codeMonochrome: false,
  linkFg: '#3B82F6',
}

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkBreaks)

// Simplified renderer for now - full implementation is very large
export function renderMarkdown(
  markdown: string,
  options: { palette?: Partial<MarkdownPalette>; codeBlockWidth?: number } = {},
): ReactNode {
  // For now, just return the text. Full markdown rendering requires traversing the AST
  // which is quite involved to copy-paste fully.
  // We return a Fragment so it can be embedded in a parent <text> node without nesting <text> tags.
  return <>{markdown}</>
}

export function hasMarkdown(content: string): boolean {
  return /[*_`#>\-\+]|\[.*\]\(.*\)|```/.test(content)
}
