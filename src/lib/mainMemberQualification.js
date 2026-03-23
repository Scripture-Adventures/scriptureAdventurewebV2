/**
 * Main member web access: must exist in main_members, be active in current cohort,
 * and (when both are set) match the cohort selected at login.
 *
 * DB column names match Flutter schema (isincurrentcohort, current_cohort_id).
 */
export async function verifyMainMemberForCohort(supabase, userEmail, selectedCohortId) {
  const { data: member, error } = await supabase
    .from('main_members')
    .select('id, isincurrentcohort, current_cohort_id')
    .eq('email', userEmail)
    .maybeSingle();

  if (error) {
    console.error('main_members lookup failed:', error);
    return { ok: false, reason: 'fetch_error' };
  }
  if (!member) {
    return { ok: false, reason: 'no_member' };
  }
  if (member.isincurrentcohort !== true) {
    return { ok: false, reason: 'not_in_cohort' };
  }
  if (selectedCohortId != null && String(selectedCohortId).trim() !== '') {
    if (
      member.current_cohort_id != null &&
      String(member.current_cohort_id) !== String(selectedCohortId)
    ) {
      return { ok: false, reason: 'wrong_cohort' };
    }
  }
  return { ok: true, member };
}

export function isDevTestMainEmail(email) {
  return email === 'test@test.com' || email === 'admin@scripture.com';
}
