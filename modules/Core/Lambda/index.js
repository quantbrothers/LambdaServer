import Lib from '../Lib';
import CustomError from '../CustomError';

const AWS = Lib.getConfiguredAWS();
const lambda = new AWS.Lambda();

export default class Lambda {
  static invoke(functionName, environment, payload = {}, invocationType = 'RequestResponse') {
    const params = {
      FunctionName: functionName.replace('{env}', environment),
      Payload: JSON.stringify(payload),
      InvocationType: invocationType,
    };

    return lambda.invoke(params).promise().then((data) => {
      if (invocationType === 'RequestResponse') {
        const response = JSON.parse(data.Payload);

        if (response.Error) {
          throw new CustomError(response.Error.Id, response.Error.Message);
        } else if (response.errorMessage) {
          throw new Error(response.errorMessage);
        }

        return response.Response;
      }

      return data.StatusCode;
    });
  }
}
