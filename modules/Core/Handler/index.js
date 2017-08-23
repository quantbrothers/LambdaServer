import Promise from 'bluebird';
import Joi from 'joi';

import Lib from '../Lib';
import Profiler from '../Profiler';
import JoiResolver from '../JoiResolver';
import CustomError from '../CustomError';
import AsyncTasks from '../AsyncTasks';

import Config from './config.json';

class Handler {
  constructor(Logger = console, Log = true) {
    this.logger = Logger;
    this.log = Log;
    this.runData = {};
  }

  execute() { return {}; }

  initializeRun() {
    this.runData = {};
    Profiler.init();
  }

  logError(error) {
    if (error.stack) { this.logger.error(error.stack); } else { this.logger.error(error); }
  }

  logEvent() {
    if (this.log) { this.logger.log(JSON.stringify(this.runData.event, null, '  ')); }
  }

  static isProduction() {
    return Lib.getEnvVars('environment') === Lib.getProjectConfig().environments.prod.name;
  }

  static successResponse(response) {
    return { result: { Response: response } };
  }

  static failureResponse(e) {
    return { result: { Error: e } };
  }

  static unexpectedErrorResponse(e, eventSource) {
    const error = Handler.isProduction() ? 'Unexpected server error' : e.stack || e.message || e.toString();

    if (eventSource === Config.eventSources.apiGateway) {
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify(`500: ${error}`),
      };
    }

    return `500: ${error}`;
  }

  static prepareResponse(response, eventSource) {
    let innerResponse = response;

    if (response.result) {
      const result = response.result;
      result.ResponseTimestamp = Date.now();
      Profiler.profile('Request');

      result.Profile = Profiler.getProfiles();

      innerResponse = { result };
    }

    if (eventSource === Config.eventSources.apiGateway) {
      return {
        statusCode: (innerResponse.result) ? 200 : 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify(innerResponse.result || innerResponse),
      };
    }

    return innerResponse;
  }

  static closeConnections() {
    return Promise.join();
  }

  finishExecution(response, eventSource) {
    return AsyncTasks.wait()
      .then(() => Handler.prepareResponse(response, eventSource))
      .then((output) => {
        if ((!output.result && !output.statusCode) || (output.statusCode && output.statusCode >= 500)) {
          return {
            error: output,
          };
        } else if (output.statusCode && output.statusCode < 500) {
          return {
            result: output,
          };
        }

        return output;
      })
      .tap((output) => { if (this.log) { this.logger.log(JSON.stringify(output, null, '  ')); } })
      .tap(() => Handler.closeConnections())
      .then((output) => this.runData.event.Context.done(output.error, output.result))
    ;
  }

  getHandler() {
    return (event, context) => this.handler(event, context);
  }

  handler(event, context) {
    let eventSource = Config.eventSources.lambda;

    if (event.httpMethod) {
      event = event.body ? JSON.parse(event.body) : null;
      eventSource = Config.eventSources.apiGateway;
    }

    return Promise.resolve(this.initializeRun())
      .then(() => Profiler.profile('Request'))
      .then(() => this.prepareInnerEvent(event, context))
      .then(() => this.logEvent())
      .then(() => this.handleExecution())
      .timeout(context.getRemainingTimeInMillis() - Config.timeoutStep, new CustomError('taskTimeout'))
      .then((responseData) => Handler.successResponse(responseData))
      .catch((error) => {
        this.logError(error);
        throw error;
      })
      .catch(CustomError, (e) => Handler.failureResponse(e))
      .catch((e) => Handler.unexpectedErrorResponse(e, eventSource))
      .then((response) => this.finishExecution(response, eventSource))
    ;
  }

  prepareInnerEvent(event, context) {
    this.runData.event = Object.assign({}, event, { Context: context });
  }

  getResolver() {
    this.resolver = this.resolver || new JoiResolver(this.resolverSchema, this.logger);
    return this.resolver;
  }

  handleExecution() {
    return Promise.resolve(this.getResolver().resolve(this.runData.event))
      .tap(resolved => { this.runData.Resolved = resolved; })
      .tap(() => this.processMiddleware(this.runData.Resolved))
      .then(() => this.execute(this.runData.Resolved))
      .catch((error) => {
        if (this.errorHandler) {
          return this.errorHandler(error);
        }

        throw error;
      })
    ;
  }

  processMiddleware(event, middleware = null) {
    const innerMiddleware = middleware || (Array.isArray(this.middleware) ? [...this.middleware] : [this.middleware]);

    if (!innerMiddleware.length) {
      return Promise.resolve();
    }

    return Promise.resolve(innerMiddleware.shift().call(this, event))
      .then(() => this.processMiddleware(event, innerMiddleware))
    ;
  }
}

Handler.prototype.middleware = [];
Handler.prototype.resolverSchema = Joi.object({});

export default Handler;
