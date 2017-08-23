import Promise from 'bluebird';

import Profiler from '../Profiler';
import CustomError from '../CustomError';

const tasks = [];
const listeners = [];
let namedTasks = {};

export default class AsyncTasks {
  static register(task, name) {
    const innerTask = Promise.resolve(task);

    if (name) {
      namedTasks[name] = innerTask;
    }

    return tasks.push(innerTask.catch((error) => { console.error(error.stack); }));
  }

  static registerListener(listener) {
    if (typeof listener !== 'function') {
      throw new CustomError('resolverParameterNotValid');
    }

    listeners.push(listener);
  }

  static sendListeners() {
    if (listeners.length === 0) {
      namedTasks = {};
      return Promise.resolve();
    }

    const listener = listeners.shift();

    return Promise.resolve(listener())
      .catch(() => {})
      .then(AsyncTasks.sendListeners)
    ;
  }

  static waitTask(name) {
    if (!namedTasks[name]) {
      console.warn(`WARNING! Try to get absent task ${name} while registered: ${Object.keys(namedTasks)}`);
    }

    return Promise.resolve(namedTasks[name]);
  }

  static wait() {
    if (tasks.length === 0) {
      return AsyncTasks.sendListeners();
    }

    Profiler.profile('AsyncTasks.wait');

    return Promise.resolve(tasks.shift())
      .catch(() => {})
      .tap(() => Profiler.profile('AsyncTasks.wait'))
      .then(AsyncTasks.wait)
    ;
  }
}
