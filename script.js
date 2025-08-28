"use strict";

// In script.js
import 'jcalendar.js/dist/calendar.js.css';
import './styles.css';
import './config.js';
import './calendar.js';
import { nanoid } from "./node_modules/nanoid/nanoid.js";
import { renderCalendar, createCalendar } from "./calendar.js";
import { getUserSettings, defaultSettings } from "./config.js";

const { POMODORO_DURATION, BREAK_DURATION, SKIP_SECONDS } = getUserSettings();

const navBar = document.getElementById("nav");
const time = document.getElementById("time");
const formAddTask = document.getElementById("add-task-form");
const formAddTaskTitleInput = document.getElementById("add-task-title-input");
const sideRight = document.getElementById("side-right");
const timeRemaining = document.getElementById("time-remaining");
const settings = document.getElementById("settings");
const formAddTaskDescriptionInput = document.getElementById(
  "add-task-description-input"
);
const playBtn = document.getElementById("play-time-btn");
const stopBtn = document.getElementById("stop-time-btn");
const playBtns = document.getElementById("play-buttons");
const calendarEl = document.getElementById("calendar");
const mainClock = document.getElementById("main-clock");
const settingsForm = document.getElementById("settings-form");
const minutesInputPomodoro = document.getElementById("minutes-input-pomodoro");
const hoursInputPomodoro = document.getElementById("hours-input-pomodoro");
const minutesInputBreak = document.getElementById("minutes-input-break");
const hoursInputBreak = document.getElementById("hours-input-break");
const secondsInputSkip = document.getElementById("seconds-input-skip");
const settingsDeleteAllHistory = document.getElementById(
  "settings-delete-all-history"
);
const deleteFullHistoryPopUp = document.getElementById("delete-history-pop-up");
const deleteFullHistoryPopUpBtns = document.getElementById("confirm-btns");
const resetToDefaultSettingsBtn = document.getElementById("reset-settings-btn");
const nerdPhotoContainer = document.getElementById("nerd-photo");
const motivationMessage = document.getElementById("motivation-message");

const durations = {
  "menu-pomodoro": POMODORO_DURATION,
  "menu-break": BREAK_DURATION,
};

const checkedIcons = `<div class="checked-icons-container">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"
          class="size-7 absolute left-4 top-4 cursor-pointer checked-icons not-checked">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M5.25 7.5A2.25 2.25 0 0 1 7.5 5.25h9a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25v-9Z" />
        </svg>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"
          class="size-6 absolute left-4 top-4 hidden checked-icons checked cursor-pointer">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      </div>`;

class App {
  #calendar;
  #intervalID;
  #timeLeft = POMODORO_DURATION;
  #state = "pomodoro";
  constructor() {
    navBar.addEventListener("click", e => {
      if (e.target.id === "nav") return;
      for (const child of navBar.children) {
        child.classList.remove("border-b-2");
      }
      e.target.classList.add("border-b-2");
      if (durations[e.target.id]) {
        settings.classList.remove("flex");
        settings.classList.add("hidden");
        calendarEl.classList.add("hidden");
        mainClock.classList.remove("hidden");
        playBtns.classList.remove("hidden");
        this.#state = e.target.id === "menu-pomodoro" ? "pomodoro" : "break";
        this.#timeLeft = durations[e.target.id];
        this.resetPomodoro();
      } else if (e.target.id === "menu-calendar") {
        settings.classList.remove("flex");
        settings.classList.add("hidden");
        calendarEl.classList.remove("hidden");
        document.title = "Calendar";
        mainClock.classList.add("hidden");
        playBtns.classList.add("hidden");
        this.#calendar.clearEvents();
        renderCalendar(this.#calendar, this.getTasks(true));
      } else {
        settings.classList.remove("hidden");
        settings.classList.add("flex");
        calendarEl.classList.add("hidden");
        document.title = "Settings";
        mainClock.classList.add("hidden");
        playBtns.classList.add("hidden");
      }
    });
    playBtns.addEventListener("click", e => {
      switch (e.target.id) {
        case "play-buttons":
          break;
        case "play-time-btn":
          if (this.#timeLeft === 0) return;
          this.toggleBtnVisibility();
          this.startTimer();
          break;
        case "stop-time-btn":
          this.clearTimeInterval();
          this.toggleBtnVisibility();
          break;
        case "forward-time-btn":
          this.#timeLeft += SKIP_SECONDS;
          this.displayResult();
          break;
        case "backward-time-btn":
          this.#timeLeft -= SKIP_SECONDS;
          if (this.#timeLeft < 0) {
            this.#timeLeft = 0;
            this.resetPomodoro();
          }
          this.displayResult();
          break;
      }
    });
    formAddTask.addEventListener("submit", e => {
      e.preventDefault();
      if (
        this.getTasks().some(
          task => task.title === formAddTaskTitleInput.value.trim()
        )
      ) {
        formAddTaskTitleInput.setCustomValidity("Please add unique task");
        formAddTaskTitleInput.reportValidity();
        formAddTaskTitleInput.setCustomValidity("");
        return;
      }
      this.createTask(
        formAddTaskTitleInput.value,
        formAddTaskDescriptionInput.value
      );
      formAddTaskTitleInput.value = formAddTaskDescriptionInput.value = "";
    });
    sideRight.addEventListener("click", e => {
      if (e.target.closest("button").id === "delete-tasks-btn") {
        this.deleteTasks();
        return;
      }
      const tasks = this.getTasks();
      const div = e.target.closest(".task");

      const svg = e.target.closest("svg");
      if (!svg) return;
      const taskID = div.id;
      const targetTask = tasks.find(task => task.id === taskID);
      this.switchCheckedIcons(svg.closest(".task"));
      targetTask.isChecked = !targetTask.isChecked;
      sessionStorage.setItem("tasks", JSON.stringify(tasks));
    });
    this.init();
    settingsDeleteAllHistory.addEventListener("click", () => {
      deleteFullHistoryPopUp.classList.remove("hidden");
      deleteFullHistoryPopUp.classList.add("flex");
    });
    deleteFullHistoryPopUpBtns.addEventListener("click", e => {
      if (e.target.id === "confirm-btns") return;
      if (e.target.id === "history-yes") {
        localStorage.removeItem("tasks");
        sessionStorage.clear();
        window.location.reload();
      } else {
        deleteFullHistoryPopUp.classList.remove("flex");
        deleteFullHistoryPopUp.classList.add("hidden");
      }
    });
    settingsForm.addEventListener("submit", this.handleSettingsForm.bind(this));
    resetToDefaultSettingsBtn.addEventListener("click", () => {
      localStorage.setItem("user-preferences", JSON.stringify(defaultSettings));
      window.location.reload();
    });
  }
  init() {
    this.getTasks().forEach(task =>
      this.createTaskHTML(task.id, task.isChecked, task.title, task.description)
    );
    this.displayTime(new Date());
    this.handleTime();
    (this.#calendar = createCalendar(calendarEl)),
      calendarEl.classList.add("hidden");
    this.displayResult();
    if (POMODORO_DURATION >= 90 * 60) {
      nerdPhotoContainer.classList.remove("hidden");
      motivationMessage.classList.remove("p-20");
      motivationMessage.classList.add("absolute", "right-10", "bottom-25");
    }
  }
  getTasks(isLocalStorage = false) {
    const storage = isLocalStorage ? localStorage : sessionStorage;
    const storageString = isLocalStorage ? "Local" : "Session";
    try {
      const raw = storage.getItem("tasks");
      if (!raw) return [];
      const tasks = JSON.parse(raw);
      if (tasks && Array.isArray(tasks)) return tasks;
      else {
        console.warn(
          `${storageString} storage is invalid, resetting ${storageString} storage...`
        );
        storage.setItem("tasks", "[]");
        return [];
      }
    } catch (e) {
      console.error(`Error while parsing ${storageString} storage: ${e}`);
      console.warn(`Overriding ${storageString} storage with fresh values`);
      storage.setItem("tasks", "[]");
      return [];
    }
  }
  saveToLocalStorageTasks() {
    const tasksSessionStorage = this.getTasks();
    const tasksLocalStorage = this.getTasks(true);
    const noDuplicatesSessionStorage = tasksSessionStorage.filter(task => {
      return !tasksLocalStorage.some(
        taskLocalStorage => taskLocalStorage.id === task.id
      );
    });
    tasksLocalStorage.push(...noDuplicatesSessionStorage);
    localStorage.setItem("tasks", JSON.stringify(tasksLocalStorage));
  }
  displayResult() {
    const timeString = `${String(Math.floor(this.#timeLeft / 60)).padStart(
      2,
      "0"
    )}:${String(Math.floor(this.#timeLeft % 60)).padStart(2, "0")}`;
    timeRemaining.textContent = document.title = timeString;
  }
  startTimer() {
    if (this.#intervalID) return;
    this.#intervalID = setInterval(() => {
      this.#timeLeft--;
      this.displayResult();
      if (this.#timeLeft === 0) {
        this.#timeLeft = POMODORO_DURATION;
        document.title = "Pomodoro Done!";
        this.resetPomodoro();
      }
    }, 1000);
  }
  clearTimeInterval() {
    clearInterval(this.#intervalID);
    this.#intervalID = null;
  }
  toggleBtnVisibility() {
    playBtn.classList.toggle("hidden");
    stopBtn.classList.toggle("hidden");
  }
  resetPomodoro() {
    this.clearTimeInterval();
    playBtn.classList.remove("hidden");
    stopBtn.classList.add("hidden");
    this.displayResult();
    const tasks = this.getTasks();
    this.saveToLocalStorageTasks();
    sessionStorage.clear();
  }
  createTask(title, description, isChecked = false) {
    const tasksSessionStorage = this.getTasks();
    const id = nanoid();
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    const date = new Date().toISOString();
    const task = {
      title: trimmedTitle,
      description: trimmedDescription,
      isChecked,
      id,
      date,
    };
    tasksSessionStorage.push(task);
    sessionStorage.setItem("tasks", JSON.stringify(tasksSessionStorage));
    this.createTaskHTML(id, isChecked, title, description);
  }
  switchCheckedIcons(target) {
    target.querySelectorAll("svg").forEach(element => {
      element.classList.toggle("hidden");
    });
  }
  createTaskHTML(id, isChecked, title, description) {
    const div = `<div id="${id}" class="border w-full rounded-lg flex justify-center items-center flex-col backdrop-blur-xs bg-white/10 task">${checkedIcons}<h4 class="text-2xl p-2"></h4><p class="p-2"></p></div>`;
    sideRight.insertAdjacentHTML("beforeend", div);
    const insertedHTML = sideRight.querySelector("div:last-child");
    if (isChecked) this.switchCheckedIcons(insertedHTML);
    insertedHTML.querySelector("h4").textContent = title;
    insertedHTML.querySelector("p").textContent = description;
  }
  handleTime() {
    setTimeout(() => {
      const update = () => {
        this.displayTime(new Date());
        const msToNextMin = (60 - new Date().getSeconds()) * 1000;
        setTimeout(update, msToNextMin);
      };
      update();
    }, (60 - new Date().getSeconds()) * 1000);
  }
  displayTime(date) {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    time.textContent = `${hours}:${minutes}`;
  }
  deleteTasks() {
    this.saveToLocalStorageTasks();
    sessionStorage.clear();
    this.resetTaskHTML();
  }
  resetTaskHTML() {
    sideRight.innerHTML = `
    <h2 class="text-5xl mb-5">Tasks</h2>
    <button class="absolute left-10 cursor-pointer top-10" title="Delete all tasks" id="delete-tasks-btn">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"
        class="size-6">
        <path stroke-linecap="round" stroke-linejoin="round"
          d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
      </svg>
    </button>
    <div class="border w-full rounded-lg flex justify-center items-center flex-col backdrop-blur-xs bg-white/10 task">
    </div>
    `;
  }
  handleSettingsForm(e) {
    e.preventDefault();
    function calculateTotalSeconds(minutes, hours) {
      if (minutes === "") return parseInt(hours) * 60 * 60;
      if (hours === "") return parseInt(minutes) * 60;
      return parseInt(minutes) * 60 + parseInt(hours) * 60 * 60;
    }
    const trimmedMinutesPomodoroValue = minutesInputPomodoro.value.trim();
    const trimmedHoursPomodoroValue = hoursInputPomodoro.value.trim();
    const trimmedMinutesBreakValue = minutesInputBreak.value.trim();
    const trimmedHoursBreakValue = hoursInputBreak.value.trim();
    const trimmedSecondsSkipValue = secondsInputSkip.value.trim();
    minutesInputPomodoro.value =
      hoursInputPomodoro.value =
      minutesInputBreak.value =
      hoursInputBreak.value =
      secondsInputSkip.value =
        "";
    const result = {};
    if (
      trimmedMinutesPomodoroValue !== "" ||
      trimmedHoursPomodoroValue !== ""
    ) {
      result.POMODORO_DURATION = calculateTotalSeconds(
        trimmedMinutesPomodoroValue,
        trimmedHoursPomodoroValue
      );
    } else {
      result.POMODORO_DURATION = POMODORO_DURATION;
    }
    if (trimmedMinutesBreakValue !== "" || trimmedHoursBreakValue !== "") {
      result.BREAK_DURATION = calculateTotalSeconds(
        trimmedMinutesBreakValue,
        trimmedHoursBreakValue
      );
    } else {
      result.BREAK_DURATION = BREAK_DURATION;
    }
    if (trimmedSecondsSkipValue !== "") {
      result.SKIP_SECONDS = parseInt(trimmedSecondsSkipValue);
    } else {
      result.SKIP_SECONDS = SKIP_SECONDS;
    }
    localStorage.setItem("user-preferences", JSON.stringify(result));
    window.location.reload();
  }
}

const app = new App();
