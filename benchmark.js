const { createProject } = require('./factory');
const { ProjectRunner } = require('./runner');

const presets = {
  components: {
    balanced: (n) => [...Array(n).fill('small'), ...Array(n).fill('medium')],
    normalImports: (n) => Array(n).fill('medium'),
    specificImports: (n) => Array(n).fill('specific-imports'),
  },
  libs: {
    balanced: (n) => Array(n).fill('medium'),
  },
};

async function main() {
  const project = await createProject({
    path: 'workdir/bench-1',
    packages: [
      {
        name: 'a',
        main: 'dist/index.js',
        types: 'dist/index.d.ts',
        libs: presets.libs.balanced(3),
        components: presets.components.balanced(3),
        componentExports: 'default', // or named
      },
    ],
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
