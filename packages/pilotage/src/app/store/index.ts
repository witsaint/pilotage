const messages: string[] = []

let listeners: ((message: string) => void)[] = []

export function addMessage(message: string): void {
  messages.push(message)
}

export function subscribe(listener: (message: string) => void): () => void {
  listeners = [...listeners, listener]
  return () => {
    listeners = listeners.filter(l => l !== listener)
  }
}
