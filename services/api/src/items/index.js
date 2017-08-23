import Joi from 'joi';
import { v4 as uuid } from 'uuid';

import Handler from '../../../../modules/Core/Handler';
import { ToDosModel } from '../../../../modules/Logic/DynamoDBModels';

class Items extends Handler {
  execute(resolved) {
    const toDo = {
      Id: uuid(),
      UserId: '23d57d92-4070-4b05-8004-642bcc9b5126',
      Data: resolved,
      CreatedAt: Date.now(),
    };

    return ToDosModel.createAsync(toDo).then(() => resolved.items.ordering);
  }
}

Items.prototype.resolverSchema = Joi.object({
  items: Joi.object({
    items: Joi.array().required(),
    ordering: Joi.array().required(),
  }).required(),
  settings: Joi.object().required(),
});

export default Items;
