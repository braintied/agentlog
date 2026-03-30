# Contributing to AgentLog

Thank you for your interest in contributing to the AgentLog open standard.

## Ways to Contribute

- **Schema feedback** — open an issue describing what's missing or could be improved
- **New converters** — add support for additional AI coding tools (Aider, Codex, Cursor, etc.)
- **Bug fixes** — fix issues in existing converters or validation
- **Documentation** — improve examples, add guides, clarify the spec

## Development

```bash
# Install dependencies
npm install

# Type check
npm run typecheck

# Build
npm run build
```

## Adding a Converter

1. Create `src/convert/your-tool.ts`
2. Export a function that reads the tool's native format and returns an `AgentLog` object
3. Add the export to `package.json` exports
4. Add an example session file to `examples/`
5. Open a PR

## Spec Changes

Changes to the core schema (`src/schema.ts`) require:

1. An issue describing the change and rationale
2. Discussion before implementation
3. Updated Zod validators in `src/validate.ts`
4. Updated example files
5. A semver-appropriate version bump

## License

By contributing, you agree that your contributions will be licensed under the Apache-2.0 license.

## Code of Conduct

Be respectful. Be constructive. Focus on the work.
