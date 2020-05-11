# ts-build-bench

Benchmarking different build setups for TypeScript web projects

## Project Layout

- factory/ - Tools for creating projects of various size and configurations.
- runner/ - Tools for running and benchmarking tasks inside said projects.
- stats/ - Utils for presenting statistics from benchmark runs.
- workdir/ - Directory where all benchmark projects are kept.

## Usage

No real pattern here yet. Modify benchmark.js and run it:

```bash
node benchmark.js
```

If you give a number to benchmark.js, it will forward it as `count` to the benchmark function.

Passing any of `inflate`, `prepare`, or `benchmark` will only run that part of the benchmark.

To remove all projects in `workdir/`, run `./clean`.
