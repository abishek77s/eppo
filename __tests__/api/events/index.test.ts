import { createMocks, RequestMethod } from 'node-mocks-http';
import { getServerSession } from 'next-auth/next';
import prisma from '../../../../lib/prisma'; // Adjust path as needed
import eventHandler from '../../../../pages/api/events/index'; // Adjust path

// Mock NextAuth
jest.mock('next-auth/next');
const mockGetServerSession = getServerSession as jest.Mock;

// Mock Prisma
jest.mock('../../../../lib/prisma', () => ({
  __esModule: true,
  default: {
    event: {
      create: jest.fn(),
      findMany: jest.fn(), // Also mock findMany if your handler uses it for GET
    },
  },
}));

describe('POST /api/events', () => {
  let mockPrismaEvent: typeof prisma.event;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrismaEvent = prisma.event as jest.Mocked<typeof prisma.event>;
    mockGetServerSession.mockResolvedValue({
      user: { id: 'test-user-id', email: 'test@example.com' },
      expires: new Date(Date.now() + 2 * 86400).toISOString(),
    });
  });

  const validEventData = {
    name: 'Valid Event Name',
    date: new Date().toISOString(),
    location: 'Valid Location',
    description: 'Valid description',
    category: 'Valid Category',
    price: 'Free',
    isPublic: false,
    positionX: 10.5,
    positionY: 20.3,
  };

  it('should create an event with valid data', async () => {
    const mockCreatedEvent = { ...validEventData, id: 'new-event-id', authorId: 'test-user-id', shares: [], author: {} };
    mockPrismaEvent.create.mockResolvedValue(mockCreatedEvent as any);

    const { req, res } = createMocks({
      method: 'POST' as RequestMethod,
      body: validEventData,
    });

    await eventHandler(req, res);

    expect(res._getStatusCode()).toBe(201);
    expect(JSON.parse(res._getData()).id).toBe('new-event-id');
    expect(mockPrismaEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: validEventData.name,
          authorId: 'test-user-id',
          positionX: 10.5,
          positionY: 20.3,
        }),
      })
    );
  });

  it('should return 400 if required field "name" is missing', async () => {
    const { name, ...incompleteData } = validEventData; // 'name' is removed
    
    const { req, res } = createMocks({
      method: 'POST' as RequestMethod,
      body: incompleteData,
    });

    await eventHandler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData()).message).toContain('Missing required fields');
  });

  it('should return 400 if "date" is invalid', async () => {
    const dataWithInvalidDate = { ...validEventData, date: 'not-a-date' };
    
    const { req, res } = createMocks({
      method: 'POST' as RequestMethod,
      body: dataWithInvalidDate,
    });

    await eventHandler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData()).message).toContain('Invalid date format');
  });
  
  it('should successfully parse valid float positions', async () => {
    const eventDataWithFloatPos = { ...validEventData, positionX: "15.7", positionY: "30.2" };
    mockPrismaEvent.create.mockResolvedValue({ ...eventDataWithFloatPos, id: 'new-event-id', authorId: 'test-user-id' } as any);
    
    const { req, res } = createMocks({ method: 'POST' as RequestMethod, body: eventDataWithFloatPos });
    await eventHandler(req, res);
    
    expect(res._getStatusCode()).toBe(201);
    expect(mockPrismaEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          positionX: 15.7,
          positionY: 30.2,
        }),
      })
    );
  });

  it('should handle null for optional positions if not provided', async () => {
    const { positionX, positionY, ...eventDataWithoutPos } = validEventData;
    mockPrismaEvent.create.mockResolvedValue({ ...eventDataWithoutPos, id: 'new-event-id', authorId: 'test-user-id', positionX: null, positionY: null } as any);
    
    const { req, res } = createMocks({ method: 'POST' as RequestMethod, body: eventDataWithoutPos });
    await eventHandler(req, res);
    
    expect(res._getStatusCode()).toBe(201);
    expect(mockPrismaEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          positionX: null,
          positionY: null,
        }),
      })
    );
  });


  it('should return 401 if user is not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null); // No session
    
    const { req, res } = createMocks({
      method: 'POST' as RequestMethod,
      body: validEventData,
    });

    await eventHandler(req, res);
    expect(res._getStatusCode()).toBe(401);
  });
});
