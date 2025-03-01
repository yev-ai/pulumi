export default {
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  minify: true,
  target: 'es2020',
  splitting: false,
  treeshake: true,
  external: [
    '@pulumi/pulumi',
    '@pulumi/aws',
    '@pulumi/azure',
    '@pulumi/gcp',
    '@pulumi/cloudflare',
  ],
  outExtension: ({ format }) => ({
    js: format === 'esm' ? '.mjs' : '.js',
  }),
};
