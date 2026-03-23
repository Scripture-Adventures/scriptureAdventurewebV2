/**
 * Weekly goals may only be set on Saturday and Sunday (local time).
 * getDay(): 0 = Sunday, 6 = Saturday
 */
export function isWeeklyGoalSettingAllowed(date = new Date()) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function weeklyGoalWindowMessage() {
  return 'Weekly goals can only be set on Saturday and Sunday. Come back on the weekend to update your goals.';
}
