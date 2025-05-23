import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, EventList } from '@prisma/client';
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

  const userId = parseInt((session.user as AuthenticatedUser).id as string); // Or number if your ID is a number

  if (req.method === 'POST') {
    // Create a new event list
    const { name, isPublic } = req.body;

    try {
      const newEventList = await prisma.eventList.create({
        data: {
          name: name || "My Events", // Default name if not provided
          isPublic: isPublic !== undefined ? Boolean(isPublic) : false,
          userId: userId,
        },
      });
      return res.status(201).json(newEventList);
    } catch (error) {
      console.error('Create event list error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  } else if (req.method === 'GET') {
    // Fetch all event lists owned by or shared with the authenticated user
    try {
      const ownedLists = await prisma.eventList.findMany({
        where: { userId: userId },
        include: {
          user: { select: { name: true, email: true }}, // Include owner info
          _count: { select: { events: true } }, // Count of events in each list
        },
        orderBy: { updatedAt: 'desc' },
      });

      const sharedListsRelations = await prisma.sharedEventList.findMany({
        where: { userId: userId },
        include: {
          eventList: {
            include: {
              user: { select: { name: true, email: true }}, // Owner of the shared list
              _count: { select: { events: true } },
            },
          },
        },
        orderBy: { eventList: { updatedAt: 'desc' } },
      });

      // Format shared lists to include permission and list details
      const sharedLists = sharedListsRelations.map(relation => ({
        ...relation.eventList,
        sharedPermission: relation.permission, // Add permission level
      }));

      return res.status(200).json({ ownedLists, sharedLists });
    } catch (error) {
      console.error('Fetch event lists error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['POST', 'GET']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}
