// @ts-check
import buildEslintConfig from '@hakurouken/eslint-config';

export default buildEslintConfig(
  { tampermonkey: true },
  {
    rules: {
      'userscripts/require-version': 'off'
    }
  }
);
