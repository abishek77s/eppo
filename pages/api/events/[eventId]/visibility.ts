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
  
  if (req.method !== 'PUT') {
    res.setHeader('Allow', ['PUT']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  if (typeof eventId !== 'string') {
    return res.status(400).json({ message: 'Invalid event ID' });
  }

  const { isPublic } = req.body;

  if (typeof isPublic !== 'boolean') {
    return res.status(400).json({ message: 'Missing or invalid isPublic flag in request body (must be true or false)' });
  }

  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { authorId: true },
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.authorId !== currentUserId) {
      return res.status(403).json({ message: 'Forbidden: Only the author can change the event visibility' });
    }

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: { isPublic: isPublic },
      include: {
        author: { select: { id: true, name: true, email: true, image: true } },
        shares: {
            include: {
                user: { select: { id: true, name: true, email: true, image: true } }
            }
        }
      }
    });

    return res.status(200).json({ message: `Event visibility updated to ${isPublic ? 'public' : 'private'}`, event: updatedEvent });
  } catch (error) {
    console.error(`Error updating visibility for event ${eventId}:`, error);
    if (error.code === 'P2025') { // Record to update not found
        return res.status(404).json({ message: 'Event not found' });
    }
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}
