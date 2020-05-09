import * as libs from './libs';
import * as components from './components';

function typeWork<T>(ok: { [key in string]: T }) {
  return Object.values(ok);
}

for (const lib of typeWork(libs)) {
  console.log(`We got lib ${lib}`);
}

for (const component of typeWork(components)) {
  console.log(`We got components ${component}`);
}
