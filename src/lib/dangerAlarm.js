// Pure countdown rule shared by the game and regression tests.
export const DANGER_START_SECONDS = 15;
export const DANGER_REMINDERS = Object.freeze([10, 5, 3, 2, 1]);

export function shouldPlayDangerAlarm({ previous, current, paused = false, completed = false, timeUp = false, unlimited = false }) {
  if (paused || completed || timeUp || unlimited || !Number.isFinite(current) || current <= 0 || current > DANGER_START_SECONDS) return false;
  if (!Number.isFinite(previous) || current >= previous) return false;
  return previous > DANGER_START_SECONDS || DANGER_REMINDERS.some((point) => previous > point && current <= point);
}
