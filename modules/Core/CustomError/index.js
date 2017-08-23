import _ from 'lodash';

import innerErrors from './innerErrors.json';
import outerErrors from './outerErrors.json';

const UnknownError = {
  code: 'Unknown',
  codeNumber: 500,
  message: 'Error not found!',
};

if (_.intersection(Object.keys(innerErrors), Object.keys(outerErrors)).length > 0) {
  throw new Error('There is an intersection between outer and inner errors!');
}

export default class CustomError extends Error {
  constructor(errorId, message = null) {
    super(errorId);

    const type = innerErrors[errorId] ? 'inner' : 'outer';
    const errorInfo = innerErrors[errorId] || outerErrors[errorId] || UnknownError;

    this.Id = errorId;
    this.Type = `${type}`;
    this.Code = `${errorInfo.code}`;
    this.CodeNumber = `${errorInfo.codeNumber}`;
    this.Message = `${message || errorInfo.message}`;
  }
}
