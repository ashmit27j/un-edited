/** Native: the theme switches in place. The web build cross-fades it (fade-theme.web.ts). */
export function fadeTheme(apply: () => void) {
  apply();
}
