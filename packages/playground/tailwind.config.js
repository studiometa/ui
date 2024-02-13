import { tailwindConfig } from '@studiometa/playground/tailwind';

const config = tailwindConfig();

config.content.push('./meta.config.js');

export default config;
