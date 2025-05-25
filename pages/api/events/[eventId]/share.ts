import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import prisma from '../../../../lib/prisma'; // Adjusted path
import { authOptions } from '../../auth/[...nextauth]'; // Adjusted path

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user || !session.user.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const currentUserId = session.user.id;
  const { eventId } = req.query;
  const { userIdToShareWith } = req.body; // For POST and DELETE

  if (typeof eventId !== 'string') {
    return res.status(400).json({ message: 'Invalid event ID' });
  }

  // --- Check if current user is the author ---
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { authorId: true },
  });

  if (!event) {
    return res.status(404).json({ message: 'Event not found' });
  }

  if (event.authorId !== currentUserId) {
    return res.status(403).json({ message: 'Forbidden: Only the author can manage shares for this event' });
  }

  // --- Share Event with a User (POST) ---
  if (req.method === 'POST') {
    if (!userIdToShareWith || typeof userIdToShareWith !== 'string') {
      return res.status(400).json({ message: 'Missing or invalid userIdToShareWith in request body' });
    }

    if (userIdToShareWith === currentUserId) {
      return res.status(400).json({ message: 'Cannot share event with yourself' });
    }

    try {
      // Check if the user to share with exists
      const userToShare = await prisma.user.findUnique({ where: { id: userIdToShareWith } });
      if (!userToShare) {
        return res.status(404).json({ message: `User ${userIdToShareWith} not found` });
      }
      
      const existingShare = await prisma.eventShare.findUnique({
        where: {
          eventId_userId: {
            eventId: eventId,
            userId: userIdToShareWith,
          },
        },
      });

      if (existingShare) {
        return res.status(409).json({ message: 'Event already shared with this user', share: existingShare });
      }

      const newShare = await prisma.eventShare.create({
        data: {
          eventId: eventId,
          userId: userIdToShareWith,
        },
        include: {
            user: { select: { id: true, name: true, email: true, image: true }}
        }
      });

      return res.status(201).json({ message: 'Event shared successfully', share: newShare });
    } catch (error) {
      console.error(`Error sharing event ${eventId} with user ${userIdToShareWith}:`, error);
      if (error.code === 'P2002') { // Should be caught by existingShare check, but as a fallback
        return res.status(409).json({ message: 'Event already shared with this user.' });
      }
      return res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
  }
  // --- Unshare Event with a User (DELETE) ---
  else if (req.method === 'DELETE') {
    // userIdToUnshareWith should be provided in the query parameters for DELETE, or body
    const userIdToUnshareWith = req.body.userIdToUnshareWith || req.query.userIdToUnshareWith;

    if (!userIdToUnshareWith || typeof userIdToUnshareWith !== 'string') {
      return res.status(400).json({ message: 'Missing or invalid userIdToUnshareWith in request body/query' });
    }

    try {
      const shareToDelete = await prisma.eventShare.findUnique({
        where: {
          eventId_userId: {
            eventId: eventId,
            userId: userIdToUnshareWith,
          },
        },
      });

      if (!shareToDelete) {
        return res.status(404).json({ message: 'Share entry not found for this user and event' });
      }

      await prisma.eventShare.delete({
        where: {
          eventId_userId: {
            eventId: eventId,
            userId: userIdToUnshareWith,
          },
        },
      });

      return res.status(200).json({ message: 'Event unshared successfully' });
    } catch (error) {
      console.error(`Error unsharing event ${eventId} with user ${userIdToUnshareWith}:`, error);
      if (error.code === 'P2025') { // Record to delete not found
          return res.status(404).json({ message: 'Share entry not found for this user and event' });
      }
      return res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST', 'DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
