import { v4 as uuid } from 'uuid';

export default class Logger {
  constructor() {
    this.id = uuid();
  }

  log(...args) {
    if (!Logger.muted) { console.log(new Date().toISOString(), this.id, ...args); }
  }

  error(...args) {
    if (!Logger.muted) { console.error(new Date().toISOString(), this.id, ...args); }
  }

  static mute() {
    Logger.muted = true;
  }

  static unmute() {
    Logger.muted = false;
  }
}
