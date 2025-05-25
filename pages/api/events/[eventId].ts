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
  const { eventId } = req.query;

  if (typeof eventId !== 'string') {
    return res.status(400).json({ message: 'Invalid event ID' });
  }

  // --- Get Single Event ---
  if (req.method === 'GET') {
    try {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
          author: { select: { id: true, name: true, email: true, image: true } },
          shares: {
            include: {
              user: { select: { id: true, name: true, email: true, image: true } }
            }
          },
          forkedFrom: { select: { id: true, name: true, author: { select: { id: true, name: true } } } },
          forks: { select: { id: true, name: true, author: { select: { id: true, name: true } } } }
        },
      });

      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }

      // Check if user has access
      const isAuthor = event.authorId === userId;
      const isSharedWithUser = event.shares.some(share => share.userId === userId);

      if (!event.isPublic && !isAuthor && !isSharedWithUser) {
        return res.status(403).json({ message: 'Forbidden: You do not have access to this event' });
      }

      return res.status(200).json(event);
    } catch (error) {
      console.error(`Error fetching event ${eventId}:`, error);
      return res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
  }
  // --- Update Event ---
  else if (req.method === 'PUT') {
    try {
      const eventToUpdate = await prisma.event.findUnique({
        where: { id: eventId },
      });

      if (!eventToUpdate) {
        return res.status(404).json({ message: 'Event not found' });
      }

      if (eventToUpdate.authorId !== userId) {
        return res.status(403).json({ message: 'Forbidden: Only the author can update this event' });
      }

      const { name, date, location, description, category, image, price, isPublic } = req.body;

      // Basic validation (at least one field to update should be present or specific logic here)
      if (Object.keys(req.body).length === 0) {
        return res.status(400).json({ message: 'No update data provided' });
      }
      
      const { name, date, location, description, category, image, price, isPublic, positionX, positionY } = req.body;
      
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (location !== undefined) updateData.location = location;
      if (description !== undefined) updateData.description = description;
      if (category !== undefined) updateData.category = category;
      if (image !== undefined) updateData.image = image;
      if (price !== undefined) updateData.price = price;
      if (isPublic !== undefined) updateData.isPublic = Boolean(isPublic);
      if (date !== undefined) {
        const eventDate = new Date(date);
        if (isNaN(eventDate.getTime())) {
          return res.status(400).json({ message: 'Invalid date format' });
        }
        updateData.date = eventDate;
      }
      if (positionX !== undefined) {
        const posX = parseFloat(positionX);
        updateData.positionX = isNaN(posX) ? null : posX;
      }
      if (positionY !== undefined) {
        const posY = parseFloat(positionY);
        updateData.positionY = isNaN(posY) ? null : posY;
      }
      
      // Only set updatedAt if other fields are changing, 
      // or always set it if any valid update data is present.
      if (Object.keys(updateData).length > 0) {
        updateData.updatedAt = new Date(); // Explicitly set updatedAt
      } else if (positionX === undefined && positionY === undefined && name === undefined /* etc. for all fields */) {
        // If only non-data fields like 'updatedAt' were hypothetically sent, or no valid fields.
        // This case is mostly covered by `Object.keys(req.body).length === 0`
        // but can be refined if specific fields should not trigger an update.
      }


      const updatedEvent = await prisma.event.update({
        where: { id: eventId },
        data: updateData,
        include: {
          author: { select: { id: true, name: true, email: true, image: true } },
          shares: {
            include: {
              user: { select: { id: true, name: true, email: true, image: true } }
            }
          }
        }
      });

      return res.status(200).json(updatedEvent);
    } catch (error) {
      console.error(`Error updating event ${eventId}:`, error);
      if (error.code === 'P2025') { // Record to update not found
        return res.status(404).json({ message: 'Event not found' });
      }
      return res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
  }
  // --- Delete Event ---
  else if (req.method === 'DELETE') {
    try {
      const eventToDelete = await prisma.event.findUnique({
        where: { id: eventId },
        select: { authorId: true }
      });

      if (!eventToDelete) {
        return res.status(404).json({ message: 'Event not found' });
      }

      if (eventToDelete.authorId !== userId) {
        return res.status(403).json({ message: 'Forbidden: Only the author can delete this event' });
      }

      // Related records (EventShare, child forks) need to be handled.
      // Prisma's default behavior for SQLite with onDelete: NoAction on self-referencing 'forks'
      // means we need to manually handle or decide on cascading behavior.
      // For simplicity here, we will delete related shares. Forks will remain but point to a non-existent event.
      // A more robust solution might involve setting forkedFromId to null or using soft deletes.

      await prisma.$transaction(async (tx) => {
        // Delete related shares
        await tx.eventShare.deleteMany({
          where: { eventId: eventId },
        });
        
        // Potentially nullify forkedFromId in events that forked from this one
        await tx.event.updateMany({
            where: { forkedFromId: eventId },
            data: { forkedFromId: null } // Set to null
        });

        // Delete the event itself
        await tx.event.delete({
          where: { id: eventId },
        });
      });

      return res.status(204).end(); // No content
    } catch (error) {
      console.error(`Error deleting event ${eventId}:`, error);
      if (error.code === 'P2025') { // Record to delete not found
        return res.status(404).json({ message: 'Event not found' });
      }
      return res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
