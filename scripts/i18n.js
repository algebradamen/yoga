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
    detail_adjustments:   'Adjustments',
    detail_counterpose:   'Counterpose',
    detail_teacher_cues:  'Teacher cues',
    col_session:      'Session',
    home_link:        'All sessions',
    print_tooltip:    'Print or save as PDF — choose "Save as PDF" in the print dialog',
    play_tooltip:     'Teacher mode: one exercise at a time',
    teach_nav:        'Exercises',
    teach_prev:       'Prev',
    teach_up:         'Up',
    teach_next:       'Next',
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
    detail_adjustments:   'Tilpasninger',
    detail_counterpose:   'Motstilling',
    detail_teacher_cues:  'Lærercues',
    col_session:      'Økt',
    home_link:        'Alle økter',
    print_tooltip:    'Skriv ut eller lagre som PDF — velg «Lagre som PDF» i utskriftsdialogen',
    play_tooltip:     'Lærermodus: én øvelse om gangen',
    teach_nav:        'Øvelser',
    teach_prev:       'Forrige',
    teach_up:         'Opp',
    teach_next:       'Neste',
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
    detail_adjustments:   'Adaptaciones',
    detail_counterpose:   'Contrapostura',
    detail_teacher_cues:  'Indicaciones del profesor',
    col_session:      'Sesión',
    home_link:        'Todas las sesiones',
    print_tooltip:    'Imprimir o guardar como PDF — elige «Guardar como PDF» en el diálogo de impresión',
    play_tooltip:     'Modo profesor: un ejercicio a la vez',
    teach_nav:        'Ejercicios',
    teach_prev:       'Anterior',
    teach_up:         'Arriba',
    teach_next:       'Siguiente',
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
