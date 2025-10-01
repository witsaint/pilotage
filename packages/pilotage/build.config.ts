import path from 'node:path'
import process from 'node:process'
import { defineBuildConfig } from 'unbuild'

const isDev = process.argv.includes('--dev')

export default defineBuildConfig({
  entries: ['src/index'],
  declaration: true,
  clean: true,
  rollup: {
    emitCJS: true,
    resolve: {},
    alias: {
      entries: [{ find: '@', replacement: path.resolve(__dirname, 'src') }],
    },
    esbuild: {
      minify: !isDev,
    },
  },
  hooks: {
    'build:done': () => {},
  },
})
