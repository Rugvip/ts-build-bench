const { createProjectMatrix, presets } = require('./factory');
const { processRunner } = require('./runner');
const { printTimingSummary } = require('./stats');

processRunner({
  matrix: createProjectMatrix({
    baseConfig: presets.baseConfig(),
    dimensions: [
      presets.dimensions.muiImportMethod(),
      presets.dimensions.typesEntrypoint(),
      presets.dimensions.componentExports(),
    ],
  }),
  prepare: async (runner) => {
    await runner.prepare();

    const buildTimings = await runner.timeCmd({ cmd: ['yarn', 'build:tsc'] });
    console.log('*** BUILD TIMES ***');
    printTimingSummary(buildTimings);
  },
  benchmark: async (runner, count) => {
    const checkTimings = await runner.timeCmd({
      cmd: ['yarn', 'main:lint'],
      count,
    });
    console.log('*** CHECK TIMES ***');
    printTimingSummary(checkTimings);
  },
});
