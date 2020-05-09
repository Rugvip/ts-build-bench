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

  async runCmd(target, cmd) {
    try {
      const cwd = resolvePath(this.rootDir, target);
      const projectParent = resolvePath(this.rootDir, '..');
      const path = relativePath(projectParent, cwd);
      console.log(`Running '${cmd.join(' ')}' in ${path}/`);
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

  async timeCmd(target, cwd) {
    const start = Date.now();
    await this.runCmd(target, cwd);
    return Date.now() - start;
  }

  async prepare() {
    await this.runCmd('.', ['yarn', 'install']);
  }
}

exports.ProjectRunner = ProjectRunner;

exports.MatrixRunner = class MatrixRunner {
  constructor(projects) {
    this.runners = projects.map((project) => new ProjectRunner(project));
    this.dirs = projects.map((project) => basename(project.dir));
  }

  async prepare() {
    await Promise.all(this.runners.map((r) => r.prepare()));
  }

  async runCmd(target, cmd) {
    await Promise.all(this.runners.map((r) => r.runCmd(target, cmd)));
  }

  async timeCmd(target, cmd) {
    const times = {};

    for (const [index, r] of this.runners.entries()) {
      const dir = this.dirs[index];
      const time = await r.timeCmd(target, cmd);
      console.log(`Ran ${target} -> '${cmd.join(' ')}' in ${dir} in ${time}ms`);
      times[dir] = time;
    }

    return times;
  }
};
