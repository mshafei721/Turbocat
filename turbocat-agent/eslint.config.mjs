// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import nextPlugin from 'eslint-config-next'

const eslintConfig = [{
  ignores: ['node_modules/**', '.next/**', 'out/**', 'build/**', 'next-env.d.ts'],
}, ...nextPlugin, ...storybook.configs["flat/recommended"]]

export default eslintConfig
