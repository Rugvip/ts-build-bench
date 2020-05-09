const { createProject } = require('./factory');

async function main() {
  const project = await createProject({
    path: 'workdir/bench-1',
    packages: [
      {
        name: 'a',
        main: 'dist/index.js',
        types: 'dist/index.d.ts',
        libs: ['medium'],
        components: ['small', 'specific-imports', 'medium'],
        componentExports: 'default', // or named
      },
    ],
  });
  console.log('DEBUG: project =', project);
}

main().catch((error) => {
  console.error(error.stack || error);
  process.exit(1);
});
