'use strict';

const options = {
  useNewUrlParser: true
}

const newCursor = cursor => ({
  fetch: callback => cursor.toArray(callback)
});

const getMaxId = entries => {
  entries = entries.sort(
    (entry1, entry2) => entry2.id - entry1.id
  );

  const id = entries.length ?
    entries[0].id :
    null

  return id;
};

const findMaxId = (db, callback) => db
  .listCollections()
  .toArray((err, collections) => {
    collections = collections.map(coll => coll.name);

    const fns = collections.map(name =>
      ({ id }, callback) => db
        .collection(name)
        .find({})
        .toArray((err, entries) => {
          if (err) {
            callback(err);
          } else {
            const maxId = Math.max(id, getMaxId(entries));
            callback(null, { id: maxId });
          }
        })
    );

    api.tools.async.sequential(fns, { id: 1 }, callback);
  });

const wrapMongoClient = () => {
  let client = null;
  let db = null;
  let entryId = null;

  const methods = {
    connect: (url, callback) => api.mongodb.MongoClient
      .connect(url, options, (err, mongoClient) => (
        client = mongoClient,
        callback(err)
      )),

    open: (dbName, callback) => {
      if (!client) {
        callback(framework.ERR_NOT_CONNECTED_TO_DB);
        return;
      }

      db = client.db(dbName);

      findMaxId(db, (err, { id }) => {
        if (err) {
          callback(err);
        } else {
          entryId = ++id;
          callback(null);
        }
      });
    },

    close: () => (
      client.close(),
      client = null,
      db = null
    ),

    create: (entry, callback) => {
      const { category } = entry;

      if (!category) {
        callback(framework.ERR_CATEGORY_REQUIRED);
        return;
      }

      const collection = db.collection(category);
      Object.assign(entry, { _id: entryId, id: entryId });

      ++entryId;
      collection.insertOne(entry, err => callback(err, entry.id));
    },

    select: (mask, callback) => {
      const { category } = mask;

      if (!category) {
        callback(CATEGORY_REQUIRED);
        return;
      }

      const collection = db.collection(category);
      const cursor = collection.find(mask);
      return newCursor(cursor);
    }
  };

  return methods;
};

api.db = wrapMongoClient();
