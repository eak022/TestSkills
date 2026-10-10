import globals from 'globals'
import jsEslint from '@eslint/js'
import tsEslint from 'typescript-eslint'
import stylistic from '@stylistic/eslint-plugin'
/**
 * A ESLint configuration for the repository.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export default [
  {
    ignores: ['dist/**', 'generated/**']
  },
  jsEslint.configs.recommended,
  {
    rules: {
      'default-case': ['error', { commentPattern: '^skip\\sdefault' }],
      'no-console': ['warn', { allow: ['error'] }]
    }
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsEslint.parsers
    }
  },
  ...tsEslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/ban-ts-comment': ['error', {
        'ts-ignore': 'allow-with-description'
      }],
      '@typescript-eslint/consistent-type-imports': ['error', {
        fixStyle: 'inline-type-imports'
      }],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-object-type': 'off'
    }
  },
  stylistic.configs.customize({
    indent: 2,
    commaDangle: 'never',
    jsx: true,
    quotes: 'single',
    semi: false
  }),
  {
    rules: {
      '@stylistic/array-bracket-newline': ['error', 'consistent'],
      '@stylistic/array-bracket-spacing': 'error',
      '@stylistic/arrow-parens': ['error', 'always'],
      '@stylistic/arrow-spacing': 'error',
      '@stylistic/block-spacing': 'error',
      '@stylistic/brace-style': ['error', '1tbs', { allowSingleLine: true }],
      '@stylistic/comma-spacing': 'error',
      '@stylistic/comma-style': 'error',
      '@stylistic/computed-property-spacing': 'error',
      '@stylistic/eol-last': 'error',
      '@stylistic/function-call-argument-newline': ['error', 'consistent'],
      '@stylistic/function-call-spacing': ['error', 'never'],
      '@stylistic/indent': ['error', 2, { SwitchCase: 1 }],
      '@stylistic/key-spacing': 'error',
      '@stylistic/keyword-spacing': 'error',
      '@stylistic/linebreak-style': ['error', 'unix'],
      '@stylistic/lines-between-class-members': ['error', 'always'],
      '@stylistic/no-extra-parens': 'error',
      '@stylistic/no-floating-decimal': 'error',
      '@stylistic/no-mixed-operators': 'error',
      '@stylistic/no-mixed-spaces-and-tabs': 'error',
      '@stylistic/no-multi-spaces': 'error',
      '@stylistic/no-multiple-empty-lines': ['error', {
        max: 1,
        maxEOF: 0
      }],
      '@stylistic/no-tabs': ['error', { allowIndentationTabs: true }],
      '@stylistic/object-curly-newline': 'off',
      '@stylistic/object-property-newline': ['error', {
        allowAllPropertiesOnSameLine: true
      }],
      '@stylistic/padded-blocks': ['error', 'never'],
      '@stylistic/rest-spread-spacing': ['error', 'never'],
      '@stylistic/space-before-function-paren': ['error', 'always'],
      '@stylistic/switch-colon-spacing': 'error',
      '@stylistic/template-curly-spacing': 'error',
      '@stylistic/wrap-regex': 'error',
      '@typescript-eslint/no-namespace': 'off'
    }
  },
  {
    languageOptions: {
      globals: {
        ...globals.node
      }
    }
  }
]
