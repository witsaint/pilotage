import type { Status } from '@/config/status'
import type { Action } from '@/types/action'

export class SetConfigAction implements Action {
  public snapshot: Status
  private

  constructor(private readonly config: Status) {
    this.snapshot = config
  }

  run(): void {
    console.log(this.config)
  }

  restore(): void {
    console.log(this.config)
  }
}
