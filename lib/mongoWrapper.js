'use strict';

const { MongoClient } = require('mongodb');
const tools = require('common-toolkit');

const NOT_CONNECTED = new Error('must connect to database');
const CATEGORY_REQUIRED = new Error('entry category required');

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


const findMaxId = (db, callback) => {
  db.listCollections().toArray(
    (err, collections) => {
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

      tools.async.sequential(fns, { id: 1 }, callback);
    }
  );
};

const mongoWrapper = () => {
  let client = null;
  let db = null;
  let entryId = null;

  const methods = {
    connect: (url, callback) => MongoClient
      .connect(url, options, (err, mongoClient) => (
        client = mongoClient,
        callback(err)
      )),

    open: (dbName, callback) => {
      if (!client) {
        callback(NOT_CONNECTED);
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
        callback(CATEGORY_REQUIRED);
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

module.exports = mongoWrapper;
