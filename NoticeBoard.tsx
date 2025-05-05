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

const STORAGE_KEY = "noticeboard_events"

const NoticeBoard: React.FC<NoticeboardProps> = ({
  events: initialEvents,
  spreadFactor = 60, // Reduced spread factor to keep cards more organized
  rotationRange = 5, // Reduced rotation for better readability
  gridRows,
  gridCols,
  cardWidth = 15,
  cardHeight = 25,
  padding = 5,
  background = "bg-slate-200 bg-[radial-gradient(#cccccc_5%,#fff_5%)] bg-[length:50px_50px]",
  cardSize = "medium",
}) => {
  const [events, setEvents] = useState<EventDetails[]>(initialEvents)
  const [positions, setPositions] = useState<Position[]>([])
  const [selectedEvent, setSelectedEvent] = useState<EventDetails | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [clickedCardRect, setClickedCardRect] = useState<DOMRect | null>(null)
  const [viewType, setViewType] = useState<ViewType>("noticeboard")
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth())
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const positionsRef = useRef<Position[]>([])

  // Check if we're on mobile
  const isMobile = useMediaQuery("(max-width: 768px)")

  // Adjust card size for mobile
  const mobileCardWidth = isMobile ? 40 : cardWidth // Wider cards on mobile
  const mobileCardHeight = isMobile ? 35 : cardHeight // Taller cards on mobile
  const effectiveCardWidth = mobileCardWidth
  const effectiveCardHeight = mobileCardHeight

  // Load events from localStorage on initial render
  useEffect(() => {
    const loadEvents = () => {
      try {
        const storedEvents = localStorage.getItem(STORAGE_KEY)
        if (storedEvents) {
          const parsedEvents = JSON.parse(storedEvents) as EventDetails[]
          setEvents(parsedEvents)
        }
      } catch (error) {
        console.error("Failed to load events from localStorage:", error)
      }
    }

    loadEvents()
  }, [])

  // Save events to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events))
    } catch (error) {
      console.error("Failed to save events to localStorage:", error)
    }
  }, [events])

  // Extract unique categories from events
  const categories = useMemo(() => {
    const uniqueCategories = new Set<string>()
    events.forEach((event) => {
      if (event.category) {
        uniqueCategories.add(event.category)
      }
    })
    return Array.from(uniqueCategories)
  }, [events])

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
    setIsFormOpen(true)
  }

  // Handle saving a new event
  const handleSaveEvent = (newEvent: Omit<EventDetails, "id">) => {
    const newId = Math.max(0, ...events.map((e) => e.id)) + 1
    const eventWithId = { ...newEvent, id: newId }
    setEvents((prevEvents) => [...prevEvents, eventWithId])
    setIsFormOpen(false)
  }

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
        <ViewSwitcher
          currentView={viewType}
          onViewChange={setViewType}
          categories={categories}
          selectedCategories={selectedCategories}
          onFilterChange={handleFilterChange}
          onAddEvent={handleAddEvent}
        />

        <div
          ref={containerRef}
          className={`flex-1 p-4 md:p-8 w-full ${
            viewType === "noticeboard" ? background : "bg-gray-50"
          } overflow-auto relative`}
        >
          <div className={`relative h-full w-full ${viewType === "list" ? "flex flex-col gap-4 p-2" : ""}`}>
            {currentMonthEvents.map((event, index) => (
              <motion.div
                key={event.id}
                ref={(el) => (cardRefs.current[index] = el)}
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
                  eventDetails={event}
                  pinColor={event.category === "featured" ? "blue" : "red"}
                  hoverEffect="scale"
                  size={isMobile ? "medium" : cardSize}
                  viewType={viewType}
                />
              </motion.div>
            ))}

            {currentMonthEvents.length === 0 && (
              <div className="flex items-center justify-center h-full w-full">
                <div className="text-center p-8 bg-white/80 rounded-lg shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No events this month</h3>
                  <p className="text-gray-500">
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

      {/* Full event modal */}
      <AnimatePresence>
        {isModalOpen && selectedEvent && (
          <EventModal
            event={selectedEvent}
            isOpen={isModalOpen}
            onClose={closeModal}
            sourceRect={clickedCardRect}
            isMobile={isMobile}
          />
        )}
      </AnimatePresence>

      {/* Event form */}
      <EventForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveEvent}
        categories={categories}
      />
    </div>
  )
}

export default NoticeBoard
