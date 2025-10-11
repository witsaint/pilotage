# pilotage Development Guidelines

Auto-generated from all feature plans. Last updated: [DATE]

## Active Technologies
Typescript、debuger、cac、node

## Project Structure
- packages/pilotage the core package, gen SSD workflow with provider
- spec-kit the spec-kit standard development ssd

## Commands
dev: `pnpm dev` or `pnpm stub`
debug: `pnpm link --global` then use `pilotage` command
build: `pnpm build`
test： `pnpm test`
publish: `pnpm release`

## Code Style
- **Consistency**: Maintain consistent naming for commands, options, and parameters
- **Discoverability**: Provide clear help information and auto-completion
- **Composability**: Support pipe operations and script integration
- **Error Handling**: Provide meaningful error messages and exit codes

## Development Rules
- **Examples in tests/**: Put example code in test files under tests/ directory
- **Documentation in docs/**: Put documentation in docs/ directory at project root
- **Script additions**: Only add new scripts to package.json when explicitly requested
- **Code organization**: Keep src/ directory clean with only core functionality

## Recent Changes
[LAST 3 FEATURES AND WHAT THEY ADDED]

## Git Commit

[type]<[modules]>:[desc]
