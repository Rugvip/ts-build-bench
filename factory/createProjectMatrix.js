const createProject = require('./createProject');

module.exports = function createProjectMatrix({ baseConfig, dimensions }) {
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

  const projects = configs.map(createProject);

  return {
    projects,
    dirs: projects.map((p) => p.dir),
    inflate: () => Promise.all(projects.map((p) => p.inflate())),
  };
};
