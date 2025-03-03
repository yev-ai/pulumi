import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  minify: false,
  target: 'es2020',
  splitting: false,
  treeshake: true,
  external: ['@pulumi/pulumi', '@pulumi/aws', '@pulumi/azure', '@pulumi/gcp', '@pulumi/cloudflare'],
  outExtension: ({ format }) => ({
    js: format === 'esm' ? '.mjs' : '.js',
  }),
});
