import type {
  CommandDefs,
  CommandHandleFor,
  CommandHandler,
  CommandListItem,
  CommandRegistryApi,
  ParamsOf,
  ResultOf,
} from './_types'
import type { CommandMeta } from './_types'

export { define, defineCommands } from './_types'
import { Text } from 'ink'
import { addMessage } from '@/app/store'
import { MessageType } from '@/types/message'

export function addUserCommand(): void {
  addMessage(<Text color="cyan">addUserCommand</Text>, MessageType.Ele)
}

export function createRegistry<Defs extends CommandDefs>(_defs: Defs): CommandRegistryApi<Defs> {
  type Keys = keyof Defs

  const handlers = new Map<string, (params: unknown) => unknown | Promise<unknown>>()
  const aliasToName = new Map<string, string>()

  function implement<K extends Keys>(name: K, handler: CommandHandler<ParamsOf<Defs, K>, ResultOf<Defs, K>>): CommandHandleFor<Defs, K> {
    handlers.set(String(name), handler as (params: unknown) => unknown | Promise<unknown>)
    const meta = getMeta(name)
    return {
      name,
      meta,
      execute: (params: ParamsOf<Defs, K>): Promise<ResultOf<Defs, K>> => execute(name, params),
      getMeta: (): CommandMeta => meta,
    }
  }

  async function execute<K extends Keys>(name: K, params: ParamsOf<Defs, K>): Promise<ResultOf<Defs, K>> {
    const h = handlers.get(String(name))
    if (!h) {
      throw new Error(`Command not implemented: ${String(name)}`)
    }

    return await h(params) as ResultOf<Defs, K>
  }

  // initialize alias map from defs meta
  for (const key in _defs) {
    const spec = _defs[key as Keys] as any
    const meta: CommandMeta | undefined = spec?.meta
    const aliases = meta?.aliases
    if (aliases && Array.isArray(aliases)) {
      for (const a of aliases) {
        aliasToName.set(a, key)
      }
    }
  }

  function resolve(nameOrAlias: Keys | string): Keys | undefined {
    if (Object.prototype.hasOwnProperty.call(_defs, String(nameOrAlias))) {
      return nameOrAlias as Keys
    }
    const resolved = aliasToName.get(String(nameOrAlias))
    return (resolved as Keys | undefined)
  }

  function getMeta(name: Keys): CommandMeta {
    const spec = _defs[name] as any
    return spec.meta as CommandMeta
  }

  function listCli(): Array<CommandListItem<Defs>> {
    const out: Array<CommandListItem<Defs>> = []
    for (const key in _defs) {
      const spec = _defs[key as Keys] as any
      const meta: CommandMeta = spec.meta
      const scope = meta?.scope || 'both'
      if (scope === 'cli' || scope === 'both') {
        out.push({ name: key as Keys, meta })
      }
    }
    return out
  }

  const api: CommandRegistryApi<Defs> = { implement, execute, resolve, getMeta, listCli }
  return api
}
