import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

import { User } from '../models/User';
import { Session } from '../models/Session';
import { Aggregate } from '../models/Aggregate';
import { Waitlist } from '../models/Waitlist';

let mongo: MongoMemoryServer;

describe('Models CRUD', () => {
  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();
    await mongoose.connect(uri, { autoIndex: true });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongo) await mongo.stop();
  });

  afterEach(async () => {
    const collections = await mongoose.connection.db.listCollections().toArray();
    for (const c of collections) {
      await mongoose.connection.db.collection(c.name).deleteMany({});
    }
  });

  it('creates and queries a User; enforces unique email', async () => {
    const u = await User.create({
      name: 'Test',
      email: 'TEST@example.com',
      passwordHash: 'hash',
    });
    expect(u.email).toBe('test@example.com');
    await expect(
      User.create({ name: 'Dup', email: 'test@example.com', passwordHash: 'hash2' })
    ).rejects.toThrow();
  });

  it('creates Session and Aggregate linked to user', async () => {
    const u = await User.create({
      name: 'Test',
      email: 'user@example.com',
      passwordHash: 'hash',
    });
    const s = await Session.create({
      userId: u._id,
      mode: 'partner',
      startedAt: new Date(),
      config: { goals: ['control'] },
    });
    expect(s.userId.toString()).toBe(u._id.toString());
    const a = await Aggregate.create({
      sessionId: s._id,
      userId: u._id,
      metrics: { controlPct: 0.7 },
    });
    expect(a.metrics.controlPct).toBe(0.7);
    await expect(
      Aggregate.create({ sessionId: s._id, userId: u._id, metrics: {} })
    ).rejects.toThrow(); // unique sessionId
  });

  it('creates waitlist entry with unique email', async () => {
    await Waitlist.create({ email: 'foo@example.com' });
    await expect(Waitlist.create({ email: 'FOO@example.com' })).rejects.toThrow();
  });
});
