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

exports.printTimingSummary = printTimingSummary;
exports.splitTimings = splitTimings;
