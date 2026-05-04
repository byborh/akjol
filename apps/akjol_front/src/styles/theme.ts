/**
 * Système de design 60-30-10
 * 
 * LIGHT MODE:
 * - 60% Blanc Albâtre #F8F9FA
 * - 30% Gris Nuage #E2E8F0  
 * - 10% Violet Électrique #8B5CF6
 * 
 * DARK MODE:
 * - 60% Noir Mat #121212
 * - 30% Gris Anthracite #27272A
 * - 10% Violet Électrique #8B5CF6
 */

export const themeClasses = {
  // 60% - Fonds principaux + 30% - Surfaces, cartes
  bg: {
    primary: 'bg-[#F8F9FA] dark:bg-[#121212]',
    body: 'bg-[#F8F9FA] dark:bg-[#121212]',
    secondary: 'bg-[#E2E8F0] dark:bg-[#27272A]',
    card: 'bg-[#E2E8F0] dark:bg-[#27272A]',
    elevated: 'bg-white dark:bg-[#27272A]',
    hover: 'hover:bg-[#E2E8F0] dark:hover:bg-[#27272A]',
  },
  
  // Bordures (30%)
  border: {
    default: 'border-[#E2E8F0] dark:border-[#27272A]',
    subtle: 'border-gray-300 dark:border-gray-700',
  },
  
  // 10% - Accent (Violet Électrique)
  accent: {
    bg: 'bg-[#8B5CF6]',
    text: 'text-[#8B5CF6]',
    border: 'border-[#8B5CF6]',
    hover: 'hover:bg-[#7C3AED]',
    ring: 'ring-[#8B5CF6]',
  },
  
  // Textes (WCAG Compliant)
  text: {
    primary: 'text-gray-900 dark:text-[#F3F4F6]',
    secondary: 'text-gray-700 dark:text-gray-300',
    muted: 'text-gray-600 dark:text-gray-400',
    inverse: 'text-white dark:text-gray-900',
    onAccent: 'text-white',
  },
  
  // États interactifs
  interactive: {
    default: 'bg-[#8B5CF6] text-white hover:bg-[#7C3AED] active:bg-[#6D28D9]',
    secondary: 'bg-[#E2E8F0] dark:bg-[#27272A] hover:bg-[#CBD5E1] dark:hover:bg-[#3F3F46]',
    ghost: 'bg-transparent hover:bg-[#E2E8F0] dark:hover:bg-[#27272A]',
  },
  
  // Ombres
  shadow: {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg dark:shadow-gray-900/50',
    xl: 'shadow-xl dark:shadow-gray-900/50',
  },
  
  // Coins arrondis (ergonomie)
  rounded: {
    sm: 'rounded-lg',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    full: 'rounded-full',
  },
};

// Classes composées fréquentes
export const componentClasses = {
  button: {
    primary: `${themeClasses.accent.bg} ${themeClasses.text.onAccent} ${themeClasses.accent.hover} ${themeClasses.rounded.sm} px-4 py-2 font-medium transition-colors`,
    secondary: `${themeClasses.bg.secondary} ${themeClasses.text.primary} hover:bg-[#CBD5E1] dark:hover:bg-[#3F3F46] ${themeClasses.rounded.sm} px-4 py-2 font-medium transition-colors`,
    ghost: `${themeClasses.interactive.ghost} ${themeClasses.text.primary} ${themeClasses.rounded.sm} px-4 py-2 font-medium transition-colors`,
  },
  
  card: `${themeClasses.bg.card} ${themeClasses.rounded.md} ${themeClasses.shadow.md} ${themeClasses.border.default} border p-4`,
  
  input: `${themeClasses.bg.elevated} ${themeClasses.text.primary} ${themeClasses.border.default} border ${themeClasses.rounded.sm} px-3 py-2 focus:outline-none focus:ring-2 ${themeClasses.accent.ring}`,
  
  modal: `${themeClasses.bg.primary} ${themeClasses.rounded.lg} ${themeClasses.shadow.xl} ${themeClasses.border.default} border`,
  
  header: `${themeClasses.bg.elevated} ${themeClasses.border.default} border-b backdrop-blur-lg`,
};
