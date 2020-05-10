const { createProjectMatrix } = require('./factory');
const { MatrixRunner } = require('./runner');

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
  baseConfig: () => ({
    path: 'workdir/bench',
    main: 'dist/index.js',
    types: 'dist/index.d.ts',
    componentExports: 'default', // or named
    packages: Array(5).fill(presets.packages.balanced(5)),
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
    componentExports: () => ({
      exportDefault: {
        componentExports: 'default',
      },
      exportNamed: {
        componentExports: 'named',
      },
    }),
  },
};

async function main() {
  const projects = await createProjectMatrix({
    baseConfig: presets.baseConfig(),
    dimensions: [
      presets.dimensions.muiImportMethod(),
      presets.dimensions.typesEntrypoint(),
      presets.dimensions.componentExports(),
    ],
  });

  const r = new MatrixRunner(projects);
  await r.prepare();
  const buildTime = await r.timeCmd('.', ['yarn', 'build']);
  console.log('buildTime =', buildTime);
  const typecheckTime = await r.timeCmd('.', ['yarn', 'main:typecheck']);
  console.log('typecheckTime =', typecheckTime);
}

main().catch((error) => {
  console.error(error.stack || error);
  process.exit(1);
});
