const { createProject } = require('./factory');
const { ProjectRunner } = require('./runner');

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
};

async function main() {
  const project = await createProject({
    path: 'workdir/bench-1',
    main: 'dist/index.js',
    types: 'dist/index.d.ts',
    componentExports: 'default', // or named
    packages: Array(5).fill(presets.packages.balanced(5)),
  });

  const r = new ProjectRunner(project);
  await r.prepare();
  const buildTime = await r.timeCmd('.', ['yarn', 'build']);
  console.log('DEBUG: buildTime =', buildTime);
}

main().catch((error) => {
  console.error(error.stack || error);
  process.exit(1);
});
