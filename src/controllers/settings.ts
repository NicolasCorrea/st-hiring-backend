import { Request, Response } from 'express';
import { SettingsDAL } from '../dal/settings.dal';
import { Settings } from '../entity/settings';

export const createSettingsController = ({
  settingsDAL,
}: {
  settingsDAL: SettingsDAL;
}) => {
  const getSettings = async (_req: Request, res: Response): Promise<void> => {
    try {
      const settings = await settingsDAL.getSettings();
      if (!settings) {
        res.status(404).json({ error: 'Settings not found' });
        return;
      }
      res.json(settings);
    } catch (error) {
      console.error('Error fetching settings:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  const upsertSettings = async (req: Request, res: Response): Promise<void> => {
    try {
      const settingsData = req.body as Partial<Settings>;
      const settings = await settingsDAL.upsertSettings(settingsData);
      res.json(settings);
    } catch (error) {
      console.error('Error updating settings:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  return {
    getSettings,
    upsertSettings,
  };
};