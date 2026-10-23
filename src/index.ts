import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { knex } from 'knex';
import { MongoClient, Db } from 'mongodb';
import dbConfig from './knexfile';
import { createEventDAL } from './dal/events.dal';
import { createTicketDAL } from './dal/tickets.dal';
import { createSettingsDAL } from './dal/settings.dal';
import { createGetEventsController } from './controllers/get-events';
import { createSettingsController } from './controllers/settings';

const Knex = knex(dbConfig.development);

const eventDAL = createEventDAL(Knex);
const ticketDAL = createTicketDAL(Knex);

const mongoUri = process.env.MONGO_URI ?? 'mongodb://root:example@localhost:27017';
const mongoClient = new MongoClient(mongoUri);
let mongoDb: Db;

async function connectMongo(): Promise<Db> {
  await mongoClient.connect();
  const db = mongoClient.db();
  console.log('Connected to MongoDB');
  return db;
}

const app = express();

app.use(cors());
app.use(express.json());

app.use('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/events', createGetEventsController({ eventsDAL: eventDAL, ticketsDAL: ticketDAL }));

async function startServer() {
  try {
    mongoDb = await connectMongo();
    const settingsDAL = createSettingsDAL(mongoDb);
    const settingsController = createSettingsController({ settingsDAL });

    app.get('/settings', settingsController.getSettings);
    app.post('/settings', settingsController.upsertSettings);

    app.use('/', (_req, res) => {
      res.json({ message: 'Hello API' });
    });

    app.listen(3000, () => {
      console.log('Server Started on port 3000');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  await mongoClient.close();
  await Knex.destroy();
  process.exit(0);
});

startServer();