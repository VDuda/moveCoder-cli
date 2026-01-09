export type StreamStatus = 'idle' | 'waiting' | 'streaming'

export type StatusIndicatorState =
  | { kind: 'idle' }
  | { kind: 'clipboard'; message: string }
  | { kind: 'ctrlC' }
  | { kind: 'connecting' }
  | { kind: 'retrying' }
  | { kind: 'waiting' }
  | { kind: 'streaming' }
  | { kind: 'reconnected' }
  | { kind: 'paused' }

export type AuthStatus = 'ok' | 'retrying' | 'unreachable'

export type StatusIndicatorStateArgs = {
  statusMessage?: string | null
  streamStatus: StreamStatus
  nextCtrlCWillExit: boolean
  isConnected: boolean
  authStatus?: AuthStatus
  isRetrying?: boolean
  showReconnectionMessage?: boolean
  isAskUserActive?: boolean
}

export const getStatusIndicatorState = ({
  statusMessage,
  streamStatus,
  nextCtrlCWillExit,
  isConnected,
  authStatus = 'ok',
  isRetrying = false,
  showReconnectionMessage = false,
  isAskUserActive = false,
}: StatusIndicatorStateArgs): StatusIndicatorState => {
  if (nextCtrlCWillExit) {
    return { kind: 'ctrlC' }
  }

  if (statusMessage) {
    return { kind: 'clipboard', message: statusMessage }
  }

  if (showReconnectionMessage) {
    return { kind: 'reconnected' }
  }

  if (authStatus === 'retrying' || isRetrying) {
    return { kind: 'retrying' }
  }

  if (!isConnected || authStatus === 'unreachable') {
    return { kind: 'connecting' }
  }

  if (isAskUserActive) {
    return { kind: 'paused' }
  }

  if (streamStatus === 'waiting') {
    return { kind: 'waiting' }
  }

  if (streamStatus === 'streaming') {
    return { kind: 'streaming' }
  }

  return { kind: 'idle' }
}
