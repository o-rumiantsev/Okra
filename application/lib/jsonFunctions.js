api.toJSON = object => JSON.stringify(object, null, 2);

api.fromJSON = jsonObject => JSON.parse(jsonObject, null, 2);
