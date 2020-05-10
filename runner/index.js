const {
  resolve: resolvePath,
  relative: relativePath,
  basename,
} = require('path');
const childProcess = require('child_process');
const { promisify } = require('util');

const execFile = promisify(childProcess.execFile);

class ProjectRunner {
  constructor(project) {
    this.rootDir = project.dir;
  }

  async runCmd(path, cmd) {
    try {
      const cwd = resolvePath(this.rootDir, path);
      const projectParent = resolvePath(this.rootDir, '..');
      const targetPath = relativePath(projectParent, cwd);
      console.log(`Running '${cmd.join(' ')}' in ${targetPath}/`);
      const { stdout } = await execFile(cmd[0], cmd.slice(1), {
        shell: true,
        cwd,
      });
      return stdout.trim();
    } catch (error) {
      if (error.stderr) {
        process.stderr.write(error.stderr);
      }
      throw new Error(
        `Command exited with code ${error.code}: ${cmd.join(' ')}`
      );
    }
  }

  async timeCmd({ path = '.', cmd, count = 1 }) {
    const timings = [];
    for (let i = 0; i < count; i++) {
      const start = Date.now();
      await this.runCmd(path, cmd);
      timings.push(Date.now() - start);
    }
    return timings;
  }

  async prepare() {
    await this.runCmd('.', ['yarn', 'install']);
  }
}

class MatrixRunner {
  constructor({ projects }) {
    this.runners = projects.map((project) => new ProjectRunner(project));
    this.dirs = projects.map((project) => basename(project.dir));
  }

  async prepare() {
    await Promise.all(this.runners.map((r) => r.prepare()));
  }

  async runCmd(path, cmd) {
    await Promise.all(this.runners.map((r) => r.runCmd(path, cmd)));
  }

  async timeCmd({ path, cmd, count }) {
    const times = {};

    for (const [index, r] of this.runners.entries()) {
      const dir = this.dirs[index];
      const timings = await r.timeCmd({ path, cmd, count });
      console.log(
        `Time [${dir}/${path}] ${cmd.join(' ')} = ${timingsSummary(timings)}`
      );
      times[dir] = timings;
    }

    return times;
  }
}

function timingsSummary(timings) {
  const sum = (ns) => ns.reduce((sum, n) => sum + n, 0);

  const avg = sum(timings) / timings.length;
  const stdev = Math.sqrt(
    sum(timings.map((ms) => (avg - ms) * (avg - ms))) / timings.length
  );
  return `avg=${avg.toFixed(0)}ms stdev=${stdev.toFixed(0)}`;
}

async function processRunner({ matrix, prepare, benchmark }) {
  try {
    const runPrepare = process.argv.includes('prepare');
    const runBenchmark = process.argv.includes('benchmark');
    const count = process.argv.find((arg) => arg.match(/^[0-9]+$/)) || 1;

    const r = new MatrixRunner(matrix);

    if (runPrepare) {
      await prepare(r);
    } else if (runBenchmark) {
      await benchmark(r, count);
    } else {
      await prepare(r);
      await benchmark(r, count);
    }
  } catch (error) {
    console.error(error.stack || error);
    process.exit(1);
  }
}

exports.ProjectRunner = ProjectRunner;
exports.MatrixRunner = MatrixRunner;
exports.processRunner = processRunner;
