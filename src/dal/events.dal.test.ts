import { Knex } from 'knex';
import { createEventDAL } from './events.dal';
import { Event } from '../entity/event';

const createMockQueryBuilder = (selectResult: any = [], firstResult: any = { total: '0' }) => {
  const chain = {
    select: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    count: jest.fn().mockReturnThis(),
    first: jest.fn().mockResolvedValue(firstResult),
    where: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
  };
  const thenable = {
    ...chain,
    then: jest.fn((onFulfilled) => Promise.resolve(selectResult).then(onFulfilled)),
  };
  return thenable;
};

describe('EventDAL', () => {
  let eventDAL: ReturnType<typeof createEventDAL>;
  let qb1: ReturnType<typeof createMockQueryBuilder>;
  let qb2: ReturnType<typeof createMockQueryBuilder>;
  let callCount: number;

  const createTestDAL = (selectResult: any = [], firstResult: any = { total: '0' }) => {
    callCount = 0;
    qb1 = createMockQueryBuilder(selectResult);
    qb2 = createMockQueryBuilder([], firstResult);
    
    const mockKnex = jest.fn((table: string) => {
      callCount++;
      if (table === 'events') {
        // First call returns qb1 (for events), second call returns qb2 (for count)
        return callCount === 1 ? qb1 : qb2;
      }
      return createMockQueryBuilder();
    }) as unknown as Knex;

    return { dal: createEventDAL(mockKnex) };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getEvents', () => {
    it('should return paginated events with correct metadata', async () => {
      const mockEvents: Event[] = [
        { id: 1, name: 'Event 1', description: 'Desc 1', date: new Date(), location: 'Loc 1', availableTickets: [], createdAt: new Date(), updatedAt: new Date() },
        { id: 2, name: 'Event 2', description: 'Desc 2', date: new Date(), location: 'Loc 2', availableTickets: [], createdAt: new Date(), updatedAt: new Date() },
      ];

      const { dal } = createTestDAL(mockEvents, { total: '50' });
      eventDAL = dal;

      const result = await eventDAL.getEvents(2, 20);

      expect(result).toEqual({
        data: mockEvents,
        total: 50,
        page: 2,
        pageSize: 20,
        totalPages: 3,
      });
      expect(qb1.limit).toHaveBeenCalledWith(20);
      expect(qb1.offset).toHaveBeenCalledWith(20);
      expect(qb1.orderBy).toHaveBeenCalledWith('createdAt', 'desc');
    });

    it('should handle empty results', async () => {
      const { dal } = createTestDAL([], { total: '0' });
      eventDAL = dal;

      const result = await eventDAL.getEvents(1, 10);

      expect(result).toEqual({
        data: [],
        total: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0,
      });
    });

    it('should calculate totalPages correctly for exact division', async () => {
      const { dal } = createTestDAL([{ id: 1 } as Event], { total: '20' });
      eventDAL = dal;

      const result = await eventDAL.getEvents(1, 10);

      expect(result.totalPages).toBe(2);
    });
  });
});