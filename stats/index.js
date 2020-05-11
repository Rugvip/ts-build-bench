function printTimingSummary(folderTimings) {
  const { dimensions, timings } = splitTimings(folderTimings);

  printStats({ dimensions, timings });
  console.log();

  const slices = sliceDimensions(dimensions, timings);
  const sliceStats = computeSliceStats(slices);

  const printDimensions = (dimensions, prefix) => {
    const size = Math.max(...Object.keys(dimensions).map((key) => key.length));

    for (const [key, { diff }] of Object.entries(dimensions)) {
      console.log(
        `${prefix}${key.padEnd(size)} ${
          diff.avg < 0.9 ? '<' : diff.avg > 1.1 ? '>' : '~'
        } ${fix(diff.avg, 3)}`
      );
    }
  };

  for (const [dimIndex, slice] of sliceStats.entries()) {
    console.log(`Dimension ${dimIndex} diff vs ${slice.base.name}`);
    for (const part of slice.parts) {
      console.log(`  ${part.name} avg=${fix(part.total.avg, 3)}`);
      printDimensions(part.dimensions, '    ');
    }
    console.log('');
  }
}

function printStats({ dimensions, timings }) {
  const lastSize = Math.max(
    ...dimensions.slice(-1)[0].map((part) => part.length)
  );

  function printDim(prefix, [dim, ...rest], timings) {
    if (!dim) {
      const stats = computeStats(timings[0].ms);
      console.log(`${prefix}> avg=${fix(stats.avg)} stdev=${fix(stats.stdev)}`);
      return;
    }
    for (const part of dim) {
      const childTimings = timings
        .filter(({ parts }) => parts[0] === part)
        .map(({ parts, ms }) => ({
          parts: parts.slice(1),
          ms,
        }));
      if (rest.length === 0) {
        const stats = computeStats(childTimings[0].ms);
        console.log(
          `${prefix}${part.padEnd(lastSize)} | avg=${fix(
            stats.avg
          )} stdev=${fix(stats.stdev)}`
        );
      } else {
        console.log(`${prefix}${part}`);
        printDim(`${prefix}  `, rest, childTimings);
      }
    }
  }

  printDim('', dimensions, timings);
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

function fix(n, p = 0) {
  return n.toFixed(p);
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
