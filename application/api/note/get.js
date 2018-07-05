(client, callback) => {
  const entry = {
    name: 'Alexander',
    born: -336,
    country: 'Macedoia',
    category: 'greatPeople'
  };

  api.db.create(entry, err => {
    if (err) {
      client.res.write('Got error :(');
      api.error.log(err);
      callback(err);
      return;
    }

    delete entry.category;
    delete entry._id;
    delete entry.id;

    client.res.write(api.toJSON(entry));
    callback(null);
  });
}
