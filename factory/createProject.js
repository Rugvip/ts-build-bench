const fs = require('fs-extra');
const { resolve: resolvePath } = require('path');
const Templater = require('./Templater');

async function applyProjectReferences(type, tr, { packages }) {
  if (!type) {
    return;
  }

  await tr.modJson('tsconfig.json', (config) => {
    config.compilerOptions.composite = true;
    config.compilerOptions.noEmit = false;
    config.compilerOptions.emitDeclarationOnly = true;
  });

  if (type === 'root') {
    await tr.modJson('tsconfig.json', (config) => {
      config.references = packages.map((pkg) => ({
        path: `./packages/${pkg.name}/tsconfig.build.json`,
      }));
    });
  } else if (type === 'main') {
    await tr.modJson('packages/main/tsconfig.build.json', (config) => {
      config.references = packages.map((pkg) => ({
        path: `../${pkg.name}/tsconfig.build.json`,
      }));
    });
  }

  for (const { name } of packages) {
    tr.modJson(`packages/${name}/package.json`, (pkg) => {
      pkg.main = 'dist/src/index.js';
      if (pkg.types && pkg.types.startsWith('dist/')) {
        pkg.types = 'dist/src/index.d.ts';
      }
    });
  }
}

async function switchToSinglePackage(tr, { packages }) {
  for (const { name } of packages) {
    await tr.move(`packages/${name}/src`, `packages/main/src/${name}`);
    await tr.remove(`packages/${name}`);
  }

  tr.modJson('packages/main/package.json', (pkg) => {
    for (const key of Object.keys(pkg.dependencies)) {
      if (key.startsWith('@internal/')) {
        delete pkg.dependencies[key];
      }
    }
  });

  await tr.modText(`packages/main/src/deps.ts`, (text) => {
    return text.replace(/@internal/g, '.');
  });
}

async function applyBuildMode(buildMode, tr, { packages }) {
  if (buildMode.startsWith('rollup-')) {
    await tr.modJson('package.json', (pkg) => {
      pkg.scripts.build = 'lerna run build:rollup';
    });
    await tr.modJson('tsconfig.json', (pkg) => {
      pkg.compilerOptions.module = 'ESNext';
    });
  }

  if (buildMode === 'rollup-typescript') {
    for (const { name } of packages) {
      await tr.setMode(`packages/${name}/rollup.config.js`, 'typescript');
    }
  } else if (buildMode === 'none') {
    for (const { name } of packages) {
      await tr.modJson(`packages/${name}/package.json`, (pkg) => {
        delete pkg.scripts['build:tsc'];
        pkg.main = 'src/index.ts';
      });
    }
  }
}

async function applyBundleMode(bundleMode, bundleSourcemaps, tr, { packages }) {
  await tr.setMode(
    `packages/main/webpack.config.js`,
    bundleSourcemaps ? `${bundleMode}–sourcemap` : bundleMode
  );
}

module.exports = function createProject({
  path: projectPath,
  main,
  types,
  componentExports,
  packages,
  singlePackage = false,
  projectReferences = null,
  buildMode = 'tsc', // tsc | rollup-sucrase | rollup-typescript | none
  bundleMode = 'ts-fork', // ts-fork | ts-transpile | sucrase-transpile | sucrase-fork
  bundleSourcemaps = false,
}) {
  const dir = resolvePath(projectPath);
  packages = packages.map((pkg, index) => ({
    name: `pkg${index + 1}`,
    ...pkg,
  }));

  const inflate = async () => {
    await fs.remove(dir);
    await fs.ensureDir(dir);

    const tr = new Templater({
      dir: resolvePath(__dirname, 'templates'),
      target: dir,
    });

    await tr.hydrate({ name: 'ts-project', path: '.', data: {} });

    for (const package of packages) {
      const { name, libs, components } = package;

      await tr.hydrate({
        name: 'ts-package',
        path: `packages/${name}`,
        data: { name: `@internal/${name}`, main, types },
      });

      for (const [index, lib] of libs.entries()) {
        const n = index + 1;
        await tr.hydrate({
          name: `ts-lib-${lib}`,
          path: `packages/${name}/src/lib/lib-${n}`,
        });

        await tr.addLine(
          `packages/${name}/src/lib/index.ts`,
          `export * as lib${n} from './lib-${n}';`
        );

        // Add to main package
        await tr.addLine(
          `packages/main/src/index.ts`,
          Array(8)
            .fill()
            .map(
              (_, callIndex) =>
                `deps.${name}.lib${n}.export${
                  callIndex + 1
                }bigClass.forLocalStorage('bucket').getItem('key')`
            )
            .join('\n')
        );
      }

      for (const [index, component] of components.entries()) {
        const n = index + 1;
        await tr.hydrate({
          name: `ts-component-${component}`,
          path: `packages/${name}/src/components/component-${n}`,
          data: {
            export:
              componentExports === 'default' ? 'default' : `Component${n}`,
          },
        });

        const exportLine =
          componentExports === 'default'
            ? `export { default as Component${n} } from './component-${n}';`
            : `export * from './component-${n}';`;
        await tr.addLine(
          `packages/${name}/src/components/index.ts`,
          exportLine
        );

        // Add to main package
        await tr.addLine(
          `packages/main/src/index.ts`,
          `deps.${name}.Component${n}({})`
        );
      }

      // Add to main package
      await tr.addLine(
        `packages/main/src/deps.ts`,
        `export * as ${name} from '@internal/${name}';`
      );
      tr.modJson('packages/main/package.json', (pkg) => {
        pkg.dependencies[`@internal/${name}`] = '0.0.0';
      });
    }

    await applyProjectReferences(projectReferences, tr, { packages });
    await applyBuildMode(buildMode, tr, { packages });
    await applyBundleMode(bundleMode, bundleSourcemaps, tr, { packages });

    if (singlePackage) {
      await switchToSinglePackage(tr, { dir, packages });
    }
  };

  return { dir, inflate };
};
