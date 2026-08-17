import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/convert/claude-code.ts',
    'src/convert/watchtower.ts',
    'src/convert/payload.ts',
    'src/convert/grok.ts',
  ],
  format: ['esm'],
  dts: true,
  clean: true,
  splitting: true,
});
