const { createProjectMatrix, presets } = require('./factory');
const { MatrixRunner } = require('./runner');
const { printTimingSummary } = require('./stats');

async function main() {
  const matrix = createProjectMatrix({
    baseConfig: presets.baseConfig(),
    dimensions: [
      presets.dimensions.muiImportMethod(),
      presets.dimensions.typesEntrypoint(),
      presets.dimensions.componentExports(),
    ],
  });

  await matrix.inflate();

  const r = new MatrixRunner(matrix);
  await r.prepare();

  const buildTimings = await r.timeCmd({ cmd: ['yarn', 'build'] });
  console.log('*** BUILD TIMES ***');
  printTimingSummary(buildTimings);

  const checkTimings = await r.timeCmd({
    cmd: ['yarn', 'main:typecheck'],
    count: 10,
  });
  console.log('*** CHECK TIMES ***');
  printTimingSummary(checkTimings);
}

main().catch((error) => {
  console.error(error.stack || error);
  process.exit(1);
});
