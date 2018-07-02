(req, res) => {
  api.db
    .select({ category: 'greatPeople' })
    .fetch((err, [great]) => {
      if (err) {
        api.console.error(err);
        res.write('Got error :(');
        res.end();
        return;
      }

      delete great.category;
      delete great._id;
      delete great.id;

      res.write(api.toJSON(great));
      res.end();
    });
}
