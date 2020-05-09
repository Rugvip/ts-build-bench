const { resolve: resolvePath, relative: relativePath } = require('path');
const childProcess = require('child_process');
const { promisify } = require('util');

const execFile = promisify(childProcess.execFile);

exports.ProjectRunner = class ProjectRunner {
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
};
