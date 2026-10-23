import { EventDAL, PaginatedResult } from '../dal/events.dal';
import { Request, Response } from 'express';
import { TicketsDAL } from '../dal/tickets.dal';
import { Ticket } from '../entity/ticket';

export interface EventWithTickets {
  id: number;
  name: string;
  description: string;
  date: Date;
  location: string;
  availableTickets: Ticket[];
  createdAt: Date;
  updatedAt: Date;
}

export const createGetEventsController = ({
  eventsDAL,
  ticketsDAL,
}: {
  eventsDAL: EventDAL;
  ticketsDAL: TicketsDAL;
}) => async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));

  const result = await eventsDAL.getEvents(page, pageSize);

  const eventsWithTickets = await Promise.all(
    result.data.map(async (event) => {
      const tickets = await ticketsDAL.getTicketsByEvent(event.id);
      return {
        ...event,
        availableTickets: tickets,
      };
    })
  );

  const response: PaginatedResult<EventWithTickets> = {
    ...result,
    data: eventsWithTickets,
  };

  res.json(response);
};