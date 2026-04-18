/**
 * Mirrors lib/flutter_flow/custom_functions.dart for goal flow parity with Flutter.
 * Dart DateTime.weekday: Mon=1 … Sat=6, Sun=7. JS getDay(): Sun=0 … Sat=6.
 */
export function toDartWeekday(date) {
  const d = date.getDay();
  return d === 0 ? 7 : d;
}

export function weeksCalculator(startDate, endDate) {
  if (!startDate || !endDate) return '1';
  const daydifference = Math.floor((endDate.getTime() - startDate.getTime()) / 86400000);
  const endDart = toDartWeekday(endDate);
  if (endDart === 6) {
    return String(Math.floor(daydifference / 7) + 2);
  }
  return String(Math.floor(daydifference / 7) + 1);
}

/** Cohort start_date as YYYY-MM-DD (or ISO string) → Date at local midnight-ish */
export function parseCohortStartDate(raw) {
  if (raw == null || raw === '') return null;
  const s = String(raw).trim();
  const fromIso = new Date(s);
  if (!Number.isNaN(fromIso.getTime())) {
    return new Date(fromIso.getFullYear(), fromIso.getMonth(), fromIso.getDate());
  }
  const datePart = s.split(' ')[0];
  const parts = datePart.split('-');
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

export function formatGoalDateDMY(date = new Date()) {
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

/** Same template as functions.goalformatter in custom_functions.dart, plus main-cohort week number. */
export function goalFormatter(
  doneDate,
  prayerDaily,
  prayerWeek,
  bibleStdD,
  bibleStdW,
  evangee,
  persongoals,
  resources,
  week,
  firstName,
  lastName,
  saNumber,
  circleNumber,
  cohortWeekNumber
) {
  const w = week ?? 'Week ';
  const fn = firstName ?? '';
  const ln = lastName ?? '';
  const sa = saNumber ?? '';
  const circ = circleNumber ?? '';
  const weekNum =
    cohortWeekNumber != null && String(cohortWeekNumber).trim() !== ''
      ? String(cohortWeekNumber).trim()
      : '—';
  return `*${w} Goals* 
*Week number:* ${weekNum}
*Circle Number:* ${circ}
*Date:* ${doneDate}

*Name:* ${fn} ${ln}
*SA Number:* ${sa}

*PRAYER GOALS*
Daily: ${prayerDaily ?? ''}
Weekly: ${prayerWeek ?? ''}
*BIBLE STUDY*
Daily: ${bibleStdD ?? ''}
Weekly: ${bibleStdW ?? ''}

*EVANGELISM*
${evangee ?? ''}

*Personal List*
${persongoals ?? ''}

*Resources:* ${resources ?? ''} of 6
  
  `;
}

const GOAL_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSd3CqITqx-YypjcGLFNW-yIrNNz5VZuT5B0dwBpL1xB_TBJMQ/formResponse';

/**
 * `current_cohort.circles` is a JSONB array; item index matches circle number (1-based).
 * Each item: { circle_whatsapp_link, circle_rep_whatsapp_contact }
 */
export function normalizeCirclesArray(circlesRaw) {
  if (circlesRaw == null) return null;
  let circles = circlesRaw;
  if (typeof circles === 'string') {
    try {
      circles = JSON.parse(circles);
    } catch {
      return null;
    }
  }
  return Array.isArray(circles) && circles.length > 0 ? circles : null;
}

export function getCircleWhatsappLinkFromCohort(cohort, circleNumberRaw) {
  const circles = normalizeCirclesArray(cohort?.circles);
  if (!circles) return null;
  const n = parseInt(String(circleNumberRaw).trim(), 10);
  if (Number.isNaN(n) || n < 1 || n > circles.length) return null;
  const entry = circles[n - 1];
  if (!entry || typeof entry !== 'object') return null;
  const raw = entry.circle_whatsapp_link ?? entry.circleWhatsappLink;
  return typeof raw === 'string' ? raw.trim() : null;
}

/** Circle-specific WhatsApp when valid; otherwise cohort main group. */
export function resolveGoalSubmissionWhatsappUrl(cohort, circleNumber) {
  const circleLink = getCircleWhatsappLinkFromCohort(cohort, circleNumber);
  if (circleLink) return circleLink;
  const main =
    cohort?.main_group_link ||
    cohort?.mainGroupLink ||
    null;
  return main && String(main).trim() !== '' ? String(main).trim() : 'https://chat.whatsapp.com/';
}

export function submitGoalGoogleForm({
  date,
  saNumber,
  prayerGoal,
  bibleStudyGoal,
  evangelismGoal,
  personalGoal,
  resourceConsumption,
}) {
  const body = new URLSearchParams();
  body.append('entry.131741888', date || '');
  body.append('entry.1292421788', saNumber || '');
  body.append('entry.389766157', prayerGoal || '');
  body.append('entry.994203053', bibleStudyGoal || '');
  body.append('entry.394922426', evangelismGoal || '');
  body.append('entry.1727512326', evangelismGoal || '');
  body.append('entry.111711562', personalGoal || '');
  body.append('entry.138704244', resourceConsumption || '');
  return fetch(GOAL_FORM_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  }).catch(() => {});
}
