import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, EventList, Event } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]'; // Adjust path as necessary

const prisma = new PrismaClient();

interface AuthenticatedUser {
  id: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const currentUserId = parseInt((session.user as AuthenticatedUser).id as string);
  const sourceEventListId = req.query.id as string;

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  if (!sourceEventListId) {
    return res.status(400).json({ message: 'Source EventList ID is required' });
  }

  try {
    const sourceListId = parseInt(sourceEventListId);

    const sourceEventList = await prisma.eventList.findUnique({
      where: { id: sourceListId },
      include: {
        events: true, // Need to copy these
        sharedWith: true, // To check if shared with the current user
      },
    });

    if (!sourceEventList) {
      return res.status(404).json({ message: 'Source EventList not found' });
    }

    const isOwner = sourceEventList.userId === currentUserId;
    const isSharedWithUser = sourceEventList.sharedWith.some(s => s.userId === currentUserId);
    const isPublic = sourceEventList.isPublic;

    if (!isOwner && !isSharedWithUser && !isPublic) {
      return res.status(403).json({ message: 'Forbidden: You do not have permission to fork this event list.' });
    }
    
    // Create the new forked list for the current user
    const forkedListName = `${sourceEventList.name} (Forked)`; // Or some other naming convention
    const newEventList = await prisma.eventList.create({
      data: {
        name: forkedListName,
        userId: currentUserId,
        isPublic: false, // Forked lists are private by default
        forkedFromId: sourceListId,
        // Copy events from the source list
        events: {
          create: sourceEventList.events.map(event => ({
            name: event.name,
            date: event.date,
            location: event.location,
            description: event.description,
            price: event.price,
            category: event.category,
            image: event.image,
            positionX: event.positionX,
            positionY: event.positionY,
            isPinned: event.isPinned,
            pinOrder: event.pinOrder,
            // Do not copy eventListId, it will be set to the new list's ID
          })),
        },
      },
      include: {
        events: true, // Include the newly created events in the response
      },
    });

    return res.status(201).json(newEventList);
  } catch (error) {
    console.error(`Error forking event list ${sourceEventListId}:`, error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
