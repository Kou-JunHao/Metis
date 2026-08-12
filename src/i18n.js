import { createI18n } from 'vue-i18n'
import zhCN from './locales/zh-CN.json'
import enUS from './locales/en-US.json'

const getBrowserLocale = () => {
  const navLang = navigator.language || navigator.userLanguage || 'zh-CN'
  return navLang.startsWith('zh') ? 'zh-CN' : 'en-US'
}

// In the future, this can be linked to userSettings.language
const locale = localStorage.getItem('metis-language') || getBrowserLocale()

const i18n = createI18n({
  legacy: false, // use Composition API
  locale: locale,
  fallbackLocale: 'en-US',
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS,
    'zh': zhCN,
    'en': enUS
  }
})

export default i18n
