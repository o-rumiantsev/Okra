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

      if (!great) {
        rew.write('Ooops, freat people not found :(');
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
