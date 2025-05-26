"use client"

import type React from "react"
import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { useSession } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import EventCard from "./EventCard"
import EventModal from "./EventModal"
import EventForm from "./EventForm"
import ViewSwitcher from "./ViewSwitcher"
import MonthScrollbar from "./MonthScrollbar"
import { useMediaQuery } from "./hooks/useMediaQuery"
import { Button } from "./components/ui/button" // Assuming Button component exists

// --- Updated EventDetails Interface ---
interface Author {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface ShareUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface EventShareInfo {
  id: string;
  userId: string;
  eventId: string;
  user: ShareUser;
  sharedAt: string; 
}

interface ForkedFromInfo {
  id: string;
  name: string;
  author?: {
    id: string;
    name?: string | null;
  } | null;
}

export interface EventDetails {
  id: string; // Changed from number to string
  name: string;
  date: string; // Keep as string for input, API will handle Date conversion
  location: string;
  description?: string | null;
  category?: string | null;
  image?: string | null;
  price?: string | null;
  
  authorId: string;
  author: Author;
  
  isPublic: boolean;
  shares: EventShareInfo[]; // Updated to use EventShareInfo

  forkedFromId?: string | null;
  forkedFrom?: ForkedFromInfo | null;
  forks?: Partial<EventDetails>[]; // Assuming forks are partial events

  createdAt: string; // Or Date
  updatedAt: string; // Or Date

  positionX?: number | null; // Percentage from left
  positionY?: number | null; // Percentage from top
}

interface Position {
  left: number;
  top: number;
  rotate: number;
  zIndex: number;
}

// NoticeboardProps no longer takes events directly
interface NoticeboardProps {
  // events: EventDetails[] // Removed, will be fetched
  spreadFactor?: number // Controls how spread out cards are (0-100)
  rotationRange?: number // Controls max rotation in either direction
  // gridRows and gridCols might be dynamically calculated or passed if needed
  cardWidth?: number // Width of cards in percentage
  cardHeight?: number // Height of cards in percentage
  padding?: number // Minimum padding between cards in percentage
  background?: string // Background style
  cardSize?: "small" | "medium" | "large"
}

type ViewType = "noticeboard" | "list"

// Helper function to parse date from string (API returns ISO strings, so parsing might need adjustment)
const parseDate = (dateStr: string): Date => {
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date;
  }

  // Fallback for non-ISO date strings (current logic)
  const monthNames = [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december",
  ];
  const lowerDateStr = dateStr.toLowerCase();
  const monthIndex = monthNames.findIndex((month) => lowerDateStr.includes(month));
  if (monthIndex !== -1) {
    const yearMatch = dateStr.match(/\b(20\d{2})\b/);
    const year = yearMatch ? Number.parseInt(yearMatch[1]) : new Date().getFullYear();
    return new Date(year, monthIndex, 1);
  }
  return new Date(); // Fallback
}

// const STORAGE_KEY = "noticeboard_events" // Removed localStorage

const NoticeBoard: React.FC<NoticeboardProps> = ({
  // events: initialEvents, // Removed
  spreadFactor = 60,
  rotationRange = 5,
  cardWidth = 15,
  cardHeight = 25, // This might be overridden by M3 card styling or become less relevant
  padding = 5, // Padding for overlap calculation, may need review with M3 spacing
  background = "bg-surface", // M3: Use surface color for the board background
  cardSize = "medium", // Card size is now more directly controlled by EventCard M3 styles
}) => {
  const { data: session } = useSession();
  const [events, setEvents] = useState<EventDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventDetails | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [clickedCardRect, setClickedCardRect] = useState<DOMRect | null>(null);
  const [viewType, setViewType] = useState<ViewType>("noticeboard");
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth());
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const positionsRef = useRef<Position[]>([]);

  const isMobile = useMediaQuery("(max-width: 768px)");
  const mobileCardWidth = isMobile ? 40 : cardWidth;
  const mobileCardHeight = isMobile ? 35 : cardHeight;
  const effectiveCardWidth = mobileCardWidth;
  const effectiveCardHeight = mobileCardHeight;

  // --- Fetch Events from API ---
  const fetchEvents = useCallback(async () => {
    if (!session) return; // Don't fetch if no session, or handle public view differently
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/events');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error: ${response.status}`);
      }
      const data: EventDetails[] = await response.json();
      setEvents(data);
    } catch (err: any) {
      console.error("Failed to fetch events:", err);
      setError(err.message);
      toast.error("Failed to load events: " + err.message);
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]); // Depends on session

  // --- Remove localStorage logic ---
  // useEffect(() => { ... loadEvents ... }, []);
  // useEffect(() => { ... saveEvents ... }, [events]);

  const categories = useMemo(() => {
    const uniqueCategories = new Set<string>();
    events.forEach((event) => {
      if (event.category) {
        uniqueCategories.add(event.category);
      }
    });
    return Array.from(uniqueCategories);
  }, [events]);

  // Organize events by month - memoized to prevent recalculation on every render
  const eventsByMonth = useMemo(() => {
    return events.reduce<Record<number, EventDetails[]>>((acc, event) => {
      const date = parseDate(event.date)
      const month = date.getMonth()

      if (!acc[month]) {
        acc[month] = []
      }

      acc[month].push(event)
      return acc
    }, {})
  }, [events])

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

  // Handle adding a new event
  const handleAddEvent = () => {
    setIsFormOpen(true);
  }

  // --- Updated handleSaveEvent (will be passed to EventForm) ---
  // This function will be called by EventForm after successful API call
  const onEventCreated = (newEvent: EventDetails) => {
    setEvents((prevEvents) => [newEvent, ...prevEvents]); // Add to local state
    // Or better, re-fetch:
    // fetchEvents(); 
    setIsFormOpen(false);
    toast.success("Event created successfully!");
  };

  const onEventUpdated = (updatedEvent: EventDetails) => {
    setEvents((prevEvents) => 
      prevEvents.map(event => event.id === updatedEvent.id ? updatedEvent : event)
    );
    toast.success("Event updated successfully!");
    // Potentially close modal if open for edit
  };

  const onEventDeleted = (deletedEventId: string) => {
    setEvents((prevEvents) => prevEvents.filter(event => event.id !== deletedEventId));
    toast.success("Event deleted successfully!");
    if (selectedEvent?.id === deletedEventId) {
      closeModal();
    }
  };
  
  // Calculate grid dimensions - memoized to prevent recalculation on every render
  const calculateGrid = useMemo(() => {
    if (!containerRef.current) return { rows: 3, cols: isMobile ? 2 : 4 };

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
    if (!containerRef.current || viewType === "list") {
      // For list view, positions are handled by flex layout, not this effect.
      // Or, if you want specific list positioning, handle it here.
      // For now, clearing positions for list view or if container isn't ready.
      setPositions([]); 
      return;
    }

    const boardWidth = containerRef.current.clientWidth;
    const boardHeight = containerRef.current.clientHeight;

    const calculateDynamicPosition = (index: number, totalCards: number, cols: number) => {
      const preferredRow = Math.floor(index / cols);
      const preferredCol = index % cols;
      const cellWidth = 100 / cols;
      const cellHeight = 100 / calculateGrid.rows; // calculateGrid.rows comes from useMemo

      let baseLeft = preferredCol * cellWidth + (cellWidth - effectiveCardWidth) / 2;
      let baseTop = preferredRow * cellHeight + (cellHeight - effectiveCardHeight) / 2;

      baseLeft = Math.max(5, Math.min(95 - effectiveCardWidth, baseLeft));
      baseTop = Math.max(5, Math.min(95 - effectiveCardHeight, baseTop));
      
      if (totalCards === 1) {
        baseTop = 10;
        baseLeft = 50 - effectiveCardWidth / 2;
      }

      const randomFactor = spreadFactor; // Simplified for example
      const randomOffsetX = (((Math.random() - 0.5) * randomFactor) / 100) * cellWidth;
      const randomOffsetY = (((Math.random() - 0.5) * randomFactor) / 100) * cellHeight;
      
      return {
        left: Math.max(5, Math.min(95 - effectiveCardWidth, baseLeft + randomOffsetX)),
        top: Math.max(5, Math.min(95 - effectiveCardHeight, baseTop + randomOffsetY)),
        rotate: Math.random() * rotationRange * 2 - rotationRange,
        zIndex: totalCards - index,
      };
    };
    
    const newCardPositions = currentMonthEvents.map((event, index) => {
      if (event.positionX != null && event.positionY != null) {
        // Use persistent position if available
        return {
          left: event.positionX,
          top: event.positionY,
          // Apply rotation if desired, or set to 0 for fixed cards
          rotate: Math.random() * rotationRange * 2 - rotationRange, 
          zIndex: currentMonthEvents.length - index, // Or a fixed zIndex for draggable items
        };
      } else {
        // Fallback to dynamic calculation
        // This part needs the grid calculation logic similar to what was there before
        // For simplicity, let's assume a basic dynamic positioning if not set.
        // The original logic for dynamic positioning was more complex and involved overlap checks.
        // This simplified version just distributes them.
        const { cols } = calculateGrid;
        return calculateDynamicPosition(index, currentMonthEvents.length, cols);
      }
    });

    // This simple version doesn't handle overlap for dynamically placed cards.
    // The original `calculatePositions` had more sophisticated logic for that.
    // For persistent positions, overlap is user's responsibility or needs more UI.
    if (JSON.stringify(newCardPositions) !== JSON.stringify(positionsRef.current)) {
        positionsRef.current = newCardPositions;
        setPositions(newCardPositions);
    }

    const handleResize = () => {
        // Re-calculate positions on resize, especially for dynamically placed cards
        // or if percentage-based persistent positions need updates relative to new container size.
        // This might be complex if mixing pixel and percentage, but if all are % it's simpler.
        // For now, just re-triggering the logic based on currentMonthEvents:
        const recalculatedPositions = currentMonthEvents.map((event, index) => {
            if (event.positionX != null && event.positionY != null) {
                return { left: event.positionX, top: event.positionY, rotate: Math.random() * rotationRange * 2 - rotationRange, zIndex: currentMonthEvents.length - index };
            } else {
                const { cols } = calculateGrid;
                return calculateDynamicPosition(index, currentMonthEvents.length, cols);
            }
        });
        positionsRef.current = recalculatedPositions;
        setPositions(recalculatedPositions);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);

  }, [
    currentMonthEvents, 
    viewType, 
    effectiveCardWidth, 
    effectiveCardHeight, 
    spreadFactor, 
    rotationRange, 
    calculateGrid, // ensure calculateGrid is stable or correctly dependency-tracked
    // padding, // padding was used in doCardsOverlap, not directly in position calc here
  ]);

  // Prepare card refs array (seems okay)
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
          <div
            ref={containerRef}
            // M3: Apply surface color and ensure padding aligns with M3 specs (e.g., 16dp or 24dp)
            className={`flex-1 p-4 md:p-6 w-full ${ // Adjusted padding
              viewType === "noticeboard" ? background : "bg-surface-variant" // Use surface-variant for list background
            } overflow-auto relative`}
          >
            <div className={`relative h-full w-full ${viewType === "list" ? "flex flex-col gap-4 p-1 md:p-2" : ""}`}> {/* Adjusted list padding */}
              {currentMonthEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  ref={(el: HTMLDivElement | null) => cardRefs.current[index] = el}
                  className={`${viewType === "noticeboard" ? "absolute" : ""} cursor-pointer`} // Simpler class for noticeboard
                  style={
                    viewType === "noticeboard" && positions[index]
                      ? {
                          left: `${positions[index].left}%`,
                          top: `${positions[index].top}%`,
                          zIndex: positions[index].zIndex,
                          // transform: `rotate(${positions[index].rotate}deg)`, // Applied by motion.div animate
                        }
                      : {}
                  }
                  drag={viewType === "noticeboard" && session?.user?.id === event.authorId}
                  dragConstraints={containerRef}
                  dragMomentum={false} // Prevents card from sliding after drag
                  onDragEnd={async (_e, info) => {
                    if (!containerRef.current) return;
                    const boardWidth = containerRef.current.offsetWidth;
                    const boardHeight = containerRef.current.offsetHeight;
                    
                    // Calculate new position as percentage
                    // info.point.x/y are absolute viewport coordinates
                    // info.offset.x/y are relative to drag start
                    // We need the card's new top-left relative to the container.
                    // The `style` object on the element itself will have the pixel values.
                    const cardElement = cardRefs.current[index];
                    if (cardElement) {
                        const newLeftPx = parseFloat(cardElement.style.left);
                        const newTopPx = parseFloat(cardElement.style.top);

                        const newPositionX = (newLeftPx / boardWidth) * 100;
                        const newPositionY = (newTopPx / boardHeight) * 100;

                        // Ensure positions are within bounds (e.g., 0-95% to keep card on board)
                        const boundedPositionX = Math.max(0, Math.min(newPositionX, 100 - effectiveCardWidth));
                        const boundedPositionY = Math.max(0, Math.min(newPositionY, 100 - effectiveCardHeight));


                        try {
                            const response = await fetch(`/api/events/${event.id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ positionX: boundedPositionX, positionY: boundedPositionY }),
                            });
                            if (!response.ok) throw new Error('Failed to update position');
                            const updatedEventFromServer = await response.json();
                            onEventUpdated(updatedEventFromServer); // Update local state
                            toast.success("Position saved!");
                        } catch (err) {
                            toast.error("Failed to save position.");
                            // Potentially revert position visually if API call fails
                        }
                    }
                  }}
                  initial={false} // Don't animate initial render based on these, use explicit initial animation
                  animate={ viewType === "noticeboard" && positions[index] ? { // Animate to new position if it changes
                    left: `${positions[index].left}%`,
                    top: `${positions[index].top}%`,
                    rotate: positions[index].rotate,
                    scale: 1,
                    opacity: 1,
                  } : { // Default for list items or when positions are not yet available
                    scale: 1, // Ensure list items are scaled correctly
                    opacity: 1, // Ensure list items are visible
                    // No positional animation for list items, handled by flex/grid
                  }}
                  // M3 Motion: "Emphasized" for appearing elements.
                  // This variant is for the card appearing on the board.
                  variants={{
                    hidden: { opacity: 0, scale: 0.85, y: 20 },
                    visible: (i) => ({
                        opacity: 1,
                        scale: 1,
                        y: 0,
                        transition: { 
                          delay: i * 0.04, // Slightly faster stagger
                          type: "spring", 
                          stiffness: 380, 
                          damping: 35 
                        }
                    })
                  }}
                   initial="hidden" 
                   animate="visible"
                   exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.15 } }} // Faster exit
                   layout // Animate layout changes (e.g. when filtering)
                   transition={{ type: "spring", stiffness: 400, damping: 40 }} // M3: Shared axis transitions
                  whileHover={
                    viewType === "noticeboard" && positions[index] ? {
                      scale: 1.05, // More prominent scale from the second original prop
                      zIndex: (positions[index].zIndex || 0) + 1000, // Dynamic zIndex from the first original prop
                      transition: { type: "spring", stiffness: 400, damping: 15 } // Quick pop from the second original prop
                    } : {
                      // Optional: Define a subtle hover for list view if desired, e.g.
                      // scale: 1.01,
                      // backgroundColor: "hsl(var(--surface-variant-hover))", // Assuming such a variable exists
                    }
                  }
                  onClick={() => handleCardClick(event, index)}
                >
                  <EventCard // EventCard itself is now M3 styled
                    eventDetails={event} // Pass full eventDetails
                    // pinColor logic might need update based on new data
                    pinColor={event.category === "Important" ? "blue" : "red"} // Example adjustment
                    hoverEffect="scale"
                    // Pass session and handlers for share/fork/delete
                    currentUserId={session?.user?.id}
                    onDelete={() => onEventDeleted(event.id)} 
                    onUpdate={onEventUpdated} // For share/visibility changes directly from card/modal
                    onFork={() => handleForkEvent(event.id)}
                    size={isMobile ? "medium" : cardSize}
                    viewType={viewType}
                  />
                </motion.div>
              ))}
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50">
                  <p className="text-lg text-gray-700">Loading events...</p>
                </div>
              )}
              {!isLoading && error && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50 p-4">
                  <p className="text-lg text-red-600 mb-2">Error loading events:</p>
                  <p className="text-sm text-red-500 mb-4">{error}</p>
                  <Button onClick={fetchEvents}>Try Again</Button>
                </div>
              )}
              {!isLoading && !error && currentMonthEvents.length === 0 && (
                <div className="flex items-center justify-center h-full w-full">
                  {/* M3 Empty State: Use appropriate typography and surface color */}
                  <div className="text-center p-8 bg-surface-variant rounded-xl shadow-sm"> 
                    <h3 className="text-headline-sm text-on-surface-variant mb-2">No events this month</h3>
                    <p className="text-body-md text-on-surface-variant/80">
                      {selectedCategories.length > 0
                        ? "Try selecting different categories or changing the month."
                        : "Try selecting a different month or adding new events."}
                    </p>
                  </div>
                </div>
              )}
            </div>
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
                      currentUserId={session?.user?.id}
                      onEventUpdated={onEventUpdated} // For updates from modal (e.g. share)
                      onEventDeleted={() => onEventDeleted(selectedEvent.id)} // For delete from modal
                      onEventForked={handleForkEvent} // For fork from modal
                    />
                  )}
                </AnimatePresence>
          
                <EventForm
                  isOpen={isFormOpen}
                  onClose={() => setIsFormOpen(false)}
                  onEventCreated={onEventCreated} // Updated prop
                  categories={categories} // Pass existing categories or fetch them if dynamic
                />
              </div>
        </div>
  );
}

// Helper function to handle forking, can be part of NoticeBoard
async function handleForkEvent(eventId: string) {
  try {
    const response = await fetch(`/api/events/${eventId}/fork`, { method: 'POST' });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Error: ${response.status}`);
    }
    const forkedEvent: EventDetails = await response.json(); // Assuming API returns the forked event
    toast.success(`Event "${forkedEvent.name}" forked successfully!`);
    // Here, you would typically call fetchEvents() or add the forkedEvent to the state
    // For simplicity, assuming fetchEvents() will be called or state updated elsewhere
    // This might require making fetchEvents accessible or passing a callback.
    // For now, we'll rely on a manual refresh or a subsequent fetchEvents call.
    // Example: onEventForkedSuccess(forkedEvent);
  } catch (err: any) {
    console.error("Failed to fork event:", err);
    toast.error("Failed to fork event: " + err.message);
  }
}


export default NoticeBoard;
