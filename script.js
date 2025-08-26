"use strict";

import { nanoid } from "./node_modules/nanoid/nanoid.js";

const navBar = document.getElementById("nav");
const timeEl = document.getElementById("time");
const formAddTaskBtn = document.getElementById("submit-task-btn");
const formAddTask = document.getElementById("add-task-form");
const formAddTaskTitleInput = document.getElementById("add-task-title-input");
const sideRight = document.getElementById("side-right");
const timeRemaining = document.getElementById("time-remaining");
const formAddTaskDescriptionInput = document.getElementById(
  "add-task-description-input"
);
const backwardBtn = document.getElementById("backward-time-btn");
const playBtn = document.getElementById("play-time-btn");
const stopBtn = document.getElementById("stop-time-btn");
const forwardBtn = document.getElementById("forward-time-btn");
const menuPomodoro = document.getElementById("menu-pomodoro");
const menuBreak = document.getElementById("menu-break");
const menuCalendar = document.getElementById("menu-calendar");
const playBtns = document.getElementById("play-buttons");
const calendarEl = document.getElementById("calendar");

const POMODORO_DURATION = 0.15 * 60;
const BREAK_DURATION = 0.1 * 60;
const SKIP_SECONDS = 5;

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
        this.#state = e.target.id === "menu-pomodoro" ? "pomodoro" : "break";
        this.#timeLeft = durations[e.target.id];
        this.resetPomodoro();
      } else {
        timeRemaining.textContent = "Calendar  will go here...";
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
      this.createTask(
        formAddTaskTitleInput.value,
        formAddTaskDescriptionInput.value
      );
      formAddTaskTitleInput.value = formAddTaskDescriptionInput.value = "";
    });
    sideRight.addEventListener("click", e => {
      const tasks = this.getTasks();
      const div = e.target.closest(".task");

      const svg = e.target.closest("svg");
      if (!svg) return;
      const taskID = div.id;
      const targetTask = tasks.find(task => task.id === taskID);
      this.switchCheckedIcons(svg.closest(".task"));
      targetTask.isChecked = !targetTask.isChecked;
      sessionStorage.setItem("tasks", JSON.stringify(tasks));
      console.log(targetTask);
    });
    this.init();
  }
  init() {
    // sideRight.innerHTML = `
    // <h2 class="text-5xl mb-5">Tasks</h2>
    // <div class="border w-full rounded-lg flex justify-center items-center flex-col backdrop-blur-xs bg-white/10 task">
    // </div>
    // `;
    this.getTasks().forEach(task =>
      this.createTask(task.title, task.description, task.isChecked)
    );
  }
  getTasks() {
    try {
      const raw = sessionStorage.getItem("tasks");
      if (!raw) return [];
      const tasks = JSON.parse(raw);
      if (tasks && Array.isArray(tasks)) return tasks;
      else {
        console.warn(
          "Session storage is invalid, resetting session storage..."
        );
        sessionStorage.setItem("tasks", "[]");
        return [];
      }
    } catch (e) {
      console.error(`Error while parsing session storage: ${e}`);
      console.warn("Overriding session storage with fresh values");
      sessionStorage.setItem("tasks", "[]");
      return [];
    }
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
  }
  createTask(title, description, isChecked = false) {
    const tasks = this.getTasks();
    const id = nanoid();
    tasks.push({
      title,
      description,
      isChecked,
      id,
    });
    sessionStorage.setItem("tasks", JSON.stringify(tasks));
    const div = `<div id="${id}" class="border w-full rounded-lg flex justify-center items-center flex-col backdrop-blur-xs bg-white/10 task">${checkedIcons}<h4 class="text-2xl p-2"></h4><p class="p-2"></p></div>`;
    sideRight.insertAdjacentHTML("beforeend", div);
    const insertedHTML = sideRight.querySelector("div:last-child");
    if (isChecked) this.switchCheckedIcons(insertedHTML);
    insertedHTML.querySelector("h4").textContent = title;
    insertedHTML.querySelector("p").textContent = description;
  }
  switchCheckedIcons(target) {
    target.querySelectorAll("svg").forEach(element => {
      element.classList.toggle("hidden");
    });
  }
  createTaskHTML(id, isChecked) {
    const div = `<div id="${id}" class="border w-full rounded-lg flex justify-center items-center flex-col backdrop-blur-xs bg-white/10 task">${checkedIcons}<h4 class="text-2xl p-2"></h4><p class="p-2"></p></div>`;
    sideRight.insertAdjacentHTML("beforeend", div);
    const insertedHTML = sideRight.querySelector("div:last-child");
    if (isChecked) this.switchCheckedIcons(insertedHTML);
    insertedHTML.querySelector("h4").textContent = title;
    insertedHTML.querySelector("p").textContent = description;
  }
}

const app = new App();
