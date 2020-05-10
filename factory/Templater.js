const fs = require('fs-extra');
const handlebars = require('handlebars');
const { resolve: resolvePath, relative: relativePath } = require('path');

module.exports = class Templater {
  constructor({ dir, target }) {
    this.templateDir = dir;
    this.targetDir = target;
  }

  async hydrate({ name, path, data = {} }) {
    const templatePath = resolvePath(this.templateDir, name);
    const targetPath = resolvePath(this.targetDir, path);

    const templates = [];
    await fs.copy(templatePath, targetPath, {
      filter: (file) => {
        if (file.endsWith('.hbs')) {
          templates.push(file);
          return false;
        }
        return true;
      },
    });

    for (const path of templates) {
      const outPath = resolvePath(
        targetPath,
        relativePath(templatePath, path).replace(/\.hbs$/, '')
      );

      const contents = await fs.readFile(path, 'utf8');
      const result = handlebars.compile(contents)(data);
      await fs.writeFile(outPath, result);
    }
  }

  async addLine(path, line) {
    const filePath = resolvePath(this.targetDir, path);
    await fs.appendFile(filePath, `\n${line}\n`, 'utf8');
  }

  async modJson(path, modFunc) {
    const filePath = resolvePath(this.targetDir, path);
    const pkg = await fs.readJson(filePath);
    await modFunc(pkg);
    await fs.writeJson(filePath, pkg, { spaces: 2 });
  }

  async modText(path, modFunc) {
    const filePath = resolvePath(this.targetDir, path);
    const text = await fs.readFile(filePath, 'utf8');
    const newText = await modFunc(text);
    await fs.writeFile(filePath, newText, 'utf8');
  }

  async move(src, dst) {
    await fs.move(
      resolvePath(this.targetDir, src),
      resolvePath(this.targetDir, dst)
    );
  }

  async remove(path) {
    await fs.remove(resolvePath(this.targetDir, path));
  }
};
