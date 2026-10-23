import { Request, Response } from 'express';
import { createSettingsController } from './settings';
import { SettingsDAL } from '../dal/settings.dal';
import { Settings } from '../entity/settings';

const mockSettingsDAL: jest.Mocked<Partial<SettingsDAL>> = {
  getSettings: jest.fn(),
  upsertSettings: jest.fn(),
};

const mockReq = {
  body: {},
} as unknown as Request;

const mockRes = {
  json: jest.fn(),
  status: jest.fn().mockReturnThis(),
} as unknown as Response;

describe('SettingsController', () => {
  let controller: ReturnType<typeof createSettingsController>;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = createSettingsController({
      settingsDAL: mockSettingsDAL as SettingsDAL,
    });
    mockReq.body = {};
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

      mockSettingsDAL.getSettings.mockResolvedValueOnce(mockSettings);

      await controller.getSettings(mockReq, mockRes);

      expect(mockSettingsDAL.getSettings).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(mockSettings);
    });

    it('should return 404 when settings not found', async () => {
      mockSettingsDAL.getSettings.mockResolvedValueOnce(null);

      await controller.getSettings(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Settings not found' });
    });

    it('should return 500 on error', async () => {
      mockSettingsDAL.getSettings.mockRejectedValueOnce(new Error('DB error'));

      await controller.getSettings(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });

  describe('upsertSettings', () => {
    it('should create or update settings and return them', async () => {
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
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      mockSettingsDAL.upsertSettings.mockResolvedValueOnce(expectedSettings);
      mockReq.body = inputSettings;

      await controller.upsertSettings(mockReq, mockRes);

      expect(mockSettingsDAL.upsertSettings).toHaveBeenCalledWith(inputSettings);
      expect(mockRes.json).toHaveBeenCalledWith(expectedSettings);
    });

    it('should return 500 on error', async () => {
      mockSettingsDAL.upsertSettings.mockRejectedValueOnce(new Error('DB error'));
      mockReq.body = { siteName: 'Test' };

      await controller.upsertSettings(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });
});