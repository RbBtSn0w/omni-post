import { sharedBrowserConfig } from '@omni-post/shared-config/eslint.config.js'
import pluginVue from 'eslint-plugin-vue'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

export default [
    {
        name: 'app/files-to-lint',
        files: ['**/*.{js,mjs,jsx,vue}'],
    },

    {
        name: 'app/ignores',
        ignores: ['**/dist-ssr/**'],
    },

    ...sharedBrowserConfig,
    ...pluginVue.configs['flat/essential'],
    skipFormatting,

    {
        rules: {
            'vue/multi-word-component-names': 'off',
            'no-undef': 'off', // Temporarily disable due to test globals not being picked up easily without complex setup
        }
    }
]
