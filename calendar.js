"use strict";

export default function createCalendar(calendarElement, tasks) {
  const calendar = new calendarJs(calendarElement, {
    manualEditingEnabled: false,
  });
  // const event = {
  //   from: new Date(),
  //   to: new Date(),
  //   title: "A New Event",
  //   description: "A description of the event",
  // };
  // calendar.addEvent(event);
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
