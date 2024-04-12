// @ts-check
import buildEslintConfig from '@hakurouken/eslint-config';

export default buildEslintConfig(
  { tampermonkey: true },
  {
    rules: {
      'userscripts/require-name': 'off',
      'userscripts/require-description': 'off',
      'userscripts/require-version': 'off'
    }
  },
  {
    ignores: ['dist/**']
  }
);
