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

function printTimingSummary(folderTimings) {
  const { dimensions, timings } = splitTimings(folderTimings);
  const slices = sliceDimensions(dimensions, timings);
  const sliceStats = computeSliceStats(slices);

  const fix = (n, p = 0) => n.toFixed(p);

  const printDimensions = (dimensions, prefix) => {
    for (const [key, { stats, diff }] of Object.entries(dimensions)) {
      const statsStr = `avg=${fix(stats.avg)} stdev=${fix(stats.stdev)}`;
      const diffStr = diff ? ` diff=${fix(diff.avg, 3)}` : '';
      console.log(`${prefix}[${key}] ${statsStr}${diffStr}`);
    }
  };

  for (const [dimIndex, slice] of sliceStats.entries()) {
    console.log(`Dimension ${dimIndex}`);
    console.log(`  [${slice.base.name}] base`);
    printDimensions(slice.base.dimensions, '    ');
    for (const part of slice.parts) {
      console.log(`  [${part.name}] avgDiff=${fix(part.total.avg, 3)}`);
      printDimensions(part.dimensions, '    ');
    }
    console.log('');
  }
}

function splitTimings(folderTimings) {
  const timings = [];
  const dimensions = [];

  for (const [key, ms] of Object.entries(folderTimings)) {
    const parts = key.replace(/^[^-]+-/, '').split('-');
    timings.push({ parts, ms });

    for (const [index, part] of parts.entries()) {
      dimensions[index] = dimensions[index] || [];
      if (!dimensions[index].includes(part)) {
        dimensions[index].push(part);
      }
    }
  }

  return { dimensions, timings };
}

function sliceDimensions(dimensions, timings) {
  const dimSlices = [];
  for (const [dimIndex] of dimensions.entries()) {
    const slices = {};
    for (const { parts, ms } of timings) {
      const other = parts.slice();
      const dim = other.splice(dimIndex, 1);
      const key = other.join('-');
      slices[dim] = slices[dim] || {};
      slices[dim][key] = ms;
    }
    dimSlices.push(slices);
  }
  return dimSlices;
}

function sum(ns) {
  return ns.reduce((sum, n) => sum + n, 0);
}

function avg(ns) {
  return sum(ns) / ns.length;
}

function stdev(ns) {
  const nAvg = avg(ns);
  return Math.sqrt(avg(ns.map((ms) => (nAvg - ms) * (nAvg - ms))));
}

function computeStats(timings) {
  return {
    avg: avg(timings),
    stdev: stdev(timings),
  };
}

function diffStats(stats1, stats2) {
  return {
    avg: stats2.avg / stats1.avg,
  };
}

function mapObject(obj, mapFunc) {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = mapFunc(value, key);
  }
  return result;
}

function computeSliceStats(slices) {
  const stats = [];

  for (const slice of slices) {
    const [base, baseValues] = Object.entries(slice)[0];
    const baseDimensions = mapObject(baseValues, (vs) => ({
      stats: computeStats(vs),
    }));
    const sliceDiff = {
      base: { name: base, dimensions: baseDimensions },
      parts: [],
    };
    for (const [name, partTimings] of Object.entries(slice).slice(1)) {
      const part = {
        name,
        dimensions: {},
      };
      for (const [key, timings] of Object.entries(partTimings)) {
        const stats = computeStats(timings);
        part.dimensions[key] = {
          stats,
          diff: diffStats(baseDimensions[key].stats, stats),
        };
      }
      part.total = {
        avg: avg(Object.values(part.dimensions).map(({ diff }) => diff.avg)),
      };
      sliceDiff.parts.push(part);
    }

    stats.push(sliceDiff);
  }

  return stats;
}

main().catch((error) => {
  console.error(error.stack || error);
  process.exit(1);
});
