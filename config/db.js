const mongoose = require('mongoose');

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = {
    conn: null,
    promise: null,
  };
}

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error('MONGO_URI is not set');
  }

  // Already connected
  if (cached.conn) {
    return cached.conn;
  }

  // Connection already in progress
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(uri)
      .then((mongooseInstance) => {
        console.log(
          `MongoDB connected: ${mongooseInstance.connection.host}/${mongooseInstance.connection.name}`
        );

        return mongooseInstance;
      })
      .catch((error) => {
        cached.promise = null;
        console.error('MongoDB connection error:', error.message);
        throw error;
      });
  }

  cached.conn = await cached.promise;

  return cached.conn;
};

module.exports = connectDB;