import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]'; // Adjust path as necessary

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
  const { id: eventListId, sharedEventListId } = req.query;

  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  if (!eventListId || !sharedEventListId || typeof eventListId !== 'string' || typeof sharedEventListId !== 'string') {
    return res.status(400).json({ message: 'EventList ID and SharedEventList ID are required' });
  }

  try {
    const listId = parseInt(eventListId);
    const shareId = parseInt(sharedEventListId);

    const eventList = await prisma.eventList.findUnique({
      where: { id: listId },
    });

    if (!eventList) {
      return res.status(404).json({ message: 'EventList not found' });
    }

    if (eventList.userId !== currentUserId) {
      return res.status(403).json({ message: 'Forbidden: You do not own this event list, so you cannot manage its shares.' });
    }

    const shareToRemove = await prisma.sharedEventList.findUnique({
      where: { id: shareId },
    });

    if (!shareToRemove) {
      return res.status(404).json({ message: 'SharedEventList record not found.' });
    }

    // Ensure the share record actually belongs to the specified event list
    if (shareToRemove.eventListId !== listId) {
        return res.status(400).json({ message: 'Shared record does not belong to the specified event list.' });
    }

    await prisma.sharedEventList.delete({
      where: { id: shareId },
    });

    return res.status(200).json({ message: 'Share removed successfully' });
  } catch (error) {
    console.error(`Error removing share ${sharedEventListId} from event list ${eventListId}:`, error);
    if (error instanceof Error && error.message.includes("Record to delete does not exist")) {
        return res.status(404).json({ message: 'SharedEventList record not found for deletion.' });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
}
