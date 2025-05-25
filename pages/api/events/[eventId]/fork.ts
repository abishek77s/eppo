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

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const currentUserId = session.user.id;
  const { eventId: originalEventId } = req.query;

  if (typeof originalEventId !== 'string') {
    return res.status(400).json({ message: 'Invalid original event ID' });
  }

  try {
    // --- Fetch the original event ---
    const originalEvent = await prisma.event.findUnique({
      where: { id: originalEventId },
      include: {
        shares: { // To check if it's shared with the current user
          where: { userId: currentUserId }
        }
      }
    });

    if (!originalEvent) {
      return res.status(404).json({ message: 'Original event not found' });
    }

    // --- Check fork permissions ---
    const canFork = originalEvent.isPublic || originalEvent.shares.length > 0;

    if (!canFork && originalEvent.authorId !== currentUserId) { // Authors can always fork their own events
        return res.status(403).json({ message: 'Forbidden: You do not have permission to fork this event. Event must be public or shared with you.' });
    }
    
    if (originalEvent.authorId === currentUserId) {
        // Optional: Decide if author forking their own event should be a "duplicate" or true "fork"
        // For now, allow it as a fork.
    }

    // --- Create the new forked event ---
    const {
      // Exclude fields that should not be copied directly or will be reset
      id,
      authorId,
      // shares, // Do not copy shares
      // forks, // Do not copy existing forks list from original
      // forkedFromId, // This will be set to originalEventId
      // forkedFrom,
      createdAt,
      updatedAt,
      isPublic, // Forked event starts as private by default
      ...copyableDetails // Rest of the event details
    } = originalEvent;

    const forkedEvent = await prisma.event.create({
      data: {
        ...copyableDetails, // name, date, location, description, category, image, price
        authorId: currentUserId,
        forkedFromId: originalEventId,
        isPublic: false, // New forks are private by default
        // shares are empty for the new fork
      },
      include: {
        author: { select: { id: true, name: true, email: true, image: true } },
        forkedFrom: { select: { id: true, name: true, author: {select: {id: true, name: true}} } }
      }
    });

    return res.status(201).json({ message: 'Event forked successfully', event: forkedEvent });

  } catch (error) {
    console.error(`Error forking event ${originalEventId}:`, error);
    // Check for specific Prisma errors if needed
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}
