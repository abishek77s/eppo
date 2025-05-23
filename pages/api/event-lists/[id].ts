import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, EventList, SharedEventList } from '@prisma/client';
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

  const userId = parseInt((session.user as AuthenticatedUser).id as string);
  const listId = req.query.id as string;

  if (!listId) {
    return res.status(400).json({ message: 'EventList ID is required' });
  }

  let eventList: (EventList & { sharedWith: SharedEventList[], events: Event[], user: { name: string | null, email: string } }) | null;

  try {
    eventList = await prisma.eventList.findUnique({
      where: { id: parseInt(listId) },
      include: {
        events: true, // Include events associated with the list
        sharedWith: true, // Include who it's shared with for permission checks
        user: { select: { name: true, email: true } }, // Include owner info
      },
    });

    if (!eventList) {
      return res.status(404).json({ message: 'EventList not found' });
    }

    const isOwner = eventList.userId === userId;
    const isSharedWithUser = eventList.sharedWith.some(s => s.userId === userId);
    const isPublic = eventList.isPublic;

    // Check permissions for GET request
    if (req.method === 'GET') {
      if (!isOwner && !isSharedWithUser && !isPublic) {
        return res.status(403).json({ message: 'Forbidden: You do not have permission to view this event list.' });
      }
      return res.status(200).json(eventList);
    }

    // For PUT and DELETE, user must be the owner
    if (req.method === 'PUT' || req.method === 'DELETE') {
      if (!isOwner) {
        return res.status(403).json({ message: 'Forbidden: You must be the owner to modify or delete this event list.' });
      }
    }

    switch (req.method) {
      case 'PUT':
        const { name, isPublic } = req.body;
        if (name === undefined && isPublic === undefined) {
          return res.status(400).json({ message: 'Name or isPublic must be provided for update.' });
        }
        const updatedEventList = await prisma.eventList.update({
          where: { id: parseInt(listId) },
          data: {
            name: name !== undefined ? name : eventList.name,
            isPublic: isPublic !== undefined ? Boolean(isPublic) : eventList.isPublic,
          },
          include: { events: true, sharedWith: true, user: { select: { name: true, email: true }} },
        });
        return res.status(200).json(updatedEventList);

      case 'DELETE':
        // The Prisma schema should define cascade behavior for events.
        // If not, manual deletion of associated records (events, sharedEventList) might be needed.
        // Assuming cascade delete is set up in Prisma schema for events and sharedEventList.
        await prisma.sharedEventList.deleteMany({
            where: { eventListId: parseInt(listId)}
        });
        await prisma.event.deleteMany({
            where: { eventListId: parseInt(listId)}
        });
        await prisma.eventList.delete({
          where: { id: parseInt(listId) },
        });
        return res.status(200).json({ message: 'EventList deleted successfully' });

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error(`Error handling event list ${listId}:`, error);
     if (error instanceof Error && (error.message.includes("Record to update not found") || error.message.includes("Record to delete does not exist"))) {
        return res.status(404).json({ message: 'EventList not found' });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
}
