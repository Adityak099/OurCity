import mongoose from "mongoose";

const globalForMongoose = globalThis;

if (!globalForMongoose.ourcityMongooseCache) {
  globalForMongoose.ourcityMongooseCache = {
    connection: null,
    promise: null,
  };
}

const cache = globalForMongoose.ourcityMongooseCache;

export async function connectToDatabase() {
  if (cache.connection) return cache.connection;

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is not configured.");
  }

  if (!cache.promise) {
    const uriIncludesDatabase = /^mongodb(?:\+srv)?:\/\/[^/]+\/[^/?]+/i.test(
      uri,
    );
    const dbName = process.env.MONGODB_DB || (uriIncludesDatabase ? undefined : "ourcity");

    cache.promise = mongoose
      .connect(uri, dbName ? { dbName } : {})
      .then((connection) => connection)
      .catch((error) => {
        cache.promise = null;
        throw error;
      });
  }

  cache.connection = await cache.promise;

  return cache.connection;
}
