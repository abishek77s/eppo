import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, EventList, Event } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]'; // Adjust path as necessary

const prisma = new PrismaClient();

interface AuthenticatedUser {
  id: string; // or number, depending on your User model's ID type
  // include other user properties if needed, like name or email
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Type assertion for session.user.id based on your User model
  const userId = (session.user as AuthenticatedUser).id as string; // Or number if your ID is a number

  if (req.method === 'POST') {
    // Create a new event
    const { name, date, location, description, price, category, image, eventListId, positionX, positionY, isPinned, pinOrder } = req.body;

    if (!name || !eventListId) {
      return res.status(400).json({ message: 'Name and eventListId are required' });
    }

    try {
      const eventList = await prisma.eventList.findUnique({
        where: { id: parseInt(eventListId as string) },
        include: { sharedWith: true },
      });

      if (!eventList) {
        return res.status(404).json({ message: 'EventList not found' });
      }

      const isOwner = eventList.userId === parseInt(userId);
      const canEdit = eventList.sharedWith.some(s => s.userId === parseInt(userId) && s.permission === 'EDIT');

      if (!isOwner && !canEdit) {
        return res.status(403).json({ message: 'Forbidden: You do not have permission to add events to this list.' });
      }

      const newEvent = await prisma.event.create({
        data: {
          name,
          date,
          location,
          description,
          price,
          category,
          image,
          eventListId: parseInt(eventListId as string),
          positionX: positionX ? parseFloat(positionX as string) : null,
          positionY: positionY ? parseFloat(positionY as string) : null,
          isPinned: isPinned !== undefined ? Boolean(isPinned) : false,
          pinOrder: pinOrder ? parseInt(pinOrder as string) : null,
        },
      });
      return res.status(201).json(newEvent);
    } catch (error) {
      console.error('Create event error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  } else if (req.method === 'GET') {
    // Fetch all events for a given eventListId
    const { eventListId } = req.query;

    if (!eventListId || typeof eventListId !== 'string') {
      return res.status(400).json({ message: 'eventListId query parameter is required' });
    }

    try {
      const listId = parseInt(eventListId as string);
      const eventList = await prisma.eventList.findUnique({
        where: { id: listId },
        include: { sharedWith: true, user: true }, // Include user to check ownership
      });

      if (!eventList) {
        return res.status(404).json({ message: 'EventList not found' });
      }

      const isOwner = eventList.userId === parseInt(userId);
      const isSharedWithUser = eventList.sharedWith.some(s => s.userId === parseInt(userId));
      const isPublic = eventList.isPublic;


      if (!isOwner && !isSharedWithUser && !isPublic) {
        return res.status(403).json({ message: 'Forbidden: You do not have permission to view this event list.' });
      }

      const events = await prisma.event.findMany({
        where: { eventListId: listId },
        orderBy: { createdAt: 'asc' }, // Optional: order events
      });
      return res.status(200).json(events);
    } catch (error) {
      console.error('Fetch events error:', error);
      if (error instanceof Error && error.message.includes("Argument `id` is missing")) {
        return res.status(404).json({ message: 'EventList not found or invalid ID.' });
      }
      return res.status(500).json({ message: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['POST', 'GET']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}
