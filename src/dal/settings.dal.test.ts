import { Db } from 'mongodb';
import { createSettingsDAL } from './settings.dal';
import { Settings } from '../entity/settings';

const mockCollection = {
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
};

const mockDb = {
  collection: jest.fn().mockReturnValue(mockCollection),
} as unknown as Db;

describe('SettingsDAL', () => {
  let settingsDAL: ReturnType<typeof createSettingsDAL>;

  beforeEach(() => {
    jest.clearAllMocks();
    settingsDAL = createSettingsDAL(mockDb);
  });

  describe('getSettings', () => {
    it('should return settings when found', async () => {
      const mockSettings: Settings = {
        _id: '507f1f77bcf86cd799439011',
        siteName: 'Eventim',
        maintenanceMode: false,
        maxTicketsPerOrder: 10,
        supportEmail: 'support@eventim.com',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      mockCollection.findOne.mockResolvedValueOnce(mockSettings);

      const result = await settingsDAL.getSettings();

      expect(result).toEqual(mockSettings);
      expect(mockDb.collection).toHaveBeenCalledWith('settings');
      expect(mockCollection.findOne).toHaveBeenCalledWith({});
    });

    it('should return null when no settings exist', async () => {
      mockCollection.findOne.mockResolvedValueOnce(null);

      const result = await settingsDAL.getSettings();

      expect(result).toBeNull();
    });
  });

  describe('upsertSettings', () => {
    it('should create new settings with defaults when none exist', async () => {
      const inputSettings = {
        siteName: 'Custom Eventim',
        maintenanceMode: true,
      };

      const expectedSettings: Settings = {
        _id: '507f1f77bcf86cd799439011',
        siteName: 'Custom Eventim',
        maintenanceMode: true,
        maxTicketsPerOrder: 10,
        supportEmail: 'support@eventim.com',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      };

      mockCollection.findOneAndUpdate.mockResolvedValueOnce(expectedSettings);

      const result = await settingsDAL.upsertSettings(inputSettings);

      expect(result).toEqual(expectedSettings);
      expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
        {},
        { $set: expect.objectContaining({
          siteName: 'Custom Eventim',
          maintenanceMode: true,
          maxTicketsPerOrder: 10,
          supportEmail: 'support@eventim.com',
        })},
        { upsert: true, returnDocument: 'after' }
      );
    });

    it('should update existing settings preserving createdAt', async () => {
      const existingCreatedAt = new Date('2024-01-01');
      const inputSettings = {
        siteName: 'Updated Eventim',
        createdAt: existingCreatedAt,
      };

      const expectedSettings: Settings = {
        _id: '507f1f77bcf86cd799439011',
        siteName: 'Updated Eventim',
        maintenanceMode: false,
        maxTicketsPerOrder: 10,
        supportEmail: 'support@eventim.com',
        createdAt: existingCreatedAt,
        updatedAt: expect.any(Date),
      };

      mockCollection.findOneAndUpdate.mockResolvedValueOnce(expectedSettings);

      const result = await settingsDAL.upsertSettings(inputSettings);

      expect(result).toEqual(expectedSettings);
      expect(result.createdAt).toEqual(existingCreatedAt);
    });
  });
});