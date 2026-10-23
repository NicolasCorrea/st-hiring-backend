export interface Settings {
  _id?: string;
  siteName: string;
  maintenanceMode: boolean;
  maxTicketsPerOrder: number;
  supportEmail: string;
  createdAt: Date;
  updatedAt: Date;
}

export const defaultSettings: Omit<Settings, '_id' | 'createdAt' | 'updatedAt'> = {
  siteName: 'Eventim',
  maintenanceMode: false,
  maxTicketsPerOrder: 10,
  supportEmail: 'support@eventim.com',
};