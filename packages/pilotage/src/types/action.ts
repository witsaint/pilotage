export interface Action {
  // 快照数据
  snapshot: unknown
  // 流程
  run: (input?: string | unknown) => void
  //  恢复快照
  restore: () => void
}
