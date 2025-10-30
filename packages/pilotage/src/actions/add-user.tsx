import { createRegistry, define, defineCommands } from '@/commands'

// 1) Declare commands and their types
const defs = defineCommands({
  'math.add': define<{ a: number, b: number }, number>({ title: 'Add two numbers' }),
  'user.create': define<{ name: string }, { id: string, name: string }>({ title: 'Create a user' }),
})

// 2) Create a registry and implement handlers
const registry = createRegistry(defs)
const cmdAdd = registry.implement('math.add', ({ a, b }) => a + b)
cmdAdd.execute({ a: 1, b: 2 })
registry.implement('user.create', async ({ name }) => {
  return { id: `u_${Date.now()}`, name }
})

export async function addUser(_name: string): Promise<void> {
// 3) Execute with full type inference

}
