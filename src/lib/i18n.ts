import strings from '@/data/strings.json';
import type { LanguageCode } from '@/data/sample';
import { useReader } from '@/store/reader-provider';

/**
 * Interface strings in English, Hindi and Marathi (design/strings.json, copied to src/data/).
 * The Hindi and Marathi text is a DRAFT: it needs a native speaker's review before launch, and it only covers
 * the interface chrome listed there. Everything else stays English. Headlines and article text are never translated.
 */
export type StringKey = keyof typeof strings.strings;

export function translate(lang: LanguageCode, key: StringKey, vars?: Record<string, string>) {
  const entry = strings.strings[key] as Record<LanguageCode, string>;
  let text = entry[lang] ?? entry.en;
  if (vars) for (const [k, v] of Object.entries(vars)) text = text.replace(`{${k}}`, v);
  return text;
}

/** `t('nav.home')` in the reader's app language (You › Language). */
export function useT() {
  const { prefs } = useReader();
  return (key: StringKey, vars?: Record<string, string>) => translate(prefs.appLanguage, key, vars);
}
