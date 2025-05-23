import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, EventList, User, SharedEventList } from '@prisma/client';
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
  const eventListId = req.query.id as string;

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  const { email: targetUserEmail, permission } = req.body;

  if (!eventListId || !targetUserEmail || !permission) {
    return res.status(400).json({ message: 'EventList ID, target user email, and permission are required' });
  }

  if (!['VIEW_ONLY', 'EDIT'].includes(permission)) {
    return res.status(400).json({ message: 'Invalid permission value. Must be "VIEW_ONLY" or "EDIT".' });
  }

  try {
    const listId = parseInt(eventListId);

    const eventList = await prisma.eventList.findUnique({
      where: { id: listId },
    });

    if (!eventList) {
      return res.status(404).json({ message: 'EventList not found' });
    }

    if (eventList.userId !== currentUserId) {
      return res.status(403).json({ message: 'Forbidden: You do not own this event list.' });
    }

    const targetUser = await prisma.user.findUnique({
      where: { email: targetUserEmail },
    });

    if (!targetUser) {
      return res.status(404).json({ message: 'Target user not found' });
    }
    
    if (targetUser.id === currentUserId) {
        return res.status(400).json({ message: 'You cannot share a list with yourself.' });
    }

    // Check if the list is already shared with this user
    const existingShare = await prisma.sharedEventList.findUnique({
      where: {
        eventListId_userId: {
          eventListId: listId,
          userId: targetUser.id,
        },
      },
    });

    if (existingShare) {
      // Update permission if already shared
      const updatedShare = await prisma.sharedEventList.update({
        where: { id: existingShare.id },
        data: { permission },
      });
      return res.status(200).json({ message: 'Share permission updated successfully', share: updatedShare });
    }

    const newShare = await prisma.sharedEventList.create({
      data: {
        eventListId: listId,
        userId: targetUser.id,
        permission,
      },
    });

    return res.status(201).json({ message: 'EventList shared successfully', share: newShare });
  } catch (error) {
    console.error(`Error sharing event list ${eventListId}:`, error);
    // Check for specific Prisma errors if necessary, e.g., unique constraint violation
    // if (error.code === 'P2002' && error.meta?.target?.includes('eventListId_userId')) {
    //   return res.status(409).json({ message: 'EventList already shared with this user.' });
    // }
    return res.status(500).json({ message: 'Internal server error' });
  }
}
