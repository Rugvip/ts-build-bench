# Type Check Test Log

Trying out different setups for type checking from commandline. This is with the assumption that the build setup will not do any form of type checking, and it needs separate handling.

Looking for a couple of things:

- Clean state full project lint time
- Incremental lint time for some number of packages changed
- Watch mode startup speed

Some constraints:

- Needs to output declaration files that can be published, preferably without any further processing. We might end up using some tool for merging into a .d.ts file eventually, but it'd be good if the files end up in a good location for now.
- Preferably support project-wide watch-mode. The intent is that type check feedback during development would come from the Editor, but not everyone has that set up, so it'd be good to provide watch mode for that.

## Test 1

Starting out with a somewhat small project and all available configuration options.

```js
createProjectMatrix({
  baseConfig: presets.baseConfig({
    packages: Array(5).fill(presets.packages.balanced(20)),
  }),
  dimensions: [
    {
      lintAll: {
        lintStrategy: 'all',
      },
      lintTop: {
        lintStrategy: 'top',
      },
      lintTopRefs: {
        lintStrategy: 'top-references',
      },
    },
    {
      refs: {
        projectReferences: 'enabled',
      },
      refsSpread: {
        projectReferences: 'spread-composite',
      },
      noRefs: {
        projectReferences: 'none',
      },
    },
  ],
});
```

First lint, n = 1

```text
lintAll
  refs       | avg=31414 stdev=0
  refsSpread | avg=30787 stdev=0
  noRefs     | avg=35778 stdev=0
lintTop
  refs       | avg=13790 stdev=0
  refsSpread | avg=13322 stdev=0
  noRefs     | avg=12616 stdev=0
lintTopRefs
  refs       | avg=41878 stdev=0
  refsSpread | avg=38713 stdev=0
  noRefs     | avg=1175 stdev=0

Dimension 0 diff vs lintAll
  lintTop avg=0.408
    refs       < 0.439
    refsSpread < 0.433
    noRefs     < 0.353
  lintTopRefs avg=0.874
    refs       > 1.333
    refsSpread > 1.257
    noRefs     < 0.033

Dimension 1 diff vs refs
  refsSpread avg=0.957
    lintAll     ~ 0.980
    lintTop     ~ 0.966
    lintTopRefs ~ 0.924
  noRefs avg=0.694
    lintAll     > 1.139
    lintTop     ~ 0.915
    lintTopRefs < 0.028
```

Followup lint, n = 1

```text
lintAll
  refs       | avg=6876 stdev=0
  refsSpread | avg=7326 stdev=0
  noRefs     | avg=34919 stdev=0
lintTop
  refs       | avg=3559 stdev=0
  refsSpread | avg=3125 stdev=0
  noRefs     | avg=3070 stdev=0
lintTopRefs
  refs       | avg=773 stdev=0
  refsSpread | avg=747 stdev=0
  noRefs     | avg=580 stdev=0

Dimension 0 diff vs lintAll
  lintTop avg=0.344
    refs       < 0.518
    refsSpread < 0.427
    noRefs     < 0.088
  lintTopRefs avg=0.077
    refs       < 0.112
    refsSpread < 0.102
    noRefs     < 0.017

Dimension 1 diff vs refs
  refsSpread avg=0.970
    lintAll     ~ 1.065
    lintTop     < 0.878
    lintTopRefs ~ 0.966
  noRefs avg=2.230
    lintAll     > 5.078
    lintTop     < 0.863
    lintTopRefs < 0.750
```

### Takeaways

- A top-level lint with a global type cache directory is by far the best option from a performance standpoint. The incremental lint is quick enough and initial build is much quicker. It also doesn't matter if project references are used or not, which means we don't need to manage those. The downside of using top-level lint is tsconfigs in each package are ignored, the types are output to a separate dir and need further processing to be placed in the correct dist directory for publishing.

### Test 2

Using the same config but skipping the top-level lint config, since that seems to be the best option but with known downsides.

Also removing the spread composite option, since that didn't seem to have any impact.

New in this run is incemental option for non-project reference builds.

```js
createProjectMatrix({
  baseConfig: presets.baseConfig({
    packages: Array(5).fill(presets.packages.balanced(20)),
  }),
  dimensions: [
    {
      lintAll: {
        lintStrategy: 'all',
      },
      lintTopRefs: {
        lintStrategy: 'top-references',
      },
    },
    {
      refs: {
        projectReferences: 'enabled',
      },
      noRefsInc: {
        projectReferences: 'incremental',
      },
      noRefs: {
        projectReferences: 'none',
      },
    },
  ],
});
```

First lint, n = 1

```text
lintAll
  refs      | avg=29083 stdev=0
  noRefsInc | avg=35475 stdev=0
  noRefs    | avg=33086 stdev=0
lintTopRefs
  refs      | avg=39393 stdev=0
  noRefsInc | avg=611 stdev=0
  noRefs    | avg=487 stdev=0

Dimension 0 diff vs lintAll
  lintTopRefs avg=0.462
    refs      > 1.355
    noRefsInc < 0.017
    noRefs    < 0.015

Dimension 1 diff vs refs
  noRefsInc avg=0.618
    lintAll     > 1.220
    lintTopRefs < 0.016
  noRefs avg=0.575
    lintAll     > 1.138
    lintTopRefs < 0.012
```

Second lint, n = 5

```text
lintAll
  refs      | avg=6331 stdev=358
  noRefsInc | avg=8168 stdev=321
  noRefs    | avg=32705 stdev=1837
lintTopRefs
  refs      | avg=595 stdev=9
  noRefsInc | avg=465 stdev=18
  noRefs    | avg=465 stdev=21

Dimension 0 diff vs lintAll
  lintTopRefs avg=0.055
    refs      < 0.094
    noRefsInc < 0.057
    noRefs    < 0.014

Dimension 1 diff vs refs
  noRefsInc avg=1.036
    lintAll     > 1.290
    lintTopRefs < 0.782
  noRefs avg=2.974
    lintAll     > 5.166
    lintTopRefs < 0.782
```

lintTopRefs with noRefs is a noop, ignore those values

### Takeaways

- Incremental tsc is likely a given, remains to be seen if it's something we want to run in CI/CD or not. Skipping non-incremental for further tests.

## Test 3

Focusing in on incremental with just 1 3-part dimension:

```js
{
        allInc: {
          lintStrategy: 'all',
          projectReferences: 'incremental',
        },
        allRefs: {
          lintStrategy: 'all',
          projectReferences: 'enabled',
        },
        topRefs: {
          lintStrategy: 'top-references',
          projectReferences: 'enabled',
        },
      }
```

First lint, n = 1

```text
allInc  | avg=31707 stdev=0
allRefs | avg=26146 stdev=0
topRefs | avg=43529 stdev=0

Dimension 0 diff vs allInc
  allRefs avg=0.825
     < 0.825
  topRefs avg=1.373
     > 1.373
```

Second lint, n = 5

```text
allInc  | avg=7793 stdev=486
allRefs | avg=7000 stdev=88
topRefs | avg=612 stdev=36

Dimension 0 diff vs allInc
  allRefs avg=0.898
     < 0.898
  topRefs avg=0.078
     < 0.078
```

### Takeaways

- Initial result is not reliable enough, need to figure out how to run that in a loop.

## Test 4

Multiple runs of clean lean, also fixed main not being included in the project references version.

First lint, n = 5

```text
allInc  | avg=30141 stdev=1399
allRefs | avg=25783 stdev=1269
topRefs | avg=45644 stdev=717

Dimension 0 diff vs allInc
  allRefs avg=0.855
     < 0.855
  topRefs avg=1.514
     > 1.514
```

### Takeaways

- Using project references seems to speed up clean lerna lints too.
- Using tsc build mode seems very slow, so we likely don't want to rely on this for the clean build. It might come in handy to have this in watch mode though.

## Test 5

Same as previous config, but running full test including new benchmark of linting changed files.

The changed lint test is double the actual expected lint time, as it modifies a file and expects an error, then changes it back and expects a successful lint run.

First lint, n = 5

```text
allInc  | avg=29451 stdev=369
allRefs | avg=24719 stdev=743
topRefs | avg=43392 stdev=536

Dimension 0 diff vs allInc
  allRefs avg=0.839
     < 0.839
  topRefs avg=1.473
     > 1.473
```

Second lint, n = 5

```text
allInc  | avg=7460 stdev=510
allRefs | avg=7110 stdev=249
topRefs | avg=623 stdev=8

Dimension 0 diff vs allInc
  allRefs avg=0.953
     ~ 0.953
  topRefs avg=0.084
     < 0.084
```

Changed lint, n = 5

```text
allInc  | avg=15818 stdev=366
allRefs | avg=15298 stdev=380
topRefs | avg=6170 stdev=142

Dimension 0 diff vs allInc
  allRefs avg=0.967
     ~ 0.967
  topRefs avg=0.390
     < 0.390
```

### Takeaways

- `tsc --build` is much faster at detecting and linting only changed packages, while still much slower than running lint through lerna for the clean build.
- Need to benchmark the combination of lerna lint for full linting, and if the result of that is fine to use later with `tsc --build`.

### Test 6

Trying out same setup as previous test, but always using `tsc --build` for the changed lint, and skipping the setup without project references.

Change lint, n = 5

```text
allRefs | avg=6154 stdev=293
topRefs | avg=6100 stdev=94

Dimension 0 diff vs allRefs
  topRefs avg=0.991
     ~ 0.991
```

Needing to dig into the first lint time after a full build:

Followup lint, changed, n = 1

```text
allRefs | avg=6704 stdev=0
topRefs | avg=5933 stdev=0
```

Followup lint, unchanged, n = 1

```text
allRefs | avg=745 stdev=0
topRefs | avg=612 stdev=0
```

### Takeaways

- It seems like running a lerna lint followed by a `tsc --build` works just fine, it's possible that it's a bit slower but at most some 10%.
- Time to try larger projects.

## Test 7

Same as previous config, but much larger project:

```js
createProjectMatrix({
  baseConfig: presets.baseConfig({
    packages: Array(50).fill(presets.packages.balanced(20)),
  }),
  dimensions: [
    {
      allInc: {
        lintStrategy: 'all',
        projectReferences: 'incremental',
      },
      allRefs: {
        lintStrategy: 'all',
        projectReferences: 'enabled',
      },
      topRefs: {
        lintStrategy: 'top-references',
        projectReferences: 'enabled',
      },
    },
  ],
});
```

First lint, n = 3

```text
allInc  | avg=231204 stdev=14297
allRefs | avg=225363 stdev=1714
topRefs | avg=375197 stdev=9138

Dimension 0 diff vs allInc
  allRefs avg=0.975
     ~ 0.975
  topRefs avg=1.623
     > 1.623
```

Followup project references lint, n = 1

allInc is a noop

```text
allInc  | avg=795 stdev=0
allRefs | avg=1499 stdev=0
topRefs | avg=1454 stdev=0

Dimension 0 diff vs allInc
  allRefs avg=1.886
     > 1.886
  topRefs avg=1.829
     > 1.829
```

Second lint, n = 3

```text
allInc  | avg=55846 stdev=6270
allRefs | avg=54423 stdev=1899
topRefs | avg=1390 stdev=43

Dimension 0 diff vs allInc
  allRefs avg=0.975
     ~ 0.975
  topRefs avg=0.025
     < 0.025
```

Changed with project lint, n = 3

allInc is a noop

```text
allInc  | avg=939 stdev=51
allRefs | avg=7037 stdev=61
topRefs | avg=7012 stdev=213

Dimension 0 diff vs allInc
  allRefs avg=7.491
     > 7.491
  topRefs avg=7.465
     > 7.465
```

### Takeaways

- Linting each package separately is prohibitively slow in a large project. Incremental linting is alright, but the clean lint takes minutes.
- Using lerna for incremental linting doesn't make sense, project references need to be used.

## Test 8

Same project size as previous test, but using a single top-level lint strategy:

```js
({
  top: {
    lintStrategy: 'top',
    projectReferences: 'none',
  },
  topInc: {
    lintStrategy: 'top',
    projectReferences: 'incremental',
  },
});
```

First lint, n = 5

```text
top    | avg=32758 stdev=1111
topInc | avg=39714 stdev=1064

Dimension 0 diff vs top
  topInc avg=1.212
     > 1.212
```

Second lint, n = 5

```text
top    | avg=29937 stdev=1717
topInc | avg=6230 stdev=28

Dimension 0 diff vs top
  topInc avg=0.208
     < 0.208
```

Changed lint x2, n = 5

```text
top    | avg=61756 stdev=3562
topInc | avg=17600 stdev=558

Dimension 0 diff vs top
  topInc avg=0.285
     < 0.285
```

### Takeaways

- Initial checking of the large 50x20 project is about 6x faster with incremental linting, and even faster without.
- Incremental checks are also quite quick, but not as fast as with project references.

### Open questions

- How do project references compare to incremental top-level checks in watch mode?
- Will a more complex dependency graph change the above conclusions?
