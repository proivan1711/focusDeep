"use strict";

export function renderCalendar(calendar, tasks) {
  const events = tasks.map(task => {
    const fromDate = new Date(task.date);
    const toDate = new Date(new Date(task.date).getTime() + 25 * 60 * 1000);
    return {
      from: fromDate.toUTCString(),
      to: toDate.toUTCString(),
      title: task.title,
      description: task.description,
    };
  });
  events.forEach(e => calendar.addEvent(e));
}

export function createCalendar(calendarElement) {
  return new calendarJs(calendarElement, {
    manualEditingEnabled: false,
  });
}
