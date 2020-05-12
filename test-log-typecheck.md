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
