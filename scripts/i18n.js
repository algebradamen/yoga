export const translations = {
  en: {
    col_pose:         'Pose',
    col_duration:     'Duration',
    col_meridians:    'Meridians',
    col_sensation:    'Sensation',
    detail_sensation: 'Sensation',
    detail_alternative:   'Alternative',
    detail_rebound:       'Rebound',
    detail_instructions:  'Instructions',
    detail_transition:    'Transition',
    col_session:      'Session',
    print_tooltip:    'Print or save as PDF — choose "Save as PDF" in the print dialog',
  },
  no: {
    col_pose:         'Stilling',
    col_duration:     'Varighet',
    col_meridians:    'Meridianer',
    col_sensation:    'Sensasjon',
    detail_sensation: 'Sensasjon',
    detail_alternative:   'Alternativ',
    detail_rebound:       'Rebound',
    detail_instructions:  'Instruksjoner',
    detail_transition:    'Overgang',
    col_session:      'Økt',
    print_tooltip:    'Skriv ut eller lagre som PDF — velg «Lagre som PDF» i utskriftsdialogen',
  },
  es: {
    col_pose:         'Postura',
    col_duration:     'Duración',
    col_meridians:    'Meridianos',
    col_sensation:    'Sensación',
    detail_sensation: 'Sensación',
    detail_alternative:   'Alternativa',
    detail_rebound:       'Rebote',
    detail_instructions:  'Instrucciones',
    detail_transition:    'Transición',
    col_session:      'Sesión',
    print_tooltip:    'Imprimir o guardar como PDF — elige «Guardar como PDF» en el diálogo de impresión',
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
