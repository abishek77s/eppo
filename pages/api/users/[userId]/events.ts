import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import prisma from '../../../../lib/prisma'; // Adjusted path
import { authOptions } from '../../auth/[...nextauth]'; // Adjusted path

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);
  // Session is optional for this route if we only want to show public events of a user
  // However, to show events shared by that user with the current user, session is needed.

  const { userId: targetUserId } = req.query;

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  if (typeof targetUserId !== 'string') {
    return res.status(400).json({ message: 'Invalid target user ID' });
  }

  try {
    const whereClause: any = {
      authorId: targetUserId,
      OR: [
        { isPublic: true }, // Public events by the target user
      ],
    };

    // If there's an authenticated session, also include events shared by targetUser with sessionUser
    if (session && session.user && session.user.id) {
      const sessionUserId = session.user.id;
      if (targetUserId !== sessionUserId) { // Avoid redundant check if viewing own profile events via this route
        whereClause.OR.push({
          // Events authored by targetUserId AND shared with sessionUserId
          AND: [
            { authorId: targetUserId }, 
            {
              shares: {
                some: {
                  userId: sessionUserId,
                },
              },
            }
          ]
        });
      } else {
        // If targetUserId is sessionUserId, it means user is fetching their own events.
        // This case is better handled by /api/events which includes authored, shared with, and public.
        // However, to make this endpoint consistent for viewing one's own public/shared-by-self events:
        whereClause.OR.push({
            shares: { // Events targetUser (self) shared with themselves (usually not a case, but for completeness)
                some: { userId: sessionUserId }
            }
        });
        // And include own events (implicitly covered by authorId: targetUserId)
      }
    }
    
    const events = await prisma.event.findMany({
      where: whereClause,
      include: {
        author: {
          select: { id: true, name: true, email: true, image: true },
        },
        shares: { // Show who the event is shared with, if relevant
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
        },
        forkedFrom: {
          select: { id: true, name: true, author: { select: { id: true, name: true } } },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    // Filter out events that might have been duplicated by OR conditions if sessionUserId === targetUserId
    // and only keep unique events by ID
    const uniqueEvents = Array.from(new Map(events.map(event => [event.id, event])).values());

    return res.status(200).json(uniqueEvents);

  } catch (error) {
    console.error(`Error fetching events for user ${targetUserId}:`, error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}
