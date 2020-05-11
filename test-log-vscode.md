# VSCode Test Log

## Test 1

Config:

```js
createProjectMatrix({
  baseConfig: presets.baseConfig({
    packages: Array(20).fill(presets.packages.balanced(20)),
  }),
  dimensions: [
    presets.dimensions.typesEntrypoint(),
    presets.dimensions.projectReferences(),
  ],
}),
```

### Update speed

Removal of type from package, in the location that the type is read from (dist/src).
Time measured is time to red squiggly in main pkg.

bench-typesDist-noRefs = -
bench-typesDist-rootRefs = -
bench-typesSrc-noRefs = -
bench-typesSrc-rootRefs = -

No noticable differences, all < 1s

### Restart Server

Cause error in a dependency to show red squiggly in main package. Restart TS server and measure time until red squiggly reappears.

bench-typesDist-noRefs = 6.75s 6.41s
bench-typesDist-rootRefs = 7.66s 6.41s
bench-typesSrc-noRefs = 9.56s 7.21
bench-typesSrc-rootRefs = 9.44s 7.48

Pointing to src may be a little bit slower, using type references doesn't seem to have an impact at all.

### Benchmark results:

Build, n = 1

```text
Dimension 0
  [typesDist] base
    [rootRefs] avg=98521 stdev=0
    [noRefs] avg=80643 stdev=0
  [typesSrc] avgDiff=1.237
    [rootRefs] avg=109852 stdev=0 diff=1.115
    [noRefs] avg=109542 stdev=0 diff=1.358

Dimension 1
  [rootRefs] base
    [typesDist] avg=98521 stdev=0
    [typesSrc] avg=109852 stdev=0
  [noRefs] avgDiff=0.908
    [typesDist] avg=80643 stdev=0 diff=0.819
    [typesSrc] avg=109542 stdev=0 diff=0.997
```

Lint, n = 10

```text
Dimension 0
  [typesDist] base
    [rootRefs] avg=3208 stdev=234
    [noRefs] avg=2925 stdev=30
  [typesSrc] avgDiff=3.248
    [rootRefs] avg=4173 stdev=280 diff=1.301
    [noRefs] avg=15194 stdev=731 diff=5.194

Dimension 1
  [rootRefs] base
    [typesDist] avg=3208 stdev=234
    [typesSrc] avg=4173 stdev=280
  [noRefs] avgDiff=2.276
    [typesDist] avg=2925 stdev=30 diff=0.912
    [typesSrc] avg=15194 stdev=731 diff=3.641
```

### Conclusion

Neither project references nor consuming types from .d.ts files seems to have any significant speedup in a large VSCode monorepo project.

Linting seems significantly slower. Measurements in different project sizes have shown ~2x speedup for pointing to .d.ts files in dist, and ~2.5x speedup for using project references.

## Test 2

Trying a much larger project, just in VSCode

```js
createProjectMatrix({
  baseConfig: presets.baseConfig({
    packages: Array(100).fill(presets.packages.balanced(20)),
    types: 'src/index.ts',
  }),
  dimensions: [
    {
      monoRepoSrc: {
        singlePackage: false,
      },
      monoRepoDist: {
        types: 'dist/index.d.ts',
        singlePackage: false,
      },
      onePackage: {
        singlePackage: true,
      },
    },
  ],
});
```

### Results

#### Update speed

The same update speed test was used again, this time it was much slower than <1s, up to 2.5-3s.
There was no obvious difference between the 3 configs. If anything the dist version might be a couple of 100 ms quicker.

#### Restart Server

The server restart was also run with the following results:

onePackage: ~27s
monoRepoSrc: ~27s
monoRepoDist: ~22s

### Conclusion

Monorepo setups do not seem to provide many opportunities to speed up editing of TypeScript code. The slightly faster
updates when pointing `types` to declaration files will easily be offset by the time to regenerate those files.

Since consuming declaration files is slightly faster, it seems the best method for improving performance would be to split the project into individually built packages that are loaded in through dependencies.
