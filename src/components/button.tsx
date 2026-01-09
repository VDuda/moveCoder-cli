import React, { memo, useRef } from 'react'

interface ButtonProps {
  onClick?: (e?: unknown) => void | Promise<unknown>
  onMouseOver?: () => void
  onMouseOut?: () => void
  style?: Record<string, unknown>
  children?: React.ReactNode
  // pass-through for box host props
  [key: string]: unknown
}

export const Button = memo(({ onClick, onMouseOver, onMouseOut, style, children, ...rest }: ButtonProps) => {
  // Track whether mouse down occurred on this element to implement proper click detection
  const mouseDownRef = useRef(false)

  const handleMouseDown = () => {
    mouseDownRef.current = true
  }

  const handleMouseUp = (e?: unknown) => {
    if (mouseDownRef.current && onClick) {
      onClick(e)
    }
    mouseDownRef.current = false
  }

  const handleMouseOut = () => {
    mouseDownRef.current = false
    onMouseOut?.()
  }

  return (
    <box
      {...rest}
      style={style}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseOver={onMouseOver}
      onMouseOut={handleMouseOut}
    >
      {children}
    </box>
  )
})