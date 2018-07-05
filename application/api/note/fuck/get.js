(client, callback) => {
  api.db
    .select({ category: 'greatPeople' })
    .fetch((err, [great]) => {
      if (err) {
        client.res.write('Got error :(');
        api.error.log(err);
        callback(err);
        return;
      }

      if (!great) {
        client.res.write('Ooops, freat people not found :(');
        callback(null);
        return;
      }

      delete great.category;
      delete great._id;
      delete great.id;

      client.res.write(api.toJSON(great));
      callback(null);
    });
}
