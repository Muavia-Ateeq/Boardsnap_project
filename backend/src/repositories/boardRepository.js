import { MongoClient } from 'mongodb';

export function createMemoryBoardRepository() {
  const boards = new Map();
  return {
    async create(board) {
      boards.set(board.id, structuredClone(board));
      return board;
    },
    async get(id) {
      const board = boards.get(id);
      return board ? structuredClone(board) : null;
    },
    async update(id, changes) {
      const board = boards.get(id);
      if (!board) return null;
      const updated = { ...board, ...structuredClone(changes) };
      boards.set(id, updated);
      return structuredClone(updated);
    },
    async close() {},
  };
}

export async function createBoardRepository(settings) {
  if (!settings.mongodbUri) {
    console.warn('[BoardSnap] MONGODB_URI is unset; boards will not persist after restart.');
    return createMemoryBoardRepository();
  }

  const client = new MongoClient(settings.mongodbUri, {
    serverSelectionTimeoutMS: 5000,
  });
  await client.connect();
  const collection = client.db(settings.mongodbDatabase).collection('boards');
  await collection.createIndex({ id: 1 }, { unique: true });

  return {
    async create(board) {
      await collection.insertOne(board);
      return board;
    },
    async get(id) {
      const board = await collection.findOne({ id }, { projection: { _id: 0 } });
      return board || null;
    },
    async update(id, changes) {
      const result = await collection.findOneAndUpdate(
        { id },
        { $set: changes },
        { returnDocument: 'after', projection: { _id: 0 } },
      );
      return result || null;
    },
    async close() {
      await client.close();
    },
  };
}
