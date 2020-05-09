const createProject = require('./createProject');

module.exports = async function createProjectMatrix({
  baseConfig,
  dimensions,
}) {
  let configs = [baseConfig];

  for (const dimension of dimensions) {
    configs = configs.flatMap((config) => {
      return Object.entries(dimension).map(([name, extraConfig]) => ({
        ...config,
        ...extraConfig,
        path: `${config.path}-${name}`,
      }));
    });
  }

  return Promise.all(configs.map(createProject));
};
