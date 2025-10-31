export enum Level {
  DEFAULT = 'default',
  DEBUG = 'debug',
  INFO = 'info',
  DESC = 'desc',
  WARN = 'warn',
  ERROR = 'error',
  SUCCESS = 'success',
  PROCESS = 'process',
}

export const LEVELCOLOR_MAP = {
  [Level.DEFAULT]: '',
  [Level.DEBUG]: 'cyan',
  [Level.INFO]: 'blue',
  [Level.WARN]: 'yellow',
  [Level.DESC]: 'gray',
  [Level.ERROR]: 'red',
  [Level.SUCCESS]: 'green',
  [Level.PROCESS]: 'magenta',
}
