import { fileURLToPath } from 'node:url';

import { includeIgnoreFile } from '@eslint/compat';
import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import importPlugin from 'eslint-plugin-import'; // ← ADD
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import ts from 'typescript-eslint';

import svelteConfig from './svelte.config.ts';

const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url));

export default defineConfig(
	includeIgnoreFile(gitignorePath),
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs.recommended,

	{
		plugins: {
			import: importPlugin // ← ADD
		},
		settings: {
			'import/resolver': {
				typescript: true
			}
		},
		languageOptions: {
			globals: { ...globals.browser, ...globals.node }
		},
		rules: {
			// Typescript-eslint recommendation
			'no-undef': 'off',
			'svelte/no-navigation-without-resolve': 'off',
			'svelte/no-at-html-tags': 'off',

			// 🔽 AUTOMATIC IMPORT ORDERING
			'import/order': [
				'error',
				{
					groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'type'],
					pathGroups: [
						{
							pattern: '$app/**',
							group: 'external',
							position: 'before'
						},
						{
							pattern: '$lib/**',
							group: 'internal'
						}
					],
					pathGroupsExcludedImportTypes: ['builtin'],
					'newlines-between': 'always',
					alphabetize: {
						order: 'asc',
						caseInsensitive: true
					}
				}
			]
		}
	},

	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'],
				parser: ts.parser,
				svelteConfig
			}
		}
	}
);
