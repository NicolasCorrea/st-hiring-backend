import { Knex } from 'knex';
import { Event } from '../entity/event';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface CountResult {
  total: string | number;
}

export interface EventDAL {
  getEvents(page: number, pageSize: number): Promise<PaginatedResult<Event>>;
}

export const createEventDAL = (knex: Knex): EventDAL => {
  return {
    async getEvents(page: number, pageSize: number): Promise<PaginatedResult<Event>> {
      const offset = (page - 1) * pageSize;

      const [events, totalResult] = await Promise.all([
        knex<Event>('events').select('*').limit(pageSize).offset(offset).orderBy('createdAt', 'desc'),
        knex<Event>('events').count('* as total').first<CountResult>(),
      ]);

      const total = Number(totalResult?.total ?? 0);
      const totalPages = Math.ceil(total / pageSize);

      return {
        data: events,
        total,
        page,
        pageSize,
        totalPages,
      };
    },
  };
};