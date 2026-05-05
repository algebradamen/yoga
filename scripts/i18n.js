export const translations = {
  en: {
    col_pose:         'Pose',
    col_duration:     'Duration',
    col_meridians:    'Meridians',
    col_sensation:    'Sensation',
    detail_sensation: 'Sensation',
    detail_alternative: 'Alternative',
    detail_rebound:     'Rebound',
    col_session:      'Session',
  },
  no: {
    col_pose:         'Stilling',
    col_duration:     'Varighet',
    col_meridians:    'Meridianer',
    col_sensation:    'Sensasjon',
    detail_sensation: 'Sensasjon',
    detail_alternative: 'Alternativ',
    detail_rebound:     'Rebound',
    col_session:      'Økt',
  },
  es: {
    col_pose:         'Postura',
    col_duration:     'Duración',
    col_meridians:    'Meridianos',
    col_sensation:    'Sensación',
    detail_sensation: 'Sensación',
    detail_alternative: 'Alternativa',
    detail_rebound:     'Rebote',
    col_session:      'Sesión',
  },
}

export function makeT(locale, warnings) {
  const dict = translations[locale]
  const en   = translations.en
  return function t(key) {
    if (!dict) {
      warnings.push(`i18n: no translations for locale "${locale}", key "${key}" — using English`)
      return en[key] ?? key
    }
    if (!(key in dict)) {
      warnings.push(`i18n: missing key "${key}" for locale "${locale}" — using English`)
      return en[key] ?? key
    }
    return dict[key]
  }
}
