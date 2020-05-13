# ts-build-bench

Benchmarking different build setups for TypeScript web projects

## Conclusions (TL;RD of test logs)

The tests where carried out with a large https://github.com/spotify/backstage project in mind. That is, a monorepo with a large number of stand-alone packages that are depended on by a single package.

Versions used for these tests were recent versions of Webpack 4, Typescript 3.9, Rollup 2, and Babel 7.

### VSCode Performance

There's not much to do to improve performance here. Using a single package is roughly the same speed as using a monorepo. Pre-building packages in a monorepo and pointing `package.json` `types` to `dist/index.d.ts` can give you a performance boost of maybe 20-30%, but it's likely not worth the tradeoff of having to keep those up to date.

Just point `types` to `src/` for development and if the project grows too big for VSCode, find other ways to split it.

### Building & Bundling

Separate builds of each package is not worth the tradeoff of build complexity, as long as you're using one of the new ES20XX transpilers such as sucrase or esbuild. They are fast enough that the entire project can be compiled at once or served in watch mode. For building individual packages for publishing there's also a significant speedup, even though it might not make as much of a difference there.

Out of esbuild and sucrase, esbuild is the faster one at the moment. It also produces code that is quicker to process by webpack, making it a better candidate for publish builds. It may however be worth using sucrase with webpack though, as it has react-hot-reload support, and the difference between them is pretty small.

It's also not worth generating type declarations as part of the build, or even type checking. It's faster to just let the build handle transpilation and bundling into js, and run tsc separately for type-checking and declaration file generation.

Here are some rough numbers for a webpack build of a large project (100 packages, each with ~20 components/lib modules):

```text
ts-loader:        70s
sucrase-loader:   24s
esbuild-loader:   21s
babel-loader:     86s
```

And for building a single one of those packages with different rollup plugins or tsc:

```text
tsc:                         11s
rollup-plugin-typescript2:   22s
@rollup/plugin-sucrase:      2.5s
rollup-plugin-esbuild:       1.7s
```

### Type Checking

When linting each package separately, using TypeScript project references provide a significant speedup for large projects. The inital build in a clean state is slightly faster than without project references, maybe 5-10%, as long as lerna is used, and not `tsc --build`. For incremental checks and watch mode project references become a must. Incremental checks can end up taking minutes otherwise, and there's really no global watch mode with lerna.

The above applies to if you want each package to have separate configuration though. The quickest way to do type checking, by an order of magnitude, is to have a single config file that points to all source code. This will however ignore any local tsconfig in the packages, and also require post-processing to move declarations files into `dist` folders before publishing. There doesn't seem to be an option to combine the speed of this approach with the change detection and convenience of project references.

In the end the single top-level config is likely the way to go, as a large project with project references can be prohibitively slow, taking many minutes to lint on the initial run, and tens of seconds to act on changes in watch mode.

Some rough numbers for type-checking a project relatively large project (100 packages, each with ~20 components/lib moduels):

```text
separate tsc of each package:                            231s
separate tsc of each package, with project references:   225s
tsc --build mode referencing all packages:               375s
single top-level tsc pointing to all packages:           33s
single top-level tsc incremental build:                  40s
```

## Project Layout

- factory/ - Tools for creating projects of various size and configurations.
- runner/ - Tools for running and benchmarking tasks inside said projects.
- stats/ - Utils for presenting statistics from benchmark runs.
- workdir/ - Directory where all benchmark projects are kept.

## Usage

No real pattern here yet. Modify benchmarks and run them:

```bash
./benchmark-<x>
```

If you give a number to benchmark, it will forward it as `count` to the benchmark function.

Passing any of `inflate`, `prepare`, or `benchmark` will only run that part of the benchmark.

For example, running the benchmark park of the build benchmark with 5 iterations:

```bash
./benchmark-build benchmark 5
```

To remove all projects in `workdir/`, run `./clean`.

## Test logs

These are some written logs of different benchmarks run in this repo:

- VSCode Performance: [test-log-vscode.md](./test-log-vscode.md)
- Building and Bundling: [test-log-bundle.md](./test-log-bundle.md)
- Type Checking with tsc: [test-log-typecheck.md](./test-log-typecheck.md)
