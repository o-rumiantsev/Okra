const scheme = {
  name: 'VARCHAR(255)',
  born: 'INT',
  country: 'VARCHAR(255)',
  category: 'greatPeople',
  safe: true
};

api.db.createTable(scheme, err => {
  if (err) {
    api.log.error(err);
  } else {
    api.log.info(`Table ${scheme.category} createad`);
  }
});
