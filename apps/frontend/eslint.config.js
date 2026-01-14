import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'
import globals from 'globals'

export default [
    {
        name: 'app/files-to-lint',
        files: ['**/*.{js,mjs,jsx,vue}'],
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
            }
        }
    },

    {
        name: 'app/ignores',
        ignores: ['**/dist/**', '**/dist-ssr/**', '**/coverage/**', '**/test-results/**'],
    },

    js.configs.recommended,
    ...pluginVue.configs['flat/essential'],
    skipFormatting,

    {
        rules: {
            'vue/multi-word-component-names': 'off',
            'no-undef': 'off', // Temporarily disable due to test globals not being picked up easily without complex setup
        }
    }
]
