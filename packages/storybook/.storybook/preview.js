import { objectToURLSearchParams, withoutTrailingSlash } from '@studiometa/js-toolkit/utils';
import { withLinks } from '@storybook/addon-links';
import './app.js';
import './app.css';

export const decorators = [withLinks];

export const parameters = {
  options: {
    storySort: {
      order: ['Primitives', 'Atoms', 'Molecules', 'Organisms'],
    },
  },
};
