// ─── THEME OBJECT ────────────────────────────────────────────────────────────
// Cohérence Navy #1a3a5c / Yellow #FFCC00 entre modes clair et sombre

export const THEME = {
  light: {
    bg:              '#f0f2f5',
    surface:         '#ffffff',
    surfaceAlt:      '#f8f9fa',
    border:          '#e5e7eb',
    borderStrong:    '#d1d5db',

    navy:            '#1a3a5c',
    navyDark:        '#0e2a44',
    navyLight:       '#eef3f8',
    yellow:          '#FFCC00',
    yellowHover:     '#ffd633',

    textPrimary:     '#1a1a1a',
    textSecondary:   '#6b7280',
    textMuted:       '#9ca3af',
    textInverse:     '#ffffff',

    success:         '#16a34a',
    successBg:       '#f0fdf4',
    error:           '#dc2626',
    errorBg:         '#fef2f2',
    warning:         '#f59e0b',
    warningBg:       '#fffbeb',
    info:            '#3b82f6',
    infoBg:          '#eff6ff',

    focusOverlay:    'rgba(0,0,0,0.45)',
    focusHighlight:  'rgba(255,204,0,0.12)',

    matchPresent:    '#bbf7d0',
    matchMissing:    '#fee2e2',
    matchNeutral:    '#f3f4f6',

    dragHandle:      '#d1d5db',
    dragOver:        'rgba(26,58,92,0.08)',
    dragActive:      'rgba(26,58,92,0.04)',

    // topbar items
    topbarBg:        '#1a3a5c',
    topbarText:      '#ffffff',
    topbarBtn:       'rgba(255,255,255,0.12)',
    topbarBtnHover:  'rgba(255,255,255,0.22)',
  },

  dark: {
    bg:              '#0d1117',
    surface:         '#161b22',
    surfaceAlt:      '#1c2330',
    border:          '#30363d',
    borderStrong:    '#484f58',

    navy:            '#4d8fc4',       // bleu marine → clair sur fond sombre
    navyDark:        '#6ba8d6',
    navyLight:       '#1a2634',
    yellow:          '#FFCC00',       // le jaune reste identique
    yellowHover:     '#ffd633',

    textPrimary:     '#e6edf3',
    textSecondary:   '#8b949e',
    textMuted:       '#6e7681',
    textInverse:     '#0d1117',

    success:         '#3fb950',
    successBg:       '#0d2118',
    error:           '#f85149',
    errorBg:         '#2a0d0d',
    warning:         '#d29922',
    warningBg:       '#1f1a0d',
    info:            '#58a6ff',
    infoBg:          '#0d1526',

    focusOverlay:    'rgba(0,0,0,0.72)',
    focusHighlight:  'rgba(255,204,0,0.08)',

    matchPresent:    '#0d2f1a',
    matchMissing:    '#2f0d0d',
    matchNeutral:    '#1c2330',

    dragHandle:      '#484f58',
    dragOver:        'rgba(77,143,196,0.15)',
    dragActive:      'rgba(77,143,196,0.08)',

    topbarBg:        '#0d1117',
    topbarText:      '#e6edf3',
    topbarBtn:       'rgba(255,255,255,0.08)',
    topbarBtnHover:  'rgba(255,255,255,0.16)',
  },
};
