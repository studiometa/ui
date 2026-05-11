import { eslintCompatPlugin } from '@oxlint/plugins';
import {
  preferUiComponent,
  preferTransition,
  noManualFetch,
  preferDataModel,
  preferAction,
} from './rules/index.ts';

const PLUGIN_NAME = 'ui';

const rules = {
  'prefer-ui-component': preferUiComponent,
  'prefer-transition': preferTransition,
  'no-manual-fetch': noManualFetch,
  'prefer-data-model': preferDataModel,
  'prefer-action': preferAction,
};

const recommendedRules: Record<string, string> = {
  [`${PLUGIN_NAME}/prefer-ui-component`]: 'warn',
  [`${PLUGIN_NAME}/prefer-transition`]: 'warn',
  [`${PLUGIN_NAME}/no-manual-fetch`]: 'warn',
  [`${PLUGIN_NAME}/prefer-data-model`]: 'warn',
  [`${PLUGIN_NAME}/prefer-action`]: 'warn',
};

const base = eslintCompatPlugin({
  meta: {
    name: '@studiometa/eslint-plugin-ui',
  },
  rules,
});

const plugin = Object.assign(base, { configs: {} as Record<string, object> });

plugin.configs['recommended'] = {
  plugins: { [PLUGIN_NAME]: plugin },
  rules: recommendedRules,
};

export default plugin;
export { plugin as ui };
