const POMODORO_DURATION = 25 * 60;
const BREAK_DURATION = 5 * 60;
const SKIP_SECONDS = 5;

export const defaultSettings = {
  POMODORO_DURATION: 25 * 60,
  BREAK_DURATION: 5 * 60,
  SKIP_SECONDS: 5,
};
// const SETTINGS_MIN_POMODORO_DURATION = 20;
// const SETTINGS_MAX_POMODORO_DURATION = 4 * 60;

function getUserPreferences() {
  try {
    const raw = localStorage.getItem("user-preferences");
    // console.log(raw);
    if (!raw) return {};
    const userPreferences = JSON.parse(raw);
    console.log(userPreferences);
    if (
      userPreferences &&
      Object.prototype.toString.call(userPreferences) === "[object Object]"
    )
      return userPreferences;
    else {
      console.warn(
        "User preferences localStorage is invalid, resetting user preferences localStorage..."
      );
      localStorage.setItem("user-preferences", "{}");
      return {};
    }
  } catch (e) {
    console.error(`Error while parsing user preferences localStorage: ${e}`);
    console.warn(`Overriding user preferences localStorage with fresh values`);
    localStorage.setItem("user-preferences", "{}");
    return {};
  }
}

export function getUserSettings() {
  const userPreferences = getUserPreferences();
  console.log(userPreferences);
  if (JSON.stringify(userPreferences) === "{}") {
    return { POMODORO_DURATION, BREAK_DURATION, SKIP_SECONDS };
  }
  return userPreferences;
}
