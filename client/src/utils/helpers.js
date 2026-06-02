import { v4 as uuidv4 } from "uuid";

export function generateRoomId() {
  return uuidv4().slice(0, 8).toUpperCase();
}

export function getUserId() {
  let id = sessionStorage.getItem("collab_user_id");
  if (!id) {
    id = uuidv4();
    sessionStorage.setItem("collab_user_id", id);
  }
  return id;
}

export function getUsername() {
  return sessionStorage.getItem("collab_username") || "";
}

export function setUsername(name) {
  sessionStorage.setItem("collab_username", name);
}

export function formatTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function throttle(fn, limit) {
  let lastRun = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastRun >= limit) { lastRun = now; fn(...args); }
  };
}

export function copyToClipboard(text) {
  return navigator.clipboard.writeText(text).then(() => true).catch(() => false);
}

export function exportAsMarkdown(content) {
  const blob = new Blob([content], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "document.md"; a.click();
  URL.revokeObjectURL(url);
}

export function exportAsHTML(content) {
  const full = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Document</title></head><body>${content}</body></html>`;
  const blob = new Blob([full], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "document.html"; a.click();
  URL.revokeObjectURL(url);
}