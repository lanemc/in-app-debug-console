import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import terser from '@rollup/plugin-terser';

export default [
  {
    input: 'src/node/index.js',
    output: [
      {
        file: 'dist/index.js',
        format: 'cjs',
        exports: 'auto'
      },
      {
        file: 'dist/index.esm.js',
        format: 'esm'
      }
    ],
    plugins: [
      resolve({
        preferBuiltins: true
      }),
      commonjs(),
      json()
    ],
    external: ['express', 'http', 'path', 'fs', 'crypto']
  },
  {
    input: 'src/node/index.js',
    output: {
      file: 'dist/index.min.js',
      format: 'cjs',
      exports: 'auto'
    },
    plugins: [
      resolve({
        preferBuiltins: true
      }),
      commonjs(),
      json(),
      terser()
    ],
    external: ['express', 'http', 'path', 'fs', 'crypto']
  }
];