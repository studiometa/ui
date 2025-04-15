import prettier from '@studiometa/prettier-config';

export default {
  ...prettier,
  overrides: [
    ...prettier.overrides,
    {
      files: ['packages/docs/components/**/*.twig', 'packages/docs/components/**/*.js'],
      options: {
        printWidth: 80,
        twigPrintWidth: 80,
      },
    },
  ],
};
