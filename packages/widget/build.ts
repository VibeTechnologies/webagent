import * as esbuild from 'esbuild';

const isWatch = process.argv.includes('--watch');

const commonOptions: esbuild.BuildOptions = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  sourcemap: true,
  minify: !isWatch,
  target: ['es2022'],
  define: {
    'process.env.NODE_ENV': isWatch ? '"development"' : '"production"',
  },
  alias: {
    'react': 'preact/compat',
    'react-dom': 'preact/compat',
  },
  loader: {
    '.css': 'text',
  },
};

async function build() {
  // UMD-style IIFE build
  await esbuild.build({
    ...commonOptions,
    outfile: 'dist/webagent.min.js',
    format: 'iife',
    globalName: 'WebAgentBundle',
    footer: {
      js: 'if(typeof window!=="undefined"){window.WebAgent=WebAgentBundle.WebAgent||WebAgentBundle.default;}',
    },
  });

  // ESM build
  await esbuild.build({
    ...commonOptions,
    outfile: 'dist/webagent.esm.js',
    format: 'esm',
  });

  console.log('Build complete!');
}

if (isWatch) {
  const ctx = await esbuild.context({
    ...commonOptions,
    outfile: 'dist/webagent.min.js',
    format: 'iife',
    globalName: 'WebAgentBundle',
    footer: {
      js: 'if(typeof window!=="undefined"){window.WebAgent=WebAgentBundle.WebAgent||WebAgentBundle.default;}',
    },
  });
  await ctx.watch();
  console.log('Watching for changes...');
} else {
  build();
}
