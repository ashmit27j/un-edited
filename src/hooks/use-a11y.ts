import { TouchTarget } from '@/constants/theme';
import { useReader } from '@/store/reader-provider';

/** Touch target height: 44px, or 56px with "Larger touch targets" (You › Accessibility). */
export function useTarget() {
  return useReader().prefs.largeTargets ? 56 : TouchTarget;
}

/**
 * True when meaning mustn't rest on colour alone: "Don't rely on colour alone", or Black and white mode.
 * Saved gets a "Saved" label, the active tab an underline, links an underline.
 */
export function useColourCues() {
  const { prefs } = useReader();
  return prefs.colourCues || prefs.colourMode === 'mono';
}

/** Links stay underlined ("Underline links", or whenever colour cues are on). */
export function useUnderlineLinks() {
  const { prefs } = useReader();
  return prefs.underlineLinks || prefs.colourCues || prefs.colourMode === 'mono';
}
