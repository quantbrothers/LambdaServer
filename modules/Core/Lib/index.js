import crypto from 'crypto';

import Promise from 'bluebird';
import AWS from 'aws-sdk';

import Config from './config.json';

export default class Lib {
  static getEnvVars(key = undefined) {
    if (key) {
      return process.env[key];
    }

    return process.env;
  }

  static getConfiguredAWS(region = Lib.getEnvVars('aws_region')) {
    AWS.config.setPromisesDependency(Promise);
    AWS.config.update({ region });
    return AWS;
  }

  static getProjectConfig() {
    return Config;
  }

  static roundNumber(value, decimals) {
    return Number(`${Math.round(`${value}e${decimals}`)}e-${decimals}`);
  }

  static sha256(value) {
    return crypto.createHash('sha256').update(value).digest('hex');
  }

  static md5(value) {
    return crypto.createHash('md5').update(value).digest('hex');
  }

  static settlePromise(self, iterable, iterator, series = false) {
    const mapType = (series) ? 'mapSeries' : 'map';
    return Promise[mapType](iterable, (element) => Promise.resolve().then(() => iterator.apply(self, element)).reflect())
      .then((inspections) => inspections
        .map((inspection) => (inspection.isFulfilled() ? inspection.value() : inspection.reason()))
      )
    ;
  }
}
