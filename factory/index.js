const fs = require('fs-extra');
const handlebars = require('handlebars');
const { resolve: resolvePath, relative: relativePath } = require('path');

class Templater {
  constructor({ dir, target }) {
    this.templateDir = dir;
    this.targetDir = target;
  }

  async hydrate({ name, path, data }) {
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
      console.log('DEBUG: outPath =', outPath);

      const contents = await fs.readFile(path, 'utf8');
      const result = handlebars.compile(contents)(data);
      await fs.writeFile(outPath, result);
    }
  }
}

async function createProject(config) {
  await fs.remove(config.target);
  await fs.ensureDir(config.target);

  const tr = new Templater({
    dir: resolvePath(__dirname, 'templates'),
    target: config.target,
  });

  await tr.hydrate({ name: 'ts-project', path: '.', data: {} });

  for (const package of config.packages) {
    const { name, main, types, libs, components } = package;
    await tr.hydrate({
      name: 'ts-package',
      path: `packages/${name}`,
      data: { name, main, types },
    });
  }
}

createProject({
  target: resolvePath(__dirname, '..', 'test'),
  packages: [
    {
      name: 'a',
      main: 'dist/index.js',
      types: 'dist/index.d.ts',
      libs: ['medium'],
      components: ['small', 'specific-imports', 'medium'],
    },
  ],
}).then(() => {
  console.log('done!');
});
