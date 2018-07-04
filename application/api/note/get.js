(req, res) => {
  const entry = {
    name: 'Alexander',
    born: -336,
    country: 'Macedoia',
    category: 'greatPeople'
  };

  api.db.create(entry, err => {
    if (err) {
      api.console.error(err);
      res.write('Got error :(');
      res.end();
      return;
    }

    delete entry.category;
    delete entry._id;
    delete entry.id;

    res.write(api.toJSON(entry));
    res.end()
  });
}
