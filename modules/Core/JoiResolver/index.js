import _ from 'lodash';
import Promise from 'bluebird';
import Joi from 'joi';

import ErrorsMapping from './ErrorsMapping.json';
import CustomError from '../CustomError';
import Logger from '../Logger';

const innerValidate = Promise.promisify(Joi.validate);

export default class Resolver {
  constructor(schema, logger = new Logger()) {
    this.schema = Joi.compile(schema);
    this.logger = logger;
  }

  resolve(data) {
    return Resolver.validateData(data, this.schema, this.logger);
  }

  static validate(...args) {
    return innerValidate(...args);
  }

  static getCommonValidators() {
    const identityIdValidator = Joi.string().trim().lowercase().regex(Resolver.RegularExpressions.IdentityId);
    const timestampValidator = Joi.number().min(0).integer();
    const accountTypeValidator = Joi.string().valid('email', 'facebook').trim();

    return {
      IdentityId: identityIdValidator,
      Timestamp: timestampValidator,
      AccountType: accountTypeValidator,
    };
  }

  static validateData(data, schema, logger = new Logger(), customErrorType = null) {
    return Promise.resolve()
      .then(() => {
        if (!_.size(_.keys(data))) {
          throw new CustomError('resolverEmptyData');
        }
      })
      .then(() => Resolver.validate(data, schema, { stripUnknown: true, abortEarly: true }))
      .catch(error => Resolver.throwValidationError(error, logger, customErrorType))
    ;
  }

  static throwValidationError(error, logger, customErrorType = null) {
    logger.log('error', error);
    logger.log(error.details);

    const errorDetails = error.details[0] || error;
    const errorType = customErrorType || ErrorsMapping[errorDetails.type];

    throw new CustomError(errorType, `${errorDetails.message}`);
  }
}

Resolver.RegularExpressions = {
  IdentityId: /^(?:\w+-\w+-\d+):[\dabcdef]{8}-[\dabcdef]{4}-4[\dabcdef]{3}-[\dabcdef]{4}-[\dabcdef]{12}$/,
};
