let profiles = {};

function purifyResult(input) {
  if (!input.Children) {
    return input.Result;
  }

  return Object.keys(input.Children).reduce((obj, name) => {
    obj.Children[name] = purifyResult(obj.Children[name]);
    return obj;
  }, input);
}

function unchildren(input) {
  if (!input.Result && !input.Children) {
    return input;
  }

  const result = Object.keys(input.Children).reduce((obj, name) => {
    obj[name] = unchildren(input.Children[name]);
    return obj;
  }, {});

  return input.Result ? { Result: input.Result, Children: result } : result;
}

export default class Profiler {
  static init() {
    profiles = {};
  }

  static profile(name) {
    let pr = profiles[name];
    if (!pr) { pr = profiles[name] = { finish: [] }; } //eslint-disable-line

    if (!pr.start) {
      pr.start = process.hrtime();
      return;
    }

    pr.finish.push(process.hrtime(pr.start));
    delete pr.start;
  }

  static getProfile(name) {
    if (!profiles[name]) {
      return [];
    }

    const result = (profiles[name].finish || []).map(Profiler.toSeconds);
    if (profiles[name].start) { result.push('Unfinished!'); }

    return result;
  }

  static toSeconds(data) {
    return data[0] + data[1] * 1e-9;
  }

  static getProfiles() {
    const profile = unchildren(purifyResult(Object.keys(profiles).reduce((obj, name) => {
      const result = Profiler.getProfile(name);
      const path = name.split('.');
      let point = obj;

      path.forEach(next => {
        if (!point.Children) { point.Children = {}; }
        if (!point.Children[next]) { point.Children[next] = {}; }
        point = point.Children[next];
      });
      point.Result = result.length === 1 ? result[0] : result;

      return obj;
    }, {})));

    profile.RequestDuration = parseFloat((profile.Request.Result || profile.Request) * 1000);

    return profile;
  }
}
