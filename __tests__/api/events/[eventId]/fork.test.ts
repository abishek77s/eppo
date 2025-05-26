import { createMocks } from 'node-mocks-http';
import { getServerSession } from 'next-auth/next';
import prisma from '../../../../../lib/prisma'; // Adjust path as needed
import forkEventHandler from '../../../../../pages/api/events/[eventId]/fork'; // Adjust path

// Mock NextAuth
jest.mock('next-auth/next');
const mockGetServerSession = getServerSession as jest.Mock;

// Mock Prisma
jest.mock('../../../../../lib/prisma', () => ({
  __esModule: true,
  default: {
    event: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    // Add other models if they are accessed directly in the handler
  },
}));

describe('POST /api/events/[eventId]/fork', () => {
  let mockPrismaEvent: typeof prisma.event;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrismaEvent = prisma.event as jest.Mocked<typeof prisma.event>;
  });

  it('should allow forking a public event', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-b-id', email: 'userb@example.com' },
      expires: new Date(Date.now() + 2 * 86400).toISOString(),
    });

    const mockOriginalEvent = {
      id: 'original-event-id',
      name: 'Public Event',
      date: new Date(),
      location: 'Public Location',
      authorId: 'user-a-id',
      isPublic: true,
      shares: [], // Not shared explicitly with user-b
      // ... other event fields
    };
    mockPrismaEvent.findUnique.mockResolvedValue(mockOriginalEvent as any); // Cast as any to simplify mock
    
    const mockForkedEvent = { ...mockOriginalEvent, id: 'forked-event-id', authorId: 'user-b-id', forkedFromId: 'original-event-id', isPublic: false };
    mockPrismaEvent.create.mockResolvedValue(mockForkedEvent as any);

    const { req, res } = createMocks({
      method: 'POST',
      query: { eventId: 'original-event-id' },
      session: { user: { id: 'user-b-id' } }, // Mock session if your handler uses it directly
    });

    await forkEventHandler(req, res);

    expect(res._getStatusCode()).toBe(201);
    expect(JSON.parse(res._getData()).event.forkedFromId).toBe('original-event-id');
    expect(JSON.parse(res._getData()).event.authorId).toBe('user-b-id');
    expect(mockPrismaEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          authorId: 'user-b-id',
          forkedFromId: 'original-event-id',
          isPublic: false, // New forks are private
        }),
      })
    );
  });

  it('should allow forking an event shared with the user', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-b-id', email: 'userb@example.com' },
      expires: new Date(Date.now() + 2 * 86400).toISOString(),
    });

    const mockOriginalEvent = {
      id: 'original-event-id',
      name: 'Shared Event',
      authorId: 'user-a-id',
      isPublic: false,
      shares: [{ userId: 'user-b-id', eventId: 'original-event-id' }], // Shared with user-b
      // ... other fields
    };
    mockPrismaEvent.findUnique.mockResolvedValue(mockOriginalEvent as any);
    mockPrismaEvent.create.mockResolvedValue({ ...mockOriginalEvent, id: 'forked-event-id', authorId: 'user-b-id', forkedFromId: 'original-event-id', isPublic: false } as any);
    
    const { req, res } = createMocks({
      method: 'POST',
      query: { eventId: 'original-event-id' },
    });

    await forkEventHandler(req, res);
    expect(res._getStatusCode()).toBe(201);
  });

  it('should forbid forking a private, unshared event', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-b-id', email: 'userb@example.com' },
      expires: new Date(Date.now() + 2 * 86400).toISOString(),
    });
    
    const mockOriginalEvent = {
      id: 'private-event-id',
      name: 'Private Event',
      authorId: 'user-a-id',
      isPublic: false,
      shares: [], // Not public, not shared
      // ... other fields
    };
    mockPrismaEvent.findUnique.mockResolvedValue(mockOriginalEvent as any);

    const { req, res } = createMocks({
      method: 'POST',
      query: { eventId: 'private-event-id' },
    });

    await forkEventHandler(req, res);
    expect(res._getStatusCode()).toBe(403);
    expect(JSON.parse(res._getData()).message).toContain('Forbidden');
  });

  it('should return 404 if original event not found', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'user-b-id' } } as any);
    mockPrismaEvent.findUnique.mockResolvedValue(null);

    const { req, res } = createMocks({
      method: 'POST',
      query: { eventId: 'non-existent-event-id' },
    });

    await forkEventHandler(req, res);
    expect(res._getStatusCode()).toBe(404);
  });
  
  it('should return 401 if user is not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null); // No session

    const { req, res } = createMocks({
      method: 'POST',
      query: { eventId: 'some-event-id' },
    });

    await forkEventHandler(req, res);
    expect(res._getStatusCode()).toBe(401);
  });
});
