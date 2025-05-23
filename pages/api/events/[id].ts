import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, Event } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]'; // Adjust path as necessary

const prisma = new PrismaClient();

interface AuthenticatedUser {
  id: string; // or number, depending on your User model's ID type
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const userId = (session.user as AuthenticatedUser).id as string; // Or number if your ID is a number
  const eventId = req.query.id as string;

  if (!eventId) {
    return res.status(400).json({ message: 'Event ID is required' });
  }

  let event: Event & { eventList: { userId: number, isPublic: boolean, sharedWith: { userId: number, permission: string }[] } } | null;

  try {
    event = await prisma.event.findUnique({
      where: { id: parseInt(eventId) },
      include: {
        eventList: {
          include: {
            sharedWith: true,
          },
        },
      },
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const eventList = event.eventList;
    const isOwner = eventList.userId === parseInt(userId);
    const canView = eventList.isPublic || eventList.sharedWith.some(s => s.userId === parseInt(userId));
    const canEdit = isOwner || eventList.sharedWith.some(s => s.userId === parseInt(userId) && s.permission === 'EDIT');

    // Check permissions for GET request
    if (req.method === 'GET') {
      if (!isOwner && !canView) {
        return res.status(403).json({ message: 'Forbidden: You do not have permission to view this event.' });
      }
      const { eventList: _, ...eventData } = event; // Exclude full eventList details unless specifically needed
      return res.status(200).json(eventData);
    }

    // Check permissions for PUT and DELETE requests
    if (req.method === 'PUT' || req.method === 'DELETE') {
      if (!canEdit) {
        return res.status(403).json({ message: 'Forbidden: You do not have permission to modify this event.' });
      }
    }

    switch (req.method) {
      case 'PUT':
        const { name, date, location, description, price, category, image, positionX, positionY, isPinned, pinOrder } = req.body;
        const updatedEvent = await prisma.event.update({
          where: { id: parseInt(eventId) },
          data: {
            name,
            date,
            location,
            description,
            price,
            category,
            image,
            // eventListId should not change here, it's an update of the event itself
            positionX: positionX !== undefined ? parseFloat(positionX as string) : event.positionX,
            positionY: positionY !== undefined ? parseFloat(positionY as string) : event.positionY,
            isPinned: isPinned !== undefined ? Boolean(isPinned) : event.isPinned,
            pinOrder: pinOrder !== undefined ? parseInt(pinOrder as string) : event.pinOrder,
          },
        });
        return res.status(200).json(updatedEvent);

      case 'DELETE':
        await prisma.event.delete({
          where: { id: parseInt(eventId) },
        });
        return res.status(200).json({ message: 'Event deleted successfully' });

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error(`Error handling event ${eventId}:`, error);
    if (error instanceof Error && error.message.includes("Record to update not found")) {
        return res.status(404).json({ message: 'Event not found' });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
}
