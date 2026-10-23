import { Db, Collection } from 'mongodb';
import { Settings, defaultSettings } from '../entity/settings';

export interface SettingsDAL {
  getSettings(): Promise<Settings | null>;
  upsertSettings(settings: Partial<Settings>): Promise<Settings>;
}

const COLLECTION_NAME = 'settings';

export const createSettingsDAL = (db: Db): SettingsDAL => {
  const collection: Collection<Settings> = db.collection(COLLECTION_NAME);

  return {
    async getSettings(): Promise<Settings | null> {
      const settings = await collection.findOne({});
      return settings;
    },

    async upsertSettings(settings: Partial<Settings>): Promise<Settings> {
      const now = new Date();
      const settingsToSave: Settings = {
        ...defaultSettings,
        ...settings,
        updatedAt: now,
        createdAt: settings.createdAt ?? now,
      };

      const { _id, ...settingsWithoutId } = settingsToSave;

      const result = await collection.findOneAndUpdate(
        {},
        { $set: settingsWithoutId },
        { upsert: true, returnDocument: 'after' }
      );

      if (!result) {
        throw new Error('Failed to upsert settings');
      }

      return result;
    },
  };
};