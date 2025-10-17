/**
 * 修补 console.log
 */
export function patchConsoleLog(): void {
  const originalConsole = console.log

  console.log = (...args: Parameters<typeof console.log>) => {
    originalConsole(...args)
  }
}
