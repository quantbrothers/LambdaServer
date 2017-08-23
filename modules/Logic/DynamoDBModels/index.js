import Promise from 'bluebird';
import vogels from 'dynogels';
import Joi from 'joi';

import Lib from '../../Core/Lib';

const AWS = Lib.getConfiguredAWS();

Promise.promisifyAll(require('dynogels/lib/table').prototype);
Promise.promisifyAll(require('dynogels/lib/item').prototype);
Promise.promisifyAll(require('dynogels/lib/query').prototype);
Promise.promisifyAll(require('dynogels/lib/scan').prototype);
Promise.promisifyAll(require('dynogels/lib/parallelScan').prototype);

vogels.dynamoDriver(new AWS.DynamoDB());

export const ToDosModel = Promise.promisifyAll(
  vogels.define('ToDosModel', {
    hashKey: 'Id',
    tableName: 'ToDos',
    schema: {
      Id: Joi.string().uuid().required(),
      UserId: Joi.string().uuid().required(),
      Data: Joi.object().required(),
      CreatedAt: Joi.number().integer().positive().required(),
    },
    indexes: [{
      hashKey: 'UserId',
      rangeKey: 'CreatedAt',
      name: 'ToDos-UserId-CreatedAt-global-index',
      type: 'global',
    }],
  })
);
