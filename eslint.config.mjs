import path from 'path';
import { fileURLToPath } from 'url';

import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier';
import tailwindcss from 'eslint-plugin-tailwindcss';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  ...tailwindcss.configs['flat/recommended'],
  prettier,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    // Generated output — never lint these
    'coverage/**',
  ]),
  {
    settings: {
      // Tailwind v4 uses CSS-based config; provide absolute path for plugin resolution
      tailwindcss: {
        config: path.join(__dirname, 'src/app/globals.css'),
      },
    },
    rules: {
      'no-unused-vars': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'tailwindcss/classnames-order': 'error',
      // shadcn/ui uses custom CSS theme variables — suppress false positives
      'tailwindcss/no-custom-classname': 'off',
      // eslint-config-next already registers the import plugin
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
          ],
          'newlines-between': 'always',
          pathGroups: [
            {
              pattern: '@/**',
              group: 'internal',
            },
          ],
          pathGroupsExcludedImportTypes: ['builtin'],
        },
      ],
    },
  },
]);

export default eslintConfig;
