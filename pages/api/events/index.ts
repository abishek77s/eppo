import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import prisma from '../../../lib/prisma';
import { authOptions } from '../auth/[...nextauth]'; // Adjust path if necessary

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user || !session.user.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const userId = session.user.id;

  if (req.method === 'POST') {
    // --- Create Event ---
    try {
      const {
        name,
        date,
        location,
        description,
        category,
        image,
        price,
        isPublic,
        positionX, // New field
        positionY  // New field
      } = req.body;

      // Basic validation
      if (!name || !date || !location) {
        return res.status(400).json({ message: 'Missing required fields: name, date, location' });
      }

      const eventDate = new Date(date);
      if (isNaN(eventDate.getTime())) {
        return res.status(400).json({ message: 'Invalid date format' });
      }

      const newEvent = await prisma.event.create({
        data: {
          name,
          date: eventDate,
          location,
          description,
          category,
          image,
          price,
          isPublic: isPublic === undefined ? false : Boolean(isPublic),
          authorId: userId,
          positionX: positionX !== undefined ? parseFloat(positionX) : null,
          positionY: positionY !== undefined ? parseFloat(positionY) : null,
          // sharedWithUserIds are managed via EventShare model and /share endpoint
        },
        include: {
          author: {
            select: { id: true, name: true, email: true, image: true }
          },
          shares: {
            include: {
              user: {
                select: { id: true, name: true, email: true, image: true }
              }
            }
          }
        }
      });

      return res.status(201).json(newEvent);
    } catch (error) {
      console.error('Event creation error:', error);
      // Check for specific Prisma errors if needed
      if (error.code === 'P2002') { // Unique constraint violation
        return res.status(409).json({ message: 'Conflict: Event might already exist or unique field violation.' });
      }
      return res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
  } else if (req.method === 'GET') {
    // --- Get Events (accessible to current user) ---
    try {
      const events = await prisma.event.findMany({
        where: {
          OR: [
            { authorId: userId }, // Events authored by the user
            { isPublic: true },    // Public events
            {                    // Events shared with the user
              shares: {
                some: {
                  userId: userId,
                },
              },
            },
          ],
        },
        include: {
          author: {
            select: { id: true, name: true, email: true, image: true }
          },
          shares: {
            include: {
              user: {
                select: { id: true, name: true, email: true, image: true }
              }
            }
          },
          forkedFrom: { // Include info about the original event if forked
            select: { id: true, name: true, author: { select: { id: true, name: true} } }
          }
        },
        orderBy: {
          date: 'desc', // Example: order by date
        },
        // Consider adding pagination here: take: ..., skip: ...
      });
      return res.status(200).json(events);
    } catch (error) {
      console.error('Get events error:', error);
      return res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST', 'GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
