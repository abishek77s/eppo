"use client"

import type React from "react"
import { useState, useEffect, useRef, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import EventCard from "./EventCard"
import EventModal from "./EventModal"
import EventForm from "./EventForm"
import ViewSwitcher from "./ViewSwitcher"
import MonthScrollbar from "./MonthScrollbar"
import { useMediaQuery } from "./hooks/useMediaQuery"

interface Position {
  left: number
  top: number
  rotate: number
  zIndex: number
}

interface EventDetails {
  id: number
  image: string
  name: string
  date: string
  location: string
  description: string
  price: string
  category: string
}

interface NoticeboardProps {
  events: EventDetails[]
  spreadFactor?: number // Controls how spread out cards are (0-100)
  rotationRange?: number // Controls max rotation in either direction
  gridRows?: number // Approximate number of rows to distribute cards
  gridCols?: number // Approximate number of columns to distribute cards
  cardWidth?: number // Width of cards in percentage
  cardHeight?: number // Height of cards in percentage
  padding?: number // Minimum padding between cards in percentage
  background?: string // Background style
  cardSize?: "small" | "medium" | "large"
}

type ViewType = "noticeboard" | "list"

// Helper function to parse date from string
const parseDate = (dateStr: string): Date => {
  // Try to extract month and year from various date formats
  const monthNames = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
  ]

  // Convert to lowercase for case-insensitive matching
  const lowerDateStr = dateStr.toLowerCase()

  // Find which month is mentioned in the string
  const monthIndex = monthNames.findIndex((month) => lowerDateStr.includes(month))

  if (monthIndex !== -1) {
    // Extract year - look for 4 digit number
    const yearMatch = dateStr.match(/\b(20\d{2})\b/)
    const year = yearMatch ? Number.parseInt(yearMatch[1]) : new Date().getFullYear()

    // Create date object for the first day of the month
    return new Date(year, monthIndex, 1)
  }

  // Fallback: return current date
  return new Date()
}

import { useSession } from "next-auth/react";

// Define types for API responses (mirroring Prisma schema where appropriate)
interface ApiEvent {
  id: number;
  name: string;
  date: string;
  location: string;
  description: string;
  price: string;
  category: string;
  image?: string | null;
  eventListId: number;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  positionX?: number | null;
  positionY?: number | null;
  isPinned?: boolean;
  pinOrder?: number | null;
}

interface ApiEventList {
  id: number;
  name: string;
  userId: number;
  isPublic: boolean;
  // Omitting events and sharedWith for brevity here, include if needed by NoticeBoard
  _count?: { events: number };
  sharedPermission?: string; // If fetching shared lists
}

const NoticeBoard: React.FC<NoticeboardProps> = ({
  // initialEvents prop is removed, data will be fetched
  spreadFactor = 60,
  rotationRange = 5,
  gridRows,
  gridCols,
  cardWidth = 15,
  cardHeight = 25,
  padding = 5,
  background = "bg-slate-200 bg-[radial-gradient(#cccccc_5%,#fff_5%)] bg-[length:50px_50px]",
  cardSize = "medium",
}) => {
  const { data: session, status: sessionStatus } = useSession();
  const [events, setEvents] = useState<ApiEvent[]>([]); // Use ApiEvent type
  const [eventLists, setEventLists] = useState<ApiEventList[]>([]);
  const [selectedEventListId, setSelectedEventListId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<ApiEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ApiEvent | null>(null);
  const [clickedCardRect, setClickedCardRect] = useState<DOMRect | null>(null);
  const [viewType, setViewType] = useState<ViewType>("noticeboard");

  // State for ShareModal
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [eventListToShare, setEventListToShare] = useState<ApiEventList | null>(null);
  const [forkingListId, setForkingListId] = useState<number | null>(null); // State for fork button loading

  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth());
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const positionsRef = useRef<Position[]>([])

  const isMobile = useMediaQuery("(max-width: 768px)");
  const mobileCardWidth = isMobile ? 40 : cardWidth;
  const mobileCardHeight = isMobile ? 35 : cardHeight;
  const effectiveCardWidth = mobileCardWidth;
  const effectiveCardHeight = mobileCardHeight;
  
  const currentUserId = (session?.user as any)?.id;

  // Explicitly define ApiEventList interface used within NoticeBoard
  interface ApiEventList {
    id: number;
    name: string;
    userId: number;
    isPublic: boolean;
    isOwnedByCurrentUser?: boolean; // Optional because it's added in frontend processing
    sharedPermission?: 'VIEW_ONLY' | 'EDIT' | null;
    forkedFromId?: number | null;   // From Prisma schema
    _count?: { events: number };
    // Ensure all fields used in the component are here
  }
  
  const fetchEventLists = async (switchToNewListId?: number) => {
    if (sessionStatus !== "authenticated" || !session?.user) {
      setEventLists([]);
      setEvents([]);
      setSelectedEventListId(null);
      setIsLoading(false);
      setError("Please log in to view your events.");
      return;
    }

    setIsLoading(true); 
    setError(null);
    try {
      const response = await fetch("/api/event-lists");
      if (!response.ok) throw new Error(`Failed to fetch event lists: ${response.statusText}`);
      const data = await response.json(); // Expect { ownedLists: [], sharedLists: [] }
      
      const allListsApi = [...(data.ownedLists || []), ...(data.sharedLists || [])];
      const processedLists: ApiEventList[] = allListsApi.map(list => ({
        ...list, // Spread all properties from the API
        isOwnedByCurrentUser: String(list.userId) === String(currentUserId),
        // Ensure forkedFromId and isPublic are correctly mapped if not directly on object
        forkedFromId: list.forkedFromId || null, 
        isPublic: list.isPublic || false,
      }));
      setEventLists(processedLists);

      if (switchToNewListId) {
        setSelectedEventListId(switchToNewListId);
        // Fetching events for this new list will be triggered by the useEffect watching selectedEventListId
      } else if (processedLists.length > 0) {
        const currentSelectedListStillExists = processedLists.some(l => l.id === selectedEventListId);
        if (!currentSelectedListStillExists || !selectedEventListId) {
          const firstOwned = processedLists.find(l => l.isOwnedByCurrentUser);
          setSelectedEventListId(firstOwned ? firstOwned.id : processedLists[0].id);
        }
        // If a list is selected and still exists, events will be fetched by selectedEventListId's useEffect
      } else { // No lists exist for the user
        setEvents([]);
        setSelectedEventListId(null);
        setIsLoading(false); // Explicitly stop loading as no events will be fetched
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      setEventLists([]);
      setEvents([]);
      setIsLoading(false); // Stop loading on error
    }
    // Note: setIsLoading(false) is also handled in the useEffect for fetching events,
    // ensuring it's turned off after events for the selected list are loaded.
  };

  useEffect(() => {
  useEffect(() => {
    fetchEventLists();
  }, [sessionStatus, session, currentUserId]);

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      if (selectedEventListId !== null && sessionStatus === "authenticated") {
        setIsLoading(true);
        setError(null);
        try {
          const response = await fetch(`/api/events?eventListId=${selectedEventListId}`);
          if (!response.ok) {
            throw new Error(`Failed to fetch events: ${response.statusText}`);
          }
          const fetchedEvents: ApiEvent[] = await response.json();
          setEvents(fetchedEvents);
        } catch (err) {
          console.error(err);
          setError(err instanceof Error ? err.message : "An unknown error occurred");
          setEvents([]);
        } finally {
          setIsLoading(false);
        }
      } else if (!selectedEventListId && eventLists.length > 0) {
        // If no list is selected but lists exist, might mean user needs to pick one
        // or it's the initial state before default selection.
        // For now, just ensure events are cleared and loading is false.
        setEvents([]);
        setIsLoading(false);
      } else if (sessionStatus === "unauthenticated") {
        setIsLoading(false);
      }
    };
    fetchEvents();
  }, [selectedEventListId, sessionStatus, eventLists.length]);


  // Extract unique categories from the currently fetched events
  const categories = useMemo(() => {
    const uniqueCategories = new Set<string>();
    events.forEach((event) => {
      if (event.category) {
        uniqueCategories.add(event.category);
      }
    });
    return Array.from(uniqueCategories);
  }, [events]);

  // Organize events by month
  const eventsByMonth = useMemo(() => {
    return events.reduce<Record<number, ApiEvent[]>>((acc, event) => { // Use ApiEvent
      const date = parseDate(event.date); // Ensure parseDate handles your date format
      const month = date.getMonth();
      if (!acc[month]) {
        acc[month] = [];
      }
      acc[month].push(event);
      return acc;
    }, {});
  }, [events]);

  // Get events for the current month and apply filters
  const currentMonthEvents = useMemo(() => {
    const monthEvents = eventsByMonth[currentMonth] || []

    // Apply category filter if any categories are selected
    if (selectedCategories.length > 0) {
      return monthEvents.filter((event) => selectedCategories.includes(event.category))
    }

    return monthEvents
  }, [eventsByMonth, currentMonth, selectedCategories])

  // Function to check if two cards overlap
  const doCardsOverlap = (
    pos1: Position,
    pos2: Position,
    effectiveCardWidth: number,
    effectiveCardHeight: number,
  ): boolean => {
    // Calculate the edges of each card
    const card1Left = pos1.left
    const card1Right = pos1.left + effectiveCardWidth
    const card1Top = pos1.top
    const card1Bottom = pos1.top + effectiveCardHeight

    const card2Left = pos2.left
    const card2Right = pos2.left + effectiveCardWidth
    const card2Top = pos2.top
    const card2Bottom = pos2.top + effectiveCardHeight

    // Check if the two cards overlap with padding
    return !(
      (
        card1Right + padding < card2Left || // Card 1 is to the left of card 2
        card1Left > card2Right + padding || // Card 1 is to the right of card 2
        card1Bottom + padding < card2Top || // Card 1 is above card 2
        card1Top > card2Bottom + padding
      ) // Card 1 is below card 2
    )
  }

  const handleCardClick = (event: EventDetails, index: number) => {
    // Get the DOM rect of the clicked card for animation
    const cardElement = cardRefs.current[index]
    if (cardElement) {
      setClickedCardRect(cardElement.getBoundingClientRect())
    }

    setSelectedEvent(event)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setTimeout(() => {
      setSelectedEvent(null)
      setClickedCardRect(null)
    }, 300) // Clear after animation completes
  }

  // Handle month change
  const handleMonthChange = (month: number) => {
    setCurrentMonth(month)
  }

  // Handle filter change
  const handleFilterChange = (categories: string[]) => {
    setSelectedCategories(categories)
  }

  const selectedListDetails: ApiEventList | undefined = useMemo(() => {
    return eventLists.find(list => list.id === selectedEventListId);
  }, [eventLists, selectedEventListId]);

  const canCurrentUserEditSelectedList = useMemo(() => {
    if (!selectedListDetails || !currentUserId) return false;
    return !!selectedListDetails.isOwnedByCurrentUser || selectedListDetails.sharedPermission === 'EDIT';
  }, [selectedListDetails, currentUserId]);

  const canCurrentUserForkSelectedList = useMemo(() => {
    if (!selectedListDetails || !currentUserId || sessionStatus !== "authenticated") return false;
    return !selectedListDetails.isOwnedByCurrentUser && 
           (selectedListDetails.isPublic || !!selectedListDetails.sharedPermission);
  }, [selectedListDetails, currentUserId, sessionStatus]);

  const handlePinToggle = async (eventToToggle: ApiEvent) => {
    if (!selectedEventListId || !canCurrentUserEditSelectedList) {
      alert("You don't have permission to modify events in this list.");
      return;
    }

    const newIsPinned = !eventToToggle.isPinned;
    let newPositionX = eventToToggle.positionX;
    let newPositionY = eventToToggle.positionY;

    if (newIsPinned) {
      // If pinning and no explicit positions, try to use current dynamic position
      if (newPositionX === null || newPositionY === null) {
        const currentDynamicPos = positions.find((_p, index) => {
            // This assumes currentMonthEvents maps directly to the order in positions array
            // This is fragile. A better way would be to store event IDs with their positions.
            // For now, let's find the event in currentMonthEvents first.
            const eventInCurrentMonth = currentMonthEvents.findIndex(e => e.id === eventToToggle.id);
            return positions[eventInCurrentMonth] && index === eventInCurrentMonth;
        });
         // Find the index of eventToToggle in the `events` array to map to `positions`
        const eventIndex = events.findIndex(e => e.id === eventToToggle.id);


        if (eventIndex !== -1 && positions[eventIndex]) {
          // Convert percentage to a simple number, assuming positions are stored 0-100
          newPositionX = positions[eventIndex].left; 
          newPositionY = positions[eventIndex].top;
        } else {
          // Default to top-left if current position can't be determined
          newPositionX = 5; 
          newPositionY = 5;
          alert("Could not determine current card position. Pinning to default top-left. You can adjust in the edit form.");
        }
      }
    }
    // For unpinning, we can send nulls or let backend handle clearing if that's the logic
    // For now, we'll send current values or nulls if unpinning and they should be cleared.
    // if (!newIsPinned) {
    //   newPositionX = null;
    //   newPositionY = null;
    // }


    const payload = {
      ...eventToToggle, // Spread existing event data
      isPinned: newIsPinned,
      positionX: newPositionX,
      positionY: newPositionY,
      // Ensure other required fields for update are present if any, or strip them if not needed for this partial update
      // For example, eventListId is part of the URL, not payload for update usually.
    };
    // Remove fields not expected by PUT /api/events/:id body, or ensure API handles extra fields gracefully
    delete payload.eventListId; 
    delete payload.createdAt;
    delete payload.updatedAt;


    try {
      const response = await fetch(`/api/events/${eventToToggle.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update event pin status.');
      }
      const updatedEvent = await response.json();
      // Update local state
      setEvents(prevEvents => prevEvents.map(e => e.id === updatedEvent.id ? updatedEvent : e));
      // If the selectedEvent in modal was this one, update it too
      if (selectedEvent?.id === updatedEvent.id) {
        setSelectedEvent(updatedEvent);
      }

    } catch (err) {
      console.error("Pin toggle error:", err);
      alert(err instanceof Error ? err.message : "Failed to update pin status.");
    }
  };
  
  const handleForkList = async (listIdToFork: number) => {
    if (!listIdToFork) return;
    setForkingListId(listIdToFork);
    setError(null);
  
    try {
      const response = await fetch(`/api/event-lists/${listIdToFork}/fork`, { method: 'POST' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fork event list.');
      }
      const newForkedList: ApiEventList = await response.json();
      alert(`List "${selectedListDetails?.name || 'Original list'}" forked successfully as "${newForkedList.name}"!`);
      // Refresh lists and switch to the new forked list
      await fetchEventLists(newForkedList.id); 
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during forking.";
      setError(errorMessage);
      alert(errorMessage); // Simple feedback for now
    } finally {
      setForkingListId(null);
    }
  };


  const handleAddEvent = () => {
    if (!canCurrentUserEditSelectedList) {
      alert("You don't have permission to add events to this list.");
      return;
    }
    setEditingEvent(null);
    setIsFormOpen(true);
  };

  const handleEditEvent = (eventToEdit: ApiEvent) => {
     if (!canCurrentUserEditSelectedList) {
      alert("You don't have permission to edit events in this list.");
      return;
    }
    setEditingEvent(eventToEdit);
    setIsFormOpen(true);
  };

  const handleDeleteEvent = async (eventId: number) => {
    if (!selectedEventListId || !window.confirm("Are you sure you want to delete this event?")) {
      return;
    }
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete event');
      }
      setEvents((prevEvents) => prevEvents.filter(event => event.id !== eventId));
      if(selectedEvent?.id === eventId) {
        closeModal();
      }
    } catch (err) {
      console.error("Delete event error:", err);
      setError(err instanceof Error ? err.message : "Failed to delete event");
    }
  };


  const handleSaveEvent = async (eventData: Omit<ApiEvent, "id" | "createdAt" | "updatedAt" | "eventListId"> & { id?: number }) => {
    if (!selectedEventListId || !canCurrentUserEditSelectedList) {
      setError(canCurrentUserEditSelectedList ? "No event list selected." : "You don't have permission to save events to this list.");
      return;
    }

    const payload = {
      ...eventData,
      eventListId: selectedEventListId,
      // Ensure numeric fields are numbers if your form gives strings
      price: String(eventData.price), // API expects string for price as per schema
      positionX: eventData.positionX ? parseFloat(String(eventData.positionX)) : null,
      positionY: eventData.positionY ? parseFloat(String(eventData.positionY)) : null,
      isPinned: Boolean(eventData.isPinned),
      pinOrder: eventData.pinOrder ? parseInt(String(eventData.pinOrder), 10) : null,
    };

    try {
      let response;
      let newOrUpdatedEvent;

      if (editingEvent && editingEvent.id) { // Update existing event
        response = await fetch(`/api/events/${editingEvent.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to update event');
        }
        newOrUpdatedEvent = await response.json();
        setEvents((prevEvents) => 
          prevEvents.map(event => event.id === newOrUpdatedEvent.id ? newOrUpdatedEvent : event)
        );
      } else { // Create new event
        response = await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create event');
        }
        newOrUpdatedEvent = await response.json();
        setEvents((prevEvents) => [...prevEvents, newOrUpdatedEvent]);
      }
      
      setIsFormOpen(false);
      setEditingEvent(null);
    } catch (err) {
      console.error("Save event error:", err);
      setError(err instanceof Error ? err.message : "Failed to save event");
    }
  };

    // Calculate grid dimensions - memoized to prevent recalculation on every render
  const calculateGrid = useMemo(() => {
    if (!containerRef.current) return { rows: 3, cols: isMobile ? 2 : 4 }

    const totalCards = currentMonthEvents.length
    if (totalCards === 0) return { rows: 1, cols: 1 }

    // For mobile, limit to 2 columns max
    const maxCols = isMobile ? 2 : 4

    if (viewType === "list") {
      return { rows: totalCards, cols: 1 }
    } else {
      // For noticeboard view
      // If there's only one card, use 1 column
      if (totalCards === 1) {
        return { rows: 1, cols: 1 }
      }

      // For mobile, use 1 or 2 columns based on number of cards
      if (isMobile) {
        const cols = totalCards < 3 ? totalCards : 2
        const rows = Math.ceil(totalCards / cols)
        return { rows, cols }
      }

      // For desktop, calculate based on aspect ratio
      const containerWidth = containerRef.current.clientWidth
      const containerHeight = containerRef.current.clientHeight
      const aspectRatio = containerWidth / containerHeight

      const calculatedCols = Math.min(maxCols, Math.ceil(Math.sqrt(totalCards * aspectRatio)))
      const calculatedRows = Math.ceil(totalCards / calculatedCols)

      return { rows: calculatedRows, cols: calculatedCols }
    }
  }, [currentMonthEvents.length, viewType, isMobile, containerRef.current])

  // Calculate positions based on view type
  useEffect(() => {
    // Skip calculation if container is not available
    if (!containerRef.current) return

    // Function to calculate positions
    const calculatePositions = () => {
      // Create a grid-based arrangement
      const gridPositions: Position[] = []

      // Get the board dimensions
      const boardWidth = containerRef.current?.clientWidth || 1000
      const boardHeight = containerRef.current?.clientHeight || 800

      // Calculate the effective padding in pixels
      const horizontalPadding = boardWidth * 0.05 // 5% of board width
      const verticalPadding = boardHeight * 0.05 // 5% of board height

      // Calculate the available space
      const availableWidth = boardWidth - 2 * horizontalPadding
      const availableHeight = boardHeight - 2 * verticalPadding

      // For list view, stack vertically with no rotation
      if (viewType === "list") {
        for (let i = 0; i < currentMonthEvents.length; i++) {
          const newPos: Position = {
            left: 5, // 5% margin from left
            top: i * (effectiveCardHeight + 2), // Stack with 2% gap
            rotate: 0,
            zIndex: i,
          }
          gridPositions.push(newPos)
        }
      }
      // For noticeboard view, prioritize top positioning
      else {
        const { cols } = calculateGrid

        // Start with a top-down approach
        for (let i = 0; i < currentMonthEvents.length; i++) {
          // Calculate preferred position (top-down, left-right)
          const preferredRow = Math.floor(i / cols)
          const preferredCol = i % cols

          // Calculate cell dimensions
          const cellWidth = 100 / cols
          const cellHeight = 100 / calculateGrid.rows

          // Base position (centered in cell)
          let baseLeft = preferredCol * cellWidth + (cellWidth - effectiveCardWidth) / 2
          let baseTop = preferredRow * cellHeight + (cellHeight - effectiveCardHeight) / 2

          // Ensure we stay within the padding boundaries
          baseLeft = Math.max(5, Math.min(95 - effectiveCardWidth, baseLeft))
          baseTop = Math.max(5, Math.min(95 - effectiveCardHeight, baseTop))

          // For single card, position it near the top
          if (currentMonthEvents.length === 1) {
            baseTop = 10 // 10% from the top
            baseLeft = 50 - effectiveCardWidth / 2 // Centered horizontally
          }

          // Try multiple positions with decreasing randomness
          let attempts = 0
          let newPos: Position
          const maxAttempts = 30

          do {
            // Calculate random offsets (decreasing with attempts)
            const randomFactor = Math.max(0, spreadFactor * (1 - attempts / maxAttempts))
            const randomOffsetX = (((Math.random() - 0.5) * randomFactor) / 100) * cellWidth
            const randomOffsetY = (((Math.random() - 0.5) * randomFactor) / 100) * cellHeight

            // Apply offsets and ensure bounds
            newPos = {
              left: Math.max(5, Math.min(95 - effectiveCardWidth, baseLeft + randomOffsetX)),
              top: Math.max(5, Math.min(95 - effectiveCardHeight, baseTop + randomOffsetY)),
              rotate: Math.random() * rotationRange * 2 - rotationRange,
              zIndex: currentMonthEvents.length - i, // Higher z-index for earlier events
            }

            // Check against all existing positions
            const overlaps = gridPositions.some((pos) =>
              doCardsOverlap(pos, newPos, effectiveCardWidth, effectiveCardHeight),
            )

            if (!overlaps || attempts > maxAttempts) {
              break
            }

            attempts++
          } while (attempts <= maxAttempts)

          gridPositions.push(newPos)
        }
      }

      // Only update positions if they've actually changed
      if (JSON.stringify(gridPositions) !== JSON.stringify(positionsRef.current)) {
        positionsRef.current = gridPositions
        setPositions(gridPositions)
      }
    }

    // Calculate positions once
    calculatePositions()

    // Add resize listener to recalculate positions when window size changes
    const handleResize = () => {
      calculatePositions()
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [
    currentMonthEvents,
    spreadFactor,
    rotationRange,
    effectiveCardWidth,
    effectiveCardHeight,
    padding,
    viewType,
    calculateGrid,
    isMobile,
  ])

  // Prepare card refs array
  useEffect(() => {
    cardRefs.current = cardRefs.current.slice(0, currentMonthEvents.length)
  }, [currentMonthEvents])

  return (
        <div>
          <ViewSwitcher
            currentView={viewType}
            onViewChange={setViewType}
            categories={categories}
            selectedCategories={selectedCategories}
            onFilterChange={handleFilterChange}
            onAddEvent={handleAddEvent}
          />
              <div className={`flex h-full w-full flex-col md:flex-row ${isMobile ? "overflow-hidden" : ""}`}>
                {/* Month scrollbar - hidden on mobile in portrait */}
                <div className={`${isMobile ? " w-full overflow-x-auto" : "w-16"}`}>
          <MonthScrollbar
            currentMonth={currentMonth}
            onMonthChange={handleMonthChange}
            orientation={isMobile ? "horizontal" : "vertical"}
          />
                </div>
                <div className="flex-1 flex flex-col">
                  {/* Event List Selector and Share Button */}
                  {eventLists.length > 0 && (
                    <div className="p-2 bg-gray-100 border-b flex items-center justify-between">
                      <div>
                        <label htmlFor="event-list-selector" className="mr-2 text-sm font-medium text-gray-700">Event List:</label>
                        <select
                          id="event-list-selector"
                          value={selectedEventListId ?? ""}
                          onChange={(e) => setSelectedEventListId(Number(e.target.value))}
                          className="p-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                        >
                          {eventLists.map(list => (
                            <option key={list.id} value={list.id}>
                              {list.name}
                              {!list.isOwnedByCurrentUser && list.sharedPermission ? ` (Shared - ${list.sharedPermission === 'EDIT' ? 'Edit' : 'View'})` : ''}
                              {!list.isOwnedByCurrentUser && !list.sharedPermission && list.isPublic ? ` (Public)` : ''}
                              {list.isOwnedByCurrentUser ? ` (Owner)` : ''}
                              {' '}({list._count?.events || 0})
                            </option>
                          ))}
                        </select>
                      </div>
                      {selectedListDetails?.isOwnedByCurrentUser && (
                        <button
                          onClick={() => {
                            setEventListToShare(selectedListDetails);
                            setIsShareModalOpen(true);
                          }}
                          className="ml-2 px-3 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          Share List
                        </button>
                      )}
                      {/* Fork List Button */}
                      {canCurrentUserForkSelectedList && selectedEventListId && (
                        <button
                          onClick={() => handleForkList(selectedEventListId)}
                          disabled={forkingListId === selectedEventListId}
                          className="ml-2 px-3 py-1 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                        >
                          {forkingListId === selectedEventListId ? "Forking..." : "Fork List"}
                        </button>
                      )}
                    </div>
                  )}
                  <div
                    ref={containerRef}
                    className={`flex-1 p-4 md:p-8 w-full ${
                      viewType === "noticeboard" ? background : "bg-gray-50"
                    } overflow-auto relative`}
                  >
                    {isLoading && <div className="flex items-center justify-center h-full"><p>Loading events...</p></div>}
                    {!isLoading && error && <div className="flex items-center justify-center h-full"><p className="text-red-500">{error}</p></div>}
                    {!isLoading && !error && (
                      <div className={`relative h-full w-full ${viewType === "list" ? "flex flex-col gap-4 p-2" : ""}`}>
                        {currentMonthEvents.map((event, index) => (
                          <motion.div
                            key={event.id}
                  ref={(el: HTMLDivElement | null) => {
                    cardRefs.current[index] = el;
                  }}
          
                  className={`${viewType !== "list" ? "absolute" : ""} cursor-pointer`}
                  style={
                    viewType !== "list"
                      ? {
                          left: `${positions[index]?.left || 0}%`,
                          top: `${positions[index]?.top || 0}%`,
                          zIndex: positions[index]?.zIndex || 0,
                        }
                      : {}
                  }
                  initial={{
                    opacity: 0,
                    scale: 0.8,
                    rotate: viewType === "noticeboard" ? positions[index]?.rotate || 0 : 0,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    rotate: viewType === "noticeboard" ? positions[index]?.rotate || 0 : 0,
                    transition: {
                      delay: index * 0.05,
                      duration: 0.5,
                      type: "spring",
                      stiffness: 100,
                    },
                  }}
                  whileHover={{
                    scale: 1.05,
                    zIndex: 30,
                    transition: { duration: 0.2 },
                  }}
                  onClick={() => handleCardClick(event, index)}
                >
                            <EventCard
                              // Pass ApiEvent as eventDetails
                              eventDetails={{
                                ...event,
                                // Ensure all fields expected by EventCard are present
                                // If EventCard expects 'image' and it can be null from API, provide a fallback
                                image: event.image || "/placeholder.svg?height=300&width=400",
                              }}
                              pinColor={event.category === "featured" ? "blue" : "red"} // Example, adjust as needed
                              hoverEffect="scale"
                              size={isMobile ? "medium" : cardSize}
                              viewType={viewType}
                              // Add onDelete and onEdit props to EventCard if you want buttons there
                              // onDelete={() => handleDeleteEvent(event.id)}
                              // onEdit={() => handleEditEvent(event)}
                            />
                          </motion.div>
                        ))}
                        {currentMonthEvents.length === 0 && !isLoading && (
                           <div className="flex items-center justify-center h-full w-full">
                             <div className="text-center p-8 bg-white/80 rounded-lg shadow-sm">
                               <h3 className="text-xl font-semibold text-gray-700 mb-2">
                                 {eventLists.length === 0 && sessionStatus === "authenticated" ? "Create an event list to get started!" : "No events this month"}
                               </h3>
                               <p className="text-gray-500">
                                 {selectedCategories.length > 0
                                   ? "Try selecting different categories or changing the month."
                                   : eventLists.length > 0 ? "Try selecting a different month or adding new events to this list." : "Log in and create an event list to add events."}
                               </p>
                               {sessionStatus === "unauthenticated" && (
                                  <Link href="/login" className="mt-4 inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                                    Login
                                  </Link>
                                )}
                             </div>
                           </div>
                         )}
                      </div>
                    )}
                  </div>
                </div>
          
                <AnimatePresence>
                  {isModalOpen && selectedEvent && (
                    <EventModal
                      event={selectedEvent}
                      isOpen={isModalOpen}
                      onClose={closeModal}
                      sourceRect={clickedCardRect}
                      isMobile={isMobile}
                      onEdit={() => {
                        if (selectedEvent) {
                           // Check if the user can edit this event (is owner or has edit permission on list)
                           const list = eventLists.find(l => l.id === selectedEvent.eventListId);
                           const isOwner = list?.userId === parseInt((session?.user as any)?.id);
                           const canEditShared = list?.sharedPermission === 'EDIT';
                           if(isOwner || canEditShared) {
                            handleEditEvent(selectedEvent);
                           } else {
                            alert("You don't have permission to edit this event.");
                           }
                        }
                      }}
                      onEdit={() => {
                        if (selectedEvent && canCurrentUserEditSelectedList) {
                          handleEditEvent(selectedEvent);
                        } else if (!canCurrentUserEditSelectedList) {
                          alert("You don't have permission to edit events in this list.");
                        }
                      }}
                      onDelete={() => {
                        if (selectedEvent && canCurrentUserEditSelectedList) {
                          handleDeleteEvent(selectedEvent.id);
                        } else if (!canCurrentUserEditSelectedList) {
                           alert("You don't have permission to delete events in this list.");
                        }
                      }}
                      canEdit={canCurrentUserEditSelectedList} // Pass this to EventModal
                    />
                  )}
                </AnimatePresence>
          
                {canCurrentUserEditSelectedList && (
                  <EventForm
                    isOpen={isFormOpen}
                    onClose={() => { setIsFormOpen(false); setEditingEvent(null); }}
                    onSave={handleSaveEvent}
                    categories={categories}
                    eventToEdit={editingEvent}
                  />
                )}

                <ShareModal
                  isOpen={isShareModalOpen}
                  onClose={() => {
                    setIsShareModalOpen(false);
                    fetchEventLists(); // Re-fetch lists to get updated share info
                  }}
                  eventList={eventListToShare}
                  currentUserId={currentUserId}
                />
              </div>
        </div>
  )
}

export default NoticeBoard
