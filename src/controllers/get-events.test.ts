import { Request, Response } from 'express';
import { createGetEventsController } from './get-events';
import { EventDAL, PaginatedResult } from '../dal/events.dal';
import { TicketsDAL } from '../dal/tickets.dal';
import { Event } from '../entity/event';
import { Ticket } from '../entity/ticket';

const mockEventDAL: jest.Mocked<Partial<EventDAL>> = {
  getEvents: jest.fn(),
};

const mockTicketDAL: jest.Mocked<Partial<TicketsDAL>> = {
  getTicketsByEvent: jest.fn(),
};

const mockReq = {
  query: {},
} as unknown as Request;

const mockRes = {
  json: jest.fn(),
  status: jest.fn().mockReturnThis(),
} as unknown as Response;

describe('GetEventsController', () => {
  let controller: ReturnType<typeof createGetEventsController>;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = createGetEventsController({
      eventsDAL: mockEventDAL as EventDAL,
      ticketsDAL: mockTicketDAL as TicketsDAL,
    });
    mockReq.query = {};
  });

  it('should return paginated events with available tickets', async () => {
    const mockEvents: Event[] = [
      { id: 1, name: 'Event 1', description: 'Desc 1', date: new Date(), location: 'Loc 1', availableTickets: [], createdAt: new Date(), updatedAt: new Date() },
      { id: 2, name: 'Event 2', description: 'Desc 2', date: new Date(), location: 'Loc 2', availableTickets: [], createdAt: new Date(), updatedAt: new Date() },
    ];

    const mockTickets: Ticket[] = [
      { id: 1, eventId: 1, type: 'general', status: 'available', price: 1000, createdAt: new Date(), updatedAt: new Date() },
      { id: 2, eventId: 1, type: 'general', status: 'sold', price: 1000, createdAt: new Date(), updatedAt: new Date() },
      { id: 3, eventId: 2, type: 'vip', status: 'available', price: 2000, createdAt: new Date(), updatedAt: new Date() },
    ];

    const paginatedResult: PaginatedResult<Event> = {
      data: mockEvents,
      total: 50,
      page: 1,
      pageSize: 20,
      totalPages: 3,
    };

    mockEventDAL.getEvents.mockResolvedValueOnce(paginatedResult);
    mockTicketDAL.getTicketsByEvent.mockResolvedValueOnce([mockTickets[0], mockTickets[1]]);
    mockTicketDAL.getTicketsByEvent.mockResolvedValueOnce([mockTickets[2]]);

    await controller(mockReq, mockRes);

    expect(mockEventDAL.getEvents).toHaveBeenCalledWith(1, 20);
    expect(mockTicketDAL.getTicketsByEvent).toHaveBeenCalledTimes(2);
    expect(mockRes.json).toHaveBeenCalledWith({
      data: [
        { ...mockEvents[0], availableTickets: [mockTickets[0], mockTickets[1]] },
        { ...mockEvents[1], availableTickets: [mockTickets[2]] },
      ],
      total: 50,
      page: 1,
      pageSize: 20,
      totalPages: 3,
    });
  });

  it('should use default page and pageSize when not provided', async () => {
    const paginatedResult: PaginatedResult<Event> = {
      data: [],
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0,
    };

    mockEventDAL.getEvents.mockResolvedValueOnce(paginatedResult);

    await controller(mockReq, mockRes);

    expect(mockEventDAL.getEvents).toHaveBeenCalledWith(1, 20);
  });

  it('should parse page and pageSize from query params', async () => {
    mockReq.query = { page: '3', pageSize: '10' };
    const paginatedResult: PaginatedResult<Event> = {
      data: [],
      total: 0,
      page: 3,
      pageSize: 10,
      totalPages: 0,
    };

    mockEventDAL.getEvents.mockResolvedValueOnce(paginatedResult);

    await controller(mockReq, mockRes);

    expect(mockEventDAL.getEvents).toHaveBeenCalledWith(3, 10);
  });

  it('should clamp page to minimum 1', async () => {
    mockReq.query = { page: '0', pageSize: '20' };
    const paginatedResult: PaginatedResult<Event> = {
      data: [],
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0,
    };

    mockEventDAL.getEvents.mockResolvedValueOnce(paginatedResult);

    await controller(mockReq, mockRes);

    expect(mockEventDAL.getEvents).toHaveBeenCalledWith(1, 20);
  });

  it('should clamp pageSize to maximum 100', async () => {
    mockReq.query = { page: '1', pageSize: '200' };
    const paginatedResult: PaginatedResult<Event> = {
      data: [],
      total: 0,
      page: 1,
      pageSize: 100,
      totalPages: 0,
    };

    mockEventDAL.getEvents.mockResolvedValueOnce(paginatedResult);

    await controller(mockReq, mockRes);

    expect(mockEventDAL.getEvents).toHaveBeenCalledWith(1, 100);
  });
});