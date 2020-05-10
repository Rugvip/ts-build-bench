import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import typescript from 'rollup-plugin-typescript2';
import resolve from '@rollup/plugin-node-resolve';
import sucrase from '@rollup/plugin-sucrase';

const MODE = 'sucrase';

const plugins = [
  peerDepsExternal({
    includeDependencies: true,
  }),
];

if (MODE === 'typescript') {
  plugins.push(typescript());
} else if (MODE === 'sucrase') {
  plugins.push(
    resolve({
      mainFields: ['browser', 'module', 'main'],
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
    }),
    sucrase({
      transforms: ['typescript', 'jsx'],
    })
  );
} else {
  throw new Error('Invalid Rollup Mode');
}

export default {
  input: 'src/index.ts',
  output: {
    file: 'dist/index.js',
    format: 'module',
  },
  plugins,
};
