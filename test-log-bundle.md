# Webpack Bundling Test Log

## Initial Test Setup

Config:

```js
createProjectMatrix({
  baseConfig: presets.baseConfig({
    packages: Array(8).fill(presets.packages.balanced(9)),
  }),
  dimensions: [
    {
      buildTsc: {
        buildMode: 'tsc',
      },
      buildRollupTs: {
        buildMode: 'rollup-typescript',
      },
      buildRollupSucrase: {
        buildMode: 'rollup-sucrase',
      },
      buildNone: {
        buildMode: 'none',
      },
    },
    {
      bundleTsFork: {
        bundleMode: 'ts-fork',
      },
      bundleSucrase: {
        bundleMode: 'sucrase',
      },
    },
  ],
});
```

## Test 1

This run was done before fixing the include patterns of the Webpack loaders to only process ts files.

Build, n = 1

```text
Dimension 0
  [buildTsc] base
    [bundleTsFork] avg=26426 stdev=0
    [bundleSucrase] avg=28210 stdev=0
  [buildRollupTs] avgDiff=2.001
    [bundleTsFork] avg=52323 stdev=0 diff=1.980
    [bundleSucrase] avg=57040 stdev=0 diff=2.022
  [buildRollupSucrase] avgDiff=0.142
    [bundleTsFork] avg=3873 stdev=0 diff=0.147
    [bundleSucrase] avg=3896 stdev=0 diff=0.138
  [buildNone] avgDiff=0.049
    [bundleTsFork] avg=1412 stdev=0 diff=0.053
    [bundleSucrase] avg=1234 stdev=0 diff=0.044

Dimension 1
  [bundleTsFork] base
    [buildTsc] avg=26426 stdev=0
    [buildRollupTs] avg=52323 stdev=0
    [buildRollupSucrase] avg=3873 stdev=0
    [buildNone] avg=1412 stdev=0
  [bundleSucrase] avgDiff=1.009
    [buildTsc] avg=28210 stdev=0 diff=1.068
    [buildRollupTs] avg=57040 stdev=0 diff=1.090
    [buildRollupSucrase] avg=3896 stdev=0 diff=1.006
    [buildNone] avg=1234 stdev=0 diff=0.874
```

Bundle, n = 5

```text
Dimension 0
  [buildTsc] base
    [bundleTsFork] avg=13281 stdev=751
    [bundleSucrase] avg=4259 stdev=84
  [buildRollupTs] avgDiff=0.986
    [bundleTsFork] avg=14006 stdev=476 diff=1.055
    [bundleSucrase] avg=3906 stdev=137 diff=0.917
  [buildRollupSucrase] avgDiff=0.987
    [bundleTsFork] avg=13779 stdev=220 diff=1.037
    [bundleSucrase] avg=3989 stdev=155 diff=0.936
  [buildNone] avgDiff=1.004
    [bundleTsFork] avg=13149 stdev=229 diff=0.990
    [bundleSucrase] avg=4333 stdev=129 diff=1.017

Dimension 1
  [bundleTsFork] base
    [buildTsc] avg=13281 stdev=751
    [buildRollupTs] avg=14006 stdev=476
    [buildRollupSucrase] avg=13779 stdev=220
    [buildNone] avg=13149 stdev=229
  [bundleSucrase] avgDiff=0.305
    [buildTsc] avg=4259 stdev=84 diff=0.321
    [buildRollupTs] avg=3906 stdev=137 diff=0.279
    [buildRollupSucrase] avg=3989 stdev=155 diff=0.289
    [buildNone] avg=4333 stdev=129 diff=0.330
```

### Takeaways

- Sucrase many times faster than ts-fork, even for small projects. But ofc doesn't do any type checking.
- There's no difference in bundle time across different build methods when all files are processed by the loader.

## Test 2

This run updated the webpack bundlers to only process TypeScript files, so any method that builds packages ahead of time into JS might get more of a speedup now. It also adds ts-transpile as a bundle strategy, which simply removes the ts fork plugin, giving a more for comparison to sucrase.

The project size was reduced a bit for this run:

```js
Array(5).fill(presets.packages.balanced(6)),
```

Build, n = 1

```text
Dimension 0
  [buildTsc] base
    [bundleTsFork] avg=37782 stdev=0
    [bundleTsTranspile] avg=41966 stdev=0
    [bundleSucrase] avg=33386 stdev=0
  [buildRollupTs] avgDiff=1.099
    [bundleTsFork] avg=39584 stdev=0 diff=1.048
    [bundleTsTranspile] avg=44887 stdev=0 diff=1.070
    [bundleSucrase] avg=39372 stdev=0 diff=1.179
  [buildRollupSucrase] avgDiff=0.096
    [bundleTsFork] avg=3669 stdev=0 diff=0.097
    [bundleTsTranspile] avg=3578 stdev=0 diff=0.085
    [bundleSucrase] avg=3556 stdev=0 diff=0.107
  [buildNone] avgDiff=0.033
    [bundleTsFork] avg=1255 stdev=0 diff=0.033
    [bundleTsTranspile] avg=1253 stdev=0 diff=0.030
    [bundleSucrase] avg=1188 stdev=0 diff=0.036

Dimension 1
  [bundleTsFork] base
    [buildTsc] avg=37782 stdev=0
    [buildRollupTs] avg=39584 stdev=0
    [buildRollupSucrase] avg=3669 stdev=0
    [buildNone] avg=1255 stdev=0
  [bundleTsTranspile] avgDiff=1.055
    [buildTsc] avg=41966 stdev=0 diff=1.111
    [buildRollupTs] avg=44887 stdev=0 diff=1.134
    [buildRollupSucrase] avg=3578 stdev=0 diff=0.975
    [buildNone] avg=1253 stdev=0 diff=0.998
  [bundleSucrase] avgDiff=0.949
    [buildTsc] avg=33386 stdev=0 diff=0.884
    [buildRollupTs] avg=39372 stdev=0 diff=0.995
    [buildRollupSucrase] avg=3556 stdev=0 diff=0.969
    [buildNone] avg=1188 stdev=0 diff=0.947
```

Bundle, n = 5

```text
Dimension 0
  [buildTsc] base
    [bundleTsFork] avg=15369 stdev=618
    [bundleTsTranspile] avg=4552 stdev=112
    [bundleSucrase] avg=5021 stdev=437
  [buildRollupTs] avgDiff=1.041
    [bundleTsFork] avg=17794 stdev=1236 diff=1.158
    [bundleTsTranspile] avg=4912 stdev=81 diff=1.079
    [bundleSucrase] avg=4454 stdev=82 diff=0.887
  [buildRollupSucrase] avgDiff=1.048
    [bundleTsFork] avg=17264 stdev=556 diff=1.123
    [bundleTsTranspile] avg=5155 stdev=264 diff=1.133
    [bundleSucrase] avg=4460 stdev=159 diff=0.888
  [buildNone] avgDiff=1.193
    [bundleTsFork] avg=18165 stdev=947 diff=1.182
    [bundleTsTranspile] avg=6503 stdev=250 diff=1.429
    [bundleSucrase] avg=4861 stdev=129 diff=0.968

Dimension 1
  [bundleTsFork] base
    [buildTsc] avg=15369 stdev=618
    [buildRollupTs] avg=17794 stdev=1236
    [buildRollupSucrase] avg=17264 stdev=556
    [buildNone] avg=18165 stdev=947
  [bundleTsTranspile] avgDiff=0.307
    [buildTsc] avg=4552 stdev=112 diff=0.296
    [buildRollupTs] avg=4912 stdev=81 diff=0.276
    [buildRollupSucrase] avg=5155 stdev=264 diff=0.299
    [buildNone] avg=6503 stdev=250 diff=0.358
  [bundleSucrase] avgDiff=0.276
    [buildTsc] avg=5021 stdev=437 diff=0.327
    [buildRollupTs] avg=4454 stdev=82 diff=0.250
    [buildRollupSucrase] avg=4460 stdev=159 diff=0.258
    [buildNone] avg=4861 stdev=129 diff=0.268
```

### Takeaways

- Sucrase is faster than transpileOnly ts-loader, but the difference is much smaller, at least in a small project.
- With typechecking the build method doesn't matter much, but pre-building packages is somewhat faster when using transpileOnly. No big difference for sucrase though.

## Test 3

Another run of the same, small project. Removing tsc and rollupTs build methods, as those are pretty much the same as rollupSucrase but much slower to test.

Bundle, n = 10

```text
Dimension 0
  [buildRollupSucrase] base
    [bundleTsTranspile] avg=4197 stdev=132
    [bundleTsFork] avg=19128 stdev=1215
    [bundleSucrase] avg=5231 stdev=666
  [buildNone] avgDiff=1.869
    [bundleTsTranspile] avg=14086 stdev=866 diff=3.356
    [bundleTsFork] avg=20723 stdev=1683 diff=1.083
    [bundleSucrase] avg=6103 stdev=457 diff=1.167

Dimension 1
  [bundleTsTranspile] base
    [buildRollupSucrase] avg=4197 stdev=132
    [buildNone] avg=14086 stdev=866
  [bundleTsFork] avgDiff=3.014
    [buildRollupSucrase] avg=19128 stdev=1215 diff=4.557
    [buildNone] avg=20723 stdev=1683 diff=1.471
  [bundleSucrase] avgDiff=0.840
    [buildRollupSucrase] avg=5231 stdev=666 diff=1.246
    [buildNone] avg=6103 stdev=457 diff=0.433
```

### Takeaways

- Time to test in a bigger project

## Test 4

Same us 3, but much larger project. With sourcemaps disabled.

```js
Array(50).fill(presets.packages.balanced(20));
```

RollupSucrase build times where: 34449, 31637, 41854

Bundle, n = 10

```text
Dimension 0
  [buildRollupSucrase] base
    [bundleTsTranspile] avg=10001 stdev=2442
    [bundleTsFork] avg=30589 stdev=1844
    [bundleSucrase] avg=6265 stdev=134
  [buildNone] avgDiff=2.211
    [bundleTsTranspile] avg=32862 stdev=1623 diff=3.286
    [bundleTsFork] avg=40771 stdev=2483 diff=1.333
    [bundleSucrase] avg=12617 stdev=533 diff=2.014

Dimension 1
  [bundleTsTranspile] base
    [buildRollupSucrase] avg=10001 stdev=2442
    [buildNone] avg=32862 stdev=1623
  [bundleTsFork] avgDiff=2.150
    [buildRollupSucrase] avg=30589 stdev=1844 diff=3.059
    [buildNone] avg=40771 stdev=2483 diff=1.241
  [bundleSucrase] avgDiff=0.505
    [buildRollupSucrase] avg=6265 stdev=134 diff=0.626
    [buildNone] avg=12617 stdev=533 diff=0.384
```

### Takeaways

- Pre-built deps is ~3x faster for transpileOnly, and ~2x faster for sucrase, but only about 25% faster for typechecked builds.
- For non-prebuilt projects, sucrase is ~3x faster than transpileOnly, but transpile with typechecks is only about 25% slower than transpileOnly.
- For local development, given the above:
  - If type checking is desired as a part of the bundler, just use ts-loader with the fork plugin.
  - If type checking isn't needed, you can get a significant speedup, ~3x, by using sucrase.
- For production deployments, given the above, and that we don't want to use sucrase for the production build (?), and we have the option if building all dependencies first if needed.
  - If we do type checking during bundling, then it doesn't seem to make sense to build packages separately first, as we only get about 25% speedup doing that.
  - If we don't type check during bundling, we might want to build packages separately first and cache them, as that gives a ~3x speed increase.
  - Needs a separate comparison between using the fork plugin and completely separate tsc run.

### Open questions

- Can we use sucrase with the ts-fork plugin? So we can get both the sucrase speedup but also async type feedback.
- Should we do type checks as a part of the bundling, or leave that as a separate step?
- Does adding source maps affect the results?

## Test 5

Trying out sucrase + ts-fork plugin, in a smaller project

```js
Array(10).fill(presets.packages.balanced(9));
```

Bundle, n = 5

```text
Dimension 1
  [bundleTsTranspile] base
    [buildRollupSucrase] avg=4352 stdev=206
    [buildNone] avg=8614 stdev=406
  [bundleTsFork] avgDiff=2.751
    [buildRollupSucrase] avg=15246 stdev=569 diff=3.503
    [buildNone] avg=17222 stdev=1223 diff=1.999
  [bundleSucrase] avgDiff=0.778
    [buildRollupSucrase] avg=4255 stdev=114 diff=0.978
    [buildNone] avg=4983 stdev=138 diff=0.579
  [bundleSucraseFork] avgDiff=2.732
    [buildRollupSucrase] avg=15813 stdev=874 diff=3.634
    [buildNone] avg=15765 stdev=1108 diff=1.830
```

### Takeaways

- Using sucrase + ts-fork checker plugin seems to work just fine, but will also need to try it out in a dev server. Using sucrase will give us the benefit of very quick updates and bootup times, and with the ts-fork plugin we still get type checking in the terminal.

## Test 6

Trying out impact of enabling sourcemaps, with a slightly smaller project than last time

```js
Array(5).fill(presets.packages.balanced(9));
```

Bundle, n = 3

```text
Dimension 2
  [withMap] base
    [buildRollupSucrase-bundleTsTranspile] avg=4284 stdev=170
    [buildRollupSucrase-bundleTsFork] avg=15969 stdev=482
    [buildRollupSucrase-bundleSucrase] avg=4148 stdev=42
    [buildRollupSucrase-bundleSucraseFork] avg=15626 stdev=884
    [buildNone-bundleTsTranspile] avg=6943 stdev=96
    [buildNone-bundleTsFork] avg=16789 stdev=403
    [buildNone-bundleSucrase] avg=5391 stdev=299
    [buildNone-bundleSucraseFork] avg=15592 stdev=581
  [noMap] avgDiff=0.980
    [buildRollupSucrase-bundleTsTranspile] avg=4033 stdev=57 diff=0.941
    [buildRollupSucrase-bundleTsFork] avg=15942 stdev=523 diff=0.998
    [buildRollupSucrase-bundleSucrase] avg=3881 stdev=80 diff=0.936
    [buildRollupSucrase-bundleSucraseFork] avg=16434 stdev=677 diff=1.052
    [buildNone-bundleTsTranspile] avg=7479 stdev=288 diff=1.077
    [buildNone-bundleTsFork] avg=16865 stdev=1645 diff=1.004
    [buildNone-bundleSucrase] avg=4672 stdev=147 diff=0.867
    [buildNone-bundleSucraseFork] avg=14998 stdev=1138 diff=0.962
```

### Takeaways

- Sourcemaps cheap-module-eval-source-map don't seem to slow down the build at all, will keep them on by default for now. Who doesn't want sourcemaps.

## Failed attempts

Some things tried and failed:

- use esbuild-loader for webpack
  - Couldn't get this to work because of export syntax issues
- using `type: 'javascript/esm'` in webpack loader.
  - This makes the build real fast, because it throws away all dependencies

## Test 7

Trying out esbuild plugin as an alternative to sucrase.

A bit different project setup, much larger and fewer dimensions:

```js
createProjectMatrix({
  baseConfig: presets.baseConfig({
    packages: Array(50).fill(presets.packages.balanced(20)),
    bundleMode: 'sucrase-transpile',
  }),
  dimensions: [
    {
      buildRollupEsbuild: {
        buildMode: 'rollup-esbuild',
      },
      buildRollupSucrase: {
        buildMode: 'rollup-sucrase',
      },
    },
  ],
});
```

The main thing we're looking at is the difference in build time. Also got new fancy stats output now:

Build, n = 1

```text
buildRollupEsbuild | avg=17390 stdev=0
buildRollupSucrase | avg=23741 stdev=0

Dimension 0 diff vs buildRollupEsbuild
  buildRollupSucrase avg=1.365
     > 1.365
```

Bundle, n = 10

```text
buildRollupEsbuild | avg=5562 stdev=173
buildRollupSucrase | avg=6971 stdev=254

Dimension 0 diff vs buildRollupEsbuild
  buildRollupSucrase avg=1.253
     > 1.253
```

Running some more build benchmarks to get conclusive results...

Build, n = 10

```text
buildRollupEsbuild | avg=16075 stdev=1293
buildRollupSucrase | avg=23238 stdev=1437

Dimension 0 diff vs buildRollupEsbuild
  buildRollupSucrase avg=1.446
     > 1.446
```

### Takeaways

- The esbuild plugin for rollup is faster than sucrase, by about ~45%. It also produces output that is ~25% faster to process in the webpack step.
- A major issue with esbuild is it's lack of configurability, but by using it as a rollup plugin we hopefully get around that.
- It would be a lot better if we could get the esbuild plugin for webpack to work as well. So that we're using the same processor in both rollup and webpack.
- esbuild is so quick that it might be worth building packages separately for the webpack production build, and then just using ts-loader with transpileOnly, since the speed gained from using sucrase there would not be worth the risk of things breaking. With that setup we would end up with esbuild + ts-loader for prod builds, and sucrase for dev builds.

## Test 8

Got esbuild-loader working for webpack, so trying it out vs sucrase and ts-transpile in a small build:

```js
createProjectMatrix({
  baseConfig: presets.baseConfig({
    packages: Array(10).fill(presets.packages.balanced(10)),
  }),
  dimensions: [
    {
      buildRollupEsbuild: {
        buildMode: 'rollup-esbuild',
      },
      buildNone: {
        buildMode: 'none',
      },
    },
    {
      bundleTsTranspile: {
        bundleMode: 'ts-transpile',
      },
      bundleSucrase: {
        bundleMode: 'sucrase-transpile',
      },
      bundleEsbuild: {
        bundleMode: 'esbuild-transpile',
      },
    },
  ],
});
```

Build, n = 1

```text
buildRollupEsbuild
  bundleTsTranspile | avg=3729 stdev=0
  bundleSucrase     | avg=3182 stdev=0
  bundleEsbuild     | avg=2983 stdev=0
buildNone
  bundleTsTranspile | avg=855 stdev=0
  bundleSucrase     | avg=791 stdev=0
  bundleEsbuild     | avg=799 stdev=0
```

Bundle, n = 5

```text
buildRollupEsbuild
  bundleTsTranspile | avg=3637 stdev=127
  bundleSucrase     | avg=3511 stdev=203
  bundleEsbuild     | avg=3524 stdev=67
buildNone
  bundleTsTranspile | avg=8201 stdev=95
  bundleSucrase     | avg=4997 stdev=85
  bundleEsbuild     | avg=4266 stdev=152

Dimension 0 diff vs buildRollupEsbuild
  buildNone avg=1.630
    bundleTsTranspile > 2.255
    bundleSucrase     > 1.424
    bundleEsbuild     > 1.211

Dimension 1 diff vs bundleTsTranspile
  bundleSucrase avg=0.787
    buildRollupEsbuild ~ 0.965
    buildNone          < 0.609
  bundleEsbuild avg=0.744
    buildRollupEsbuild ~ 0.969
    buildNone          < 0.520
```

### Takeaways

- esbuild isn't a lot faster than sucrase as a webpack loader, at least not for this small project. Given that it produces better output for rollup builds, and it'd be better to have uniform builds, it's probably the best option for use across the board.

## Test 9

Trying out esbuild in a large project:

```js
Array(100).fill(presets.packages.balanced(20));
```

Build, n = 5

```text
buildRollupEsbuild | avg=35388 stdev=1110
buildNone          | avg=975 stdev=169

Dimension 0 diff vs buildRollupEsbuild
  buildNone avg=0.028
     < 0.028
```

Bundle, n = 5

```text
buildRollupEsbuild | avg=6912 stdev=458
buildNone          | avg=15935 stdev=752

Dimension 0 diff vs buildRollupEsbuild
  buildNone avg=2.305
     > 2.305
```

Build times for same package size but just 5 packages, n = 5

```text
buildRollupEsbuild | avg=2065 stdev=376
buildNone          | avg=613 stdev=36

Dimension 0 diff vs buildRollupEsbuild
  buildNone avg=0.297
     < 0.297
```

### Takeaways

- Building all packages with rollup is twice as slow as just building directly with esbuild. And the final build speed is only ~2.3x as fast. Building just a few packages is much faster though, so package dist caching could speed up production builds a bit. It's likely not worth the complexity though, since a full bundling of a full production build is just 16s anyway.
