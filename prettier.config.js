import config from "@studiometa/prettier-config";

config.overrides.push({
  files: [
    "packages/docs/components/**/*.twig",
    "packages/docs/components/**/*.js",
  ],
  options: {
    printWidth: 80,
    twigPrintWidth: 80,
  },
});

export default config;
