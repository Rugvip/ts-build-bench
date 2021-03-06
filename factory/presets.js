const presets = {
  components: {
    balanced: (n) => [
      ...Array((n / 2) | 0).fill('small'),
      ...Array((n / 2) | 0).fill('medium'),
    ],
    normalImports: (n) => Array(n).fill('medium'),
    specificImports: (n) => Array(n).fill('specific-imports'),
  },
  libs: {
    balanced: (n) => Array(n).fill('medium'),
  },
  packages: {
    balanced: (n) => ({
      libs: presets.libs.balanced(Math.round(n / 3)),
      components: presets.components.balanced(Math.round((n * 2) / 3)),
    }),
    libs: (n) => ({
      libs: presets.libs.balanced(n),
      components: [],
    }),
    components: (n) => ({
      libs: [],
      components: presets.components.balanced(n),
    }),
  },
  baseConfig: (config) => ({
    path: 'workdir/bench',
    main: 'dist/index.js',
    types: 'src/index.ts',
    componentExports: 'default', // or named
    packages: Array(5).fill(presets.packages.balanced(5)),
    ...config,
  }),
  dimensions: {
    packageSizes: () => ({
      small: {
        packages: Array(5).fill(presets.packages.balanced(3)),
      },
      medium: {
        packages: Array(10).fill(presets.packages.balanced(10)),
      },
      large: {
        packages: Array(20).fill(presets.packages.balanced(20)),
      },
    }),
    muiImportMethod: () => ({
      muiIndex: {
        packages: Array(5).fill({
          libs: presets.libs.balanced(1),
          components: presets.components.normalImports(4),
        }),
      },
      muiSpecific: {
        packages: Array(5).fill({
          libs: presets.libs.balanced(1),
          components: presets.components.specificImports(4),
        }),
      },
    }),
    typesEntrypoint: () => ({
      typesDist: {
        types: 'dist/index.d.ts',
      },
      typesSrc: {
        types: 'src/index.ts',
      },
    }),
    singlePackage: () => ({
      monoRepo: {
        singlePackage: false,
      },
      onePackage: {
        singlePackage: true,
      },
    }),
    projectReferences: () => ({
      rootRefs: {
        projectReferences: true,
      },
      noRefs: {
        projectReferences: false,
      },
    }),
    componentExports: () => ({
      exportDefault: {
        componentExports: 'default',
      },
      exportNamed: {
        componentExports: 'named',
      },
    }),
    buildStrategies: () => ({
      buildTsc: {
        buildMode: 'tsc',
      },
      buildRollupTs: {
        buildMode: 'rollup-typescript',
      },
      buildRollupSucrase: {
        buildMode: 'rollup-sucrase',
      },
      buildNone: {
        buildMode: 'none',
      },
    }),
    bundleStrategies: () => ({
      bundleTsTranspile: {
        bundleMode: 'ts-transpile',
      },
      bundleTsFork: {
        bundleMode: 'ts-fork',
      },
      bundleSucrase: {
        bundleMode: 'sucrase-transpile',
      },
      bundleSucraseFork: {
        bundleMode: 'sucrase-fork',
      },
    }),
    bundleSourcemaps: () => ({
      withMap: {
        bundleSourcemaps: true,
      },
      noMap: {
        bundleSourcemaps: false,
      },
    }),
  },
};

module.exports = presets;
