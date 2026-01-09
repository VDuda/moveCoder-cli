export function supportsTruecolor(): boolean {
  return process.env.COLORTERM === 'truecolor';
}
