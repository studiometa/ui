module.exports = {
  ...require('@studiometa/prettier-config'),
  twigPrintWidth: 100,
  twigAlwaysBreakObjects: false,
  twigMultiTags: ['html_element,end_html_element', 'with,endwith'],
  overrides: [
    {
      files: ['packages/docs/components/**/*.twig', 'packages/docs/components/**/*.js'],
      options: {
        printWidth: 80,
        twigPrintWidth: 80,
      },
    },
  ],
};
