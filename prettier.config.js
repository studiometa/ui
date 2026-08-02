import prettier from '@studiometa/prettier-config';

export default {
  ...prettier,
  overrides: [
    ...prettier.overrides,
    {
      files: ['packages/docs/reference/items/**/*.twig', 'packages/docs/reference/items/**/*.js'],
      options: {
        printWidth: 80,
        twigPrintWidth: 80,
      },
    },
  ],
};
