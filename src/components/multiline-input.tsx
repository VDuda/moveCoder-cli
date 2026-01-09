import { TextAttributes } from '@opentui/core'
import { useKeyboard, useRenderer } from '@opentui/react'
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'

import { InputCursor } from './input-cursor'
import { useTheme } from '../hooks/use-theme'
import { useChatStore } from '../state/chat-store'
import { supportsTruecolor } from '../utils/theme-system'
import { clamp } from '../utils/math'
import { calculateNewCursorPosition } from '../utils/word-wrap-utils'

import type { InputValue } from '../state/chat-store'
import type {
  KeyEvent,
  MouseEvent,
  ScrollBoxRenderable,
  TextBufferView,
  TextRenderable,
} from '@opentui/core'

// Helper functions for text manipulation
function findLineStart(text: string, cursor: number): number {
  let pos = Math.max(0, Math.min(cursor, text.length))
  while (pos > 0 && text[pos - 1] !== '\n') {
    pos--
  }
  return pos
}

function findLineEnd(text: string, cursor: number): number {
  let pos = Math.max(0, Math.min(cursor, text.length))
  while (pos < text.length && text[pos] !== '\n') {
    pos++
  }
  return pos
}

function findPreviousWordBoundary(text: string, cursor: number): number {
  let pos = Math.max(0, Math.min(cursor, text.length))

  // Skip whitespace backwards
  while (pos > 0 && /\s/.test(text[pos - 1])) {
    pos--
  }

  // Skip word characters backwards
  while (pos > 0 && !/\s/.test(text[pos - 1])) {
    pos--
  }

  return pos
}

function findNextWordBoundary(text: string, cursor: number): number {
  let pos = Math.max(0, Math.min(cursor, text.length))

  // Skip non-whitespace forwards
  while (pos < text.length && !/\s/.test(text[pos])) {
    pos++
  }

  // Skip whitespace forwards
  while (pos < text.length && /\s/.test(text[pos])) {
    pos++
  }

  return pos
}

export const CURSOR_CHAR = '▍'
const CONTROL_CHAR_REGEX = /[\u0000-\u0008\u000b-\u000c\u000e-\u001f\u007f]/
const TAB_WIDTH = 4

function isPrintableCharacterKey(key: KeyEvent): boolean {
  const name = key.name
  if (!name) return true // multi-byte
  if (name.length === 1) return true // printable
  if (name === 'space') return true
  return false
}

// Helper to convert render position (in tab-expanded string) to original text position
function renderPositionToOriginal(text: string, renderPos: number): number {
  let originalPos = 0
  let currentRenderPos = 0

  while (originalPos < text.length && currentRenderPos < renderPos) {
    if (text[originalPos] === '\t') {
      currentRenderPos += TAB_WIDTH
    } else {
      currentRenderPos += 1
    }
    originalPos++
  }

  return Math.min(originalPos, text.length)
}

type KeyWithPreventDefault =
  | {
      preventDefault?: () => void
    }
  | null
  | undefined

function preventKeyDefault(key: KeyWithPreventDefault) {
  key?.preventDefault?.()
}

// Helper to check for alt-like modifier keys
function isAltModifier(key: KeyEvent): boolean {
  const ESC = '\x1b'
  return Boolean(
    key.option ||
      (key.sequence?.length === 2 &&
        key.sequence[0] === ESC &&
        key.sequence[1] !== '[')
  )
}

interface MultilineInputProps {
  value: string
  onChange: (value: InputValue) => void
  onSubmit: () => void
  onKeyIntercept?: (key: KeyEvent) => boolean
  onPaste?: (fallbackText?: string) => void
  placeholder?: string
  focused?: boolean
  shouldBlinkCursor?: boolean
  maxHeight?: number
  minHeight?: number
  cursorPosition: number
}

export type MultilineInputHandle = {
  focus: () => void
}

export const MultilineInput = forwardRef<MultilineInputHandle, MultilineInputProps>(
  function MultilineInput(
    {
      value,
      onChange,
      onSubmit,
      onPaste,
      placeholder = '',
      focused = true,
      shouldBlinkCursor,
      maxHeight = 5,
      minHeight = 1,
      onKeyIntercept,
      cursorPosition,
    }: MultilineInputProps,
    forwardedRef,
  ) {
    const theme = useTheme()
    const renderer = useRenderer()
    const hookBlinkValue = useChatStore((state) => state.isFocusSupported)
    const effectiveShouldBlinkCursor = shouldBlinkCursor ?? hookBlinkValue

    const scrollBoxRef = useRef<ScrollBoxRenderable | null>(null)
    const [lastActivity, setLastActivity] = useState(Date.now())

    const stickyColumnRef = useRef<number | null>(null)

    const getOrSetStickyColumn = useCallback(
      (lineStarts: number[], cursorIsChar: boolean): number => {
        if (stickyColumnRef.current != null) {
          return stickyColumnRef.current
        }
        const lineIndex = lineStarts.findLastIndex(
          (lineStart) => lineStart <= cursorPosition,
        )
        const column =
          lineIndex === -1
            ? 0
            : cursorPosition - lineStarts[lineIndex] + (cursorIsChar ? -1 : 0)
        stickyColumnRef.current = Math.max(0, column)
        return stickyColumnRef.current
      },
      [cursorPosition],
    )

    useEffect(() => {
      setLastActivity(Date.now())
    }, [value, cursorPosition])

    const textRef = useRef<TextRenderable | null>(null)

    const lineInfo = textRef.current
      ? (
          (textRef.current satisfies TextRenderable as any)
            .textBufferView as TextBufferView
        ).lineInfo
      : null

    useImperativeHandle(
      forwardedRef,
      () => ({
        focus: () => {
          const node = scrollBoxRef.current
          if (node && typeof (node as any).focus === 'function') {
            ;(node as any).focus()
          }
        },
      }),
      [],
    )

    const cursorRow = lineInfo
      ? Math.max(
          0,
          lineInfo.lineStarts.findLastIndex(
            (lineStart) => lineStart <= cursorPosition,
          ),
        )
      : 0

    useEffect(() => {
      const scrollBox = scrollBoxRef.current
      if (scrollBox && focused) {
        const scrollPosition = clamp(
          scrollBox.verticalScrollBar.scrollPosition,
          Math.max(0, cursorRow - scrollBox.viewport.height + 1),
          Math.min(scrollBox.scrollHeight - scrollBox.viewport.height, cursorRow),
        )

        scrollBox.verticalScrollBar.scrollPosition = scrollPosition
      }
    }, [scrollBoxRef.current, cursorPosition, focused, cursorRow])

    const insertTextAtCursor = useCallback(
      (textToInsert: string) => {
        if (!textToInsert) return

        const newValue =
          value.slice(0, cursorPosition) +
          textToInsert +
          value.slice(cursorPosition)
        onChange({
          text: newValue,
          cursorPosition: cursorPosition + textToInsert.length,
          lastEditDueToNav: false,
        })
      },
      [cursorPosition, onChange, value],
    )

    const moveCursor = useCallback(
      (nextPosition: number) => {
        const clamped = Math.max(0, Math.min(value.length, nextPosition))
        if (clamped === cursorPosition) return
        onChange({
          text: value,
          cursorPosition: clamped,
          lastEditDueToNav: false,
        })
      },
      [cursorPosition, onChange, value],
    )

    const handleMouseDown = useCallback(
      (event: MouseEvent) => {
        if (!focused) return

        stickyColumnRef.current = null

        const scrollBox = scrollBoxRef.current
        if (!scrollBox) return

        const lineStarts = lineInfo?.lineStarts ?? [0]

        const viewport = (scrollBox as any).viewport
        const viewportTop = Number(viewport?.y ?? 0)
        const viewportLeft = Number(viewport?.x ?? 0)

        const scrollPosition = scrollBox.verticalScrollBar?.scrollPosition ?? 0
        const clickRowInViewport = Math.floor(event.y - viewportTop)
        const clickRow = clickRowInViewport + scrollPosition

        const lineIndex = Math.min(
          Math.max(0, clickRow),
          lineStarts.length - 1,
        )

        const lineStartChar = lineStarts[lineIndex]
        const lineEndChar = lineStarts[lineIndex + 1] ?? value.length

        const clickCol = Math.max(0, Math.floor(event.x - viewportLeft))

        let visualCol = 0
        let charIndex = lineStartChar

        while (charIndex < lineEndChar && visualCol < clickCol) {
          const char = value[charIndex]
          if (char === '\t') {
            visualCol += TAB_WIDTH
          } else if (char === '\n') {
            break
          } else {
            visualCol += 1
          }
          charIndex++
        }

        const newCursorPosition = Math.min(charIndex, value.length)

        if (newCursorPosition !== cursorPosition) {
          onChange({
            text: value,
            cursorPosition: newCursorPosition,
            lastEditDueToNav: false,
          })
        }
      },
      [focused, lineInfo, value, cursorPosition, onChange],
    )

    const isPlaceholder = value.length === 0 && placeholder.length > 0
    const displayValue = isPlaceholder ? placeholder : value
    const showCursor = focused

    const displayValueForRendering = displayValue.replace(
      /\t/g,
      ' '.repeat(TAB_WIDTH),
    )

    let renderCursorPosition = 0
    for (let i = 0; i < cursorPosition && i < displayValue.length; i++) {
      renderCursorPosition += displayValue[i] === '\t' ? TAB_WIDTH : 1
    }

    const { beforeCursor, afterCursor, activeChar, shouldHighlight } = (() => {
      if (!showCursor) {
        return { beforeCursor: '', afterCursor: '', activeChar: ' ', shouldHighlight: false }
      }

      const beforeCursor = displayValueForRendering.slice(0, renderCursorPosition)
      const afterCursor = displayValueForRendering.slice(renderCursorPosition)
      const activeChar = afterCursor.charAt(0) || ' '
      const shouldHighlight =
        !isPlaceholder &&
        renderCursorPosition < displayValueForRendering.length &&
        displayValue[cursorPosition] !== '\n' &&
        displayValue[cursorPosition] !== '\t'

      return {
        beforeCursor,
        afterCursor,
        activeChar,
        shouldHighlight,
      }
    })()

    const handleEnterKeys = useCallback(
      (key: KeyEvent): boolean => {
        const isEnterKey = key.name === 'return' || key.name === 'enter'
        if (!isEnterKey) return false

        const lowerKeyName = (key.name ?? '').toLowerCase()
        const isAltLikeModifier = isAltModifier(key)
        const hasEscapePrefix =
          typeof key.sequence === 'string' &&
          key.sequence.length > 0 &&
          key.sequence.charCodeAt(0) === 0x1b
        const hasBackslashBeforeCursor = 
          cursorPosition > 0 && value[cursorPosition - 1] === '\\'

        const isPlainEnter = 
          isEnterKey &&
          !key.shift &&
          !key.ctrl &&
          !key.meta &&
          !key.option &&
          !isAltLikeModifier &&
          !hasEscapePrefix &&
          key.sequence === '\r' &&
          !hasBackslashBeforeCursor
        const isShiftEnter = isEnterKey && (Boolean(key.shift) || key.sequence === '\n')
        const isOptionEnter = isEnterKey && (isAltLikeModifier || hasEscapePrefix)
        const isCtrlJ = 
          key.ctrl &&
          !key.meta &&
          !key.option &&
          (lowerKeyName === 'j' || isEnterKey)
        const isBackslashEnter = isEnterKey && hasBackslashBeforeCursor

        const shouldInsertNewline =
          isShiftEnter || isOptionEnter || isCtrlJ || isBackslashEnter

        if (shouldInsertNewline) {
          preventKeyDefault(key)

          if (isBackslashEnter) {
            const newValue =
              value.slice(0, cursorPosition - 1) + '\n' + value.slice(cursorPosition)
            onChange({
              text: newValue,
              cursorPosition,
              lastEditDueToNav: false,
            })
            return true
          }

          const newValue = value.slice(0, cursorPosition) + '\n' + value.slice(cursorPosition)
          onChange({
            text: newValue,
            cursorPosition: cursorPosition + 1,
            lastEditDueToNav: false,
          })
          return true
        }

        if (isPlainEnter) {
          preventKeyDefault(key)
          onSubmit()
          return true
        }

        return false
      },
      [value, cursorPosition, onChange, onSubmit],
    )

    const handleDeletionKeys = useCallback(
      (key: KeyEvent): boolean => {
        const lowerKeyName = (key.name ?? '').toLowerCase()
        const isAltLikeModifier = isAltModifier(key)
        const lineStart = findLineStart(value, cursorPosition)
        const lineEnd = findLineEnd(value, cursorPosition)
        const wordStart = findPreviousWordBoundary(value, cursorPosition)
        const wordEnd = findNextWordBoundary(value, cursorPosition)

        if (key.ctrl && lowerKeyName === 'u' && !key.meta && !key.option) {
          preventKeyDefault(key)
          const visualLineStart = lineInfo?.lineStarts?.[cursorRow] ?? lineStart

          if (cursorPosition > visualLineStart) {
            const newValue =
              value.slice(0, visualLineStart) + value.slice(cursorPosition)
            onChange({
              text: newValue,
              cursorPosition: visualLineStart,
              lastEditDueToNav: false,
            })
          } else if (cursorPosition > 0) {
            const newValue =
              value.slice(0, cursorPosition - 1) + value.slice(cursorPosition)
            onChange({
              text: newValue,
              cursorPosition: cursorPosition - 1,
              lastEditDueToNav: false,
            })
          }
          return true
        }

        if (
          (key.name === 'backspace' && isAltLikeModifier) ||
          (key.ctrl && lowerKeyName === 'w')
        ) {
          preventKeyDefault(key)
          const newValue =
            value.slice(0, wordStart) + value.slice(cursorPosition)
          onChange({
            text: newValue,
            cursorPosition: wordStart,
            lastEditDueToNav: false,
          })
          return true
        }

        if (key.name === 'delete' && key.meta && !isAltLikeModifier) {
          preventKeyDefault(key)
          const originalValue = value
          let newValue = originalValue
          let nextCursor = cursorPosition

          if (cursorPosition > 0) {
            if (
              cursorPosition === lineStart &&
              value[cursorPosition - 1] === '\n'
            ) {
              newValue =
                value.slice(0, cursorPosition - 1) + value.slice(cursorPosition)
              nextCursor = cursorPosition - 1
            } else {
              newValue = value.slice(0, lineStart) + value.slice(cursorPosition)
              nextCursor = lineStart
            }
          }

          if (newValue !== originalValue) {
            onChange({
              text: newValue,
              cursorPosition: nextCursor,
              lastEditDueToNav: false,
            })
          }
          return true
        }

        if (key.name === 'delete' && isAltLikeModifier) {
          preventKeyDefault(key)
          const newValue = value.slice(0, cursorPosition) + value.slice(wordEnd)
          onChange({
            text: newValue,
            cursorPosition,
            lastEditDueToNav: false,
          })
          return true
        }

        if (key.ctrl && lowerKeyName === 'k' && !key.meta && !key.option) {
          preventKeyDefault(key)
          const newValue = value.slice(0, cursorPosition) + value.slice(lineEnd)
          onChange({ text: newValue, cursorPosition, lastEditDueToNav: false })
          return true
        }

        if (key.ctrl && lowerKeyName === 'h' && !key.meta && !key.option) {
          preventKeyDefault(key)
          if (cursorPosition > 0) {
            const newValue =
              value.slice(0, cursorPosition - 1) + value.slice(cursorPosition)
            onChange({
              text: newValue,
              cursorPosition: cursorPosition - 1,
              lastEditDueToNav: false,
            })
          }
          return true
        }

        if (key.ctrl && lowerKeyName === 'd' && !key.meta && !key.option) {
          preventKeyDefault(key)
          if (cursorPosition < value.length) {
            const newValue =
              value.slice(0, cursorPosition) + value.slice(cursorPosition + 1)
            onChange({
              text: newValue,
              cursorPosition,
              lastEditDueToNav: false,
            })
          }
          return true
        }

        if (key.name === 'backspace' && !key.ctrl && !key.meta && !key.option) {
          preventKeyDefault(key)
          if (cursorPosition > 0) {
            const newValue =
              value.slice(0, cursorPosition - 1) + value.slice(cursorPosition)
            onChange({
              text: newValue,
              cursorPosition: cursorPosition - 1,
              lastEditDueToNav: false,
            })
          }
          return true
        }

        if (key.name === 'delete' && !key.ctrl && !key.meta && !key.option) {
          preventKeyDefault(key)
          if (cursorPosition < value.length) {
            const newValue =
              value.slice(0, cursorPosition) + value.slice(cursorPosition + 1)
            onChange({
              text: newValue,
              cursorPosition,
              lastEditDueToNav: false,
            })
          }
          return true
        }

        return false
      },
      [value, cursorPosition, onChange, lineInfo, cursorRow],
    )

    const handleNavigationKeys = useCallback(
      (key: KeyEvent): boolean => {
        const lowerKeyName = (key.name ?? '').toLowerCase()
        const isAltLikeModifier = isAltModifier(key)
        const logicalLineStart = findLineStart(value, cursorPosition)
        const logicalLineEnd = findLineEnd(value, cursorPosition)
        const wordStart = findPreviousWordBoundary(value, cursorPosition)
        const wordEnd = findNextWordBoundary(value, cursorPosition)

        const currentLineInfo = textRef.current
          ? ((textRef.current as any).textBufferView as TextBufferView)?.lineInfo
          : null

        const lineStarts = currentLineInfo?.lineStarts ?? []
        const visualLineIndex = lineStarts.findLastIndex(
          (start) => start <= cursorPosition,
        )
        const visualLineStart = visualLineIndex >= 0
          ? lineStarts[visualLineIndex]
          : logicalLineStart
        const visualLineEnd = lineStarts[visualLineIndex + 1] !== undefined
          ? lineStarts[visualLineIndex + 1] - 1
          : logicalLineEnd

        if (
          isAltLikeModifier &&
          (key.name === 'left' || lowerKeyName === 'b')
        ) {
          preventKeyDefault(key)
          onChange({
            text: value,
            cursorPosition: wordStart,
            lastEditDueToNav: false,
          })
          return true
        }

        if (
          isAltLikeModifier &&
          (key.name === 'right' || lowerKeyName === 'f')
        ) {
          preventKeyDefault(key)
          onChange({
            text: value,
            cursorPosition: wordEnd,
            lastEditDueToNav: false,
          })
          return true
        }

        if (
          (key.meta && key.name === 'left' && !isAltLikeModifier) ||
          (key.ctrl && lowerKeyName === 'a' && !key.meta && !key.option) ||
          (key.name === 'home' && !key.ctrl && !key.meta)
        ) {
          preventKeyDefault(key)
          onChange({
            text: value,
            cursorPosition: visualLineStart,
            lastEditDueToNav: false,
          })
          return true
        }

        if (
          (key.meta && key.name === 'right' && !isAltLikeModifier) ||
          (key.ctrl && lowerKeyName === 'e' && !key.meta && !key.option) ||
          (key.name === 'end' && !key.ctrl && !key.meta)
        ) {
          preventKeyDefault(key)
          onChange({
            text: value,
            cursorPosition: visualLineEnd,
            lastEditDueToNav: false,
          })
          return true
        }

        if (
          (key.meta && key.name === 'up') ||
          (key.ctrl && key.name === 'home')
        ) {
          preventKeyDefault(key)
          onChange({ text: value, cursorPosition: 0, lastEditDueToNav: false })
          return true
        }

        if (
          (key.meta && key.name === 'down') ||
          (key.ctrl && key.name === 'end')
        ) {
          preventKeyDefault(key)
          onChange({
            text: value,
            cursorPosition: value.length,
            lastEditDueToNav: false,
          })
          return true
        }

        if (key.ctrl && lowerKeyName === 'b' && !key.meta && !key.option) {
          preventKeyDefault(key)
          onChange({
            text: value,
            cursorPosition: cursorPosition - 1,
            lastEditDueToNav: false,
          })
          return true
        }

        if (key.ctrl && lowerKeyName === 'f' && !key.meta && !key.option) {
          preventKeyDefault(key)
          onChange({
            text: value,
            cursorPosition: Math.min(value.length, cursorPosition + 1),
            lastEditDueToNav: false,
          })
          return true
        }

        if (key.name === 'left' && !key.ctrl && !key.meta && !key.option) {
          preventKeyDefault(key)
          moveCursor(cursorPosition - 1)
          return true
        }

        if (key.name === 'right' && !key.ctrl && !key.meta && !key.option) {
          preventKeyDefault(key)
          moveCursor(cursorPosition + 1)
          return true
        }

        if (key.name === 'up' && !key.ctrl && !key.meta && !key.option) {
          preventKeyDefault(key)
          const desiredIndex = getOrSetStickyColumn(lineStarts, !shouldHighlight)
          onChange({
            text: value,
            cursorPosition: calculateNewCursorPosition({
              cursorPosition,
              lineStarts,
              cursorIsChar: !shouldHighlight,
              direction: 'up',
              desiredIndex,
            }),
            lastEditDueToNav: false,
          })
          return true
        }

        if (key.name === 'down' && !key.ctrl && !key.meta && !key.option) {
          preventKeyDefault(key)
          const desiredIndex = getOrSetStickyColumn(lineStarts, !shouldHighlight)
          onChange({
            text: value,
            cursorPosition: calculateNewCursorPosition({
              cursorPosition,
              lineStarts,
              cursorIsChar: !shouldHighlight,
              direction: 'down',
              desiredIndex,
            }),
            lastEditDueToNav: false,
          })
          return true
        }

        return false
      },
      [value, cursorPosition, onChange, moveCursor, shouldHighlight, getOrSetStickyColumn],
    )

    const handleCharacterInput = useCallback(
      (key: KeyEvent): boolean => {
        if (
          key.name === 'tab' &&
          key.sequence &&
          !key.shift &&
          !key.ctrl &&
          !key.meta &&
          !key.option
        ) {
          return false
        }

        if (
          key.sequence &&
          key.sequence.length >= 1 &&
          !key.ctrl &&
          !key.meta &&
          !key.option &&
          !CONTROL_CHAR_REGEX.test(key.sequence) &&
          isPrintableCharacterKey(key)
        ) {
          preventKeyDefault(key)
          insertTextAtCursor(key.sequence)
          return true
        }

        return false
      },
      [insertTextAtCursor],
    )

    useKeyboard(
      useCallback(
        (key: KeyEvent) => {
          if (!focused) return

          if (onKeyIntercept) {
            const handled = onKeyIntercept(key)
            if (handled) return
          }

          const isVerticalNavKey = key.name === 'up' || key.name === 'down'
          if (!isVerticalNavKey) {
            stickyColumnRef.current = null
          }

          if (handleEnterKeys(key)) return
          if (handleDeletionKeys(key)) return
          if (handleNavigationKeys(key)) return
          if (handleCharacterInput(key)) return
        },
        [
          focused,
          onKeyIntercept,
          handleEnterKeys,
          handleDeletionKeys,
          handleNavigationKeys,
          handleCharacterInput,
        ],
      ),
    )

    const layoutMetrics = (() => {
      const safeMaxHeight = Math.max(1, maxHeight)
      const effectiveMinHeight = Math.max(1, Math.min(minHeight, safeMaxHeight))

      const totalLines =
        lineInfo === null ? 0 : lineInfo.lineStarts.length

      const gutterEnabled =
        totalLines === 2 && cursorRow === 1 && totalLines + 1 <= safeMaxHeight

      const rawHeight = Math.min(
        totalLines + (gutterEnabled ? 1 : 0),
        safeMaxHeight,
      )

      const heightLines = Math.max(effectiveMinHeight, rawHeight)

      return {
        heightLines,
        gutterEnabled,
      }
    })()

    const inputColor = isPlaceholder
      ? theme.muted
      : focused
        ? '#ffffff'
        : '#f5f5f5'

    const highlightBg = theme.info

    return (
      <scrollbox
        ref={scrollBoxRef}
        scrollX={false}
        stickyScroll={true}
        stickyStart="bottom"
        scrollbarOptions={{ visible: false }}
        onPaste={(event) => onPaste?.(event.text)}
        onMouseDown={handleMouseDown}
        style={{
          flexGrow: 0,
          flexShrink: 0,
          rootOptions: {
            width: '100%',
            height: layoutMetrics.heightLines,
            backgroundColor: 'transparent',
            flexGrow: 0,
            flexShrink: 0,
          },
          wrapperOptions: {
            paddingLeft: 1,
            paddingRight: 1,
            border: false,
          },
          contentOptions: {
            justifyContent: 'flex-start',
          },
        }}
      >
        <text
          ref={textRef}
          style={{ bg: 'transparent', fg: inputColor, wrapMode: 'word' }}
        >
          {showCursor ? (
            <>
              {beforeCursor}
              {shouldHighlight ? (
                <span
                  bg={highlightBg}
                  fg={theme.background}
                  attributes={TextAttributes.BOLD}
                >
                  {activeChar === ' ' ? '\u00a0' : activeChar}
                </span>
              ) : (
                <InputCursor
                  visible={true}
                  focused={focused}
                  shouldBlink={effectiveShouldBlinkCursor}
                  color={supportsTruecolor() ? theme.info : 'lime'}
                  key={lastActivity}
                />
              )}
              {shouldHighlight
                ? afterCursor.length > 0
                  ? afterCursor.slice(1)
                  : ''
                : afterCursor}
              {layoutMetrics.gutterEnabled ? '\n' : ''}
            </>
          ) : (
            <>
              {displayValueForRendering}
              {layoutMetrics.gutterEnabled ? '\n' : ''}
            </>
          )}
        </text>
      </scrollbox>
    )
  },
)
