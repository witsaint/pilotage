// Core types for a lightweight, type-safe command system

export interface CommandMeta {
  readonly title: string
  readonly description?: string
  readonly aliases?: readonly string[]
  readonly scope?: 'cli' | 'internal' | 'both'
}

export interface CommandSpec<Params, Result> {
  readonly __params: Params
  readonly __result: Result
  readonly meta: CommandMeta
}

export type CommandDefs = Record<string, CommandSpec<any, any>>

export type ParamsOf<Defs extends CommandDefs, K extends keyof Defs> = Defs[K] extends CommandSpec<infer P, any>
  ? P
  : never

export type ResultOf<Defs extends CommandDefs, K extends keyof Defs> = Defs[K] extends CommandSpec<any, infer R>
  ? R
  : never

export function define<Params, Result>(meta: CommandMeta): CommandSpec<Params, Result> {
  return ({ meta } as unknown as CommandSpec<Params, Result>)
}

export const defineCommands = <Defs extends CommandDefs>(defs: Defs): Defs => defs

export interface CommandHandleFor<Defs extends CommandDefs, K extends keyof Defs> {
  name: K
  meta: CommandMeta
  execute: (params: ParamsOf<Defs, K>) => Promise<ResultOf<Defs, K>>
  getMeta: () => CommandMeta
}

// Common reusable function/interface shapes to reduce duplication
export interface CommandHandler<Params, Result> {
  (params: Params): Result | Promise<Result>
}

export interface ExecuteFn<Defs extends CommandDefs> {
  <K extends keyof Defs>(name: K, params: ParamsOf<Defs, K>): Promise<ResultOf<Defs, K>>
}

export interface ImplementFn<Defs extends CommandDefs> {
  <K extends keyof Defs>(
    name: K,
    handler: CommandHandler<ParamsOf<Defs, K>, ResultOf<Defs, K>>
  ): CommandHandleFor<Defs, K>
}

export interface CommandListItem<Defs extends CommandDefs, K extends keyof Defs = keyof Defs> {
  name: K
  meta: CommandMeta
}

export interface CommandRegistryApi<Defs extends CommandDefs> {
  implement: ImplementFn<Defs>
  execute: ExecuteFn<Defs>
  resolve: (nameOrAlias: keyof Defs | string) => keyof Defs | undefined
  getMeta: (name: keyof Defs) => CommandMeta
  listCli: () => Array<CommandListItem<Defs>>
}
