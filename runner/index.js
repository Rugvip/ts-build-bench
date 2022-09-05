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
    this.project = project;
  }

  async runCmd(path, cmd, { expectFail = false } = {}) {
    try {
      const cwd = resolvePath(this.project.dir, path);
      const projectParent = resolvePath(this.project.dir, '..');
      const targetPath = relativePath(projectParent, cwd);
      console.log(`[${targetPath}] '${cmd.join(' ')}'`);
      const { stdout } = await execFile(cmd[0], cmd.slice(1), {
        shell: true,
        cwd,
      });
      return stdout.trim();
    } catch (error) {
      if (expectFail) {
        return;
      }
      if (error.stdout) {
        process.stderr.write(error.stdout);
      }
      if (error.stderr) {
        process.stderr.write(error.stderr);
      }
      throw new Error(
        `Command exited with code ${error.code}: ${cmd.join(' ')}`
      );
    }
  }

  async timeCmd({ dir, cmd, count = 1 }) {
    const timings = [];
    for (let i = 0; i < count; i++) {
      const start = Date.now();
      await this.runCmd('.', cmd);
      const time = Date.now() - start;
      console.log(`[${dir}] ${time}ms`);
      timings.push(time);
    }
    return timings;
  }

  async inflate() {
    await this.project.inflate();
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

  async inflate() {
    await Promise.all(this.runners.map((r) => r.inflate()));
  }

  async prepare() {
    await Promise.all(this.runners.map((r) => r.prepare()));
  }

  async runCmd(path, cmd) {
    await Promise.all(this.runners.map((r) => r.runCmd(path, cmd)));
  }

  async time(count, func, cleanup) {
    const times = {};

    for (let i = 0; i < count; i++) {
      for (const [index, r] of this.runners.entries()) {
        const dir = this.dirs[index];

        const start = Date.now();
        await func(r);
        const time = Date.now() - start;
        console.log(`[${dir}] ${time}ms`);

        if (cleanup) {
          const isLastRun = i === count - 1;
          await cleanup(r, isLastRun);
        }

        times[dir] = times[dir] || [];
        times[dir].push(time);
      }
    }

    return times;
  }

  async timeCmd({ cmd, count }) {
    const times = {};

    for (const [index, r] of this.runners.entries()) {
      const dir = this.dirs[index];
      times[dir] = await r.timeCmd({dir, cmd, count});
    }

    return times;
  }
}

async function processRunner({ matrix, prepare, benchmark }) {
  try {
    const runInflate = process.argv.includes('inflate');
    const runPrepare = process.argv.includes('prepare');
    const runBenchmark = process.argv.includes('benchmark');
    const count = process.argv.find((arg) => arg.match(/^[0-9]+$/)) || 1;

    const r = new MatrixRunner(matrix);

    if (runInflate) {
      await r.inflate();
    } else if (runPrepare) {
      await r.prepare();
      await prepare(r);
    } else if (runBenchmark) {
      await benchmark(r, count);
    } else {
      await r.inflate();
      await r.prepare();
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
