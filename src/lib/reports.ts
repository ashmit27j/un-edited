import { supabase } from '@/lib/supabase';

export type ReportReason = 'link' | 'image' | 'group' | 'other';

export const REASONS: { id: ReportReason; label: string; hint: string }[] = [
  { id: 'link', label: 'Broken link', hint: 'Where did the link go?' },
  { id: 'image', label: 'Wrong image or credit', hint: 'What should the image or credit be?' },
  { id: 'group', label: 'Wrongly grouped with other stories', hint: 'Which story doesn’t belong here?' },
  { id: 'other', label: 'Something else', hint: 'Tell us what you noticed.' },
];

/**
 * Report a problem (MoreSheet board): saved to the `reports` table (supabase/migrations). Includes the story and
 * its source only; no account details. Returns an error message, or null when it was sent.
 */
export async function sendReport(report: { storyId: string; sourceId: string; reason: ReportReason; details: string }) {
  if (!supabase) return 'Reports can’t be sent yet. Please try again later.';
  const { error } = await supabase.from('reports').insert({
    story_id: report.storyId,
    source_id: report.sourceId,
    reason: report.reason,
    details: report.details.trim() || null,
  });
  return error ? 'Couldn’t send the report. Check your connection and try again.' : null;
}
