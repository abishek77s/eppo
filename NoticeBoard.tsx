"use client"

import type React from "react"
import { useState, useEffect, useRef, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import EventCard from "./EventCard"
import EventModal from "./EventModal"
import ViewSwitcher from "./ViewSwitcher"
import MonthScrollbar from "./MonthScrollbar"

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

type ViewType = "noticeboard" | "grid" | "list"

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

const NoticeBoard: React.FC<NoticeboardProps> = ({
  events,
  spreadFactor = 80,
  rotationRange = 8,
  gridRows,
  gridCols,
  cardWidth = 15,
  cardHeight = 25,
  padding = 5,
  background = "bg-slate-200 bg-[radial-gradient(#cccccc_5%,#fff_5%)] bg-[length:50px_50px]",
  cardSize = "medium",
}) => {
  const [positions, setPositions] = useState<Position[]>([])
  const [selectedEvent, setSelectedEvent] = useState<EventDetails | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [clickedCardRect, setClickedCardRect] = useState<DOMRect | null>(null)
  const [viewType, setViewType] = useState<ViewType>("noticeboard")
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth())
  const containerRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const positionsRef = useRef<Position[]>([])

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

  // Get events for the current month - memoized to prevent recalculation on every render
  const currentMonthEvents = useMemo(() => {
    return eventsByMonth[currentMonth] || []
  }, [eventsByMonth, currentMonth])

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

  // Calculate grid dimensions - memoized to prevent recalculation on every render
  const calculateGrid = useMemo(() => {
    if (!containerRef.current) return { rows: 3, cols: 4 }

    const totalCards = currentMonthEvents.length
    if (totalCards === 0) return { rows: 1, cols: 1 }

    const containerWidth = containerRef.current.clientWidth
    const containerHeight = containerRef.current.clientHeight
    const aspectRatio = containerWidth / containerHeight

    // Adjust card dimensions based on view type
    const effectiveCardWidth = viewType === "noticeboard" ? cardWidth : viewType === "grid" ? 25 : 90
    const effectiveCardHeight = viewType === "noticeboard" ? cardHeight : viewType === "grid" ? 30 : 15

    if (!gridRows && !gridCols) {
      // Auto-calculate reasonable grid dimensions
      const calculatedCols = Math.ceil(Math.sqrt(totalCards * aspectRatio))
      const calculatedRows = Math.ceil(totalCards / calculatedCols)

      // For list view, use 1 column
      if (viewType === "list") {
        return { rows: totalCards, cols: 1 }
      }

      return { rows: calculatedRows, cols: calculatedCols }
    }

    return {
      rows: gridRows || Math.ceil(totalCards / (gridCols || 4)),
      cols: gridCols || Math.ceil(totalCards / (gridRows || 3)),
    }
  }, [currentMonthEvents.length, viewType, cardWidth, cardHeight, gridRows, gridCols, containerRef.current])

  // Calculate positions based on view type
  useEffect(() => {
    // Skip calculation if container is not available
    if (!containerRef.current) return

    // Function to calculate positions
    const calculatePositions = () => {
      // Adjust card dimensions based on view type
      const effectiveCardWidth = viewType === "noticeboard" ? cardWidth : viewType === "grid" ? 25 : 90
      const effectiveCardHeight = viewType === "noticeboard" ? cardHeight : viewType === "grid" ? 30 : 15

      // Create a grid-based arrangement
      const gridPositions: Position[] = []

      for (let i = 0; i < currentMonthEvents.length; i++) {
        // Calculate grid cell
        const row = Math.floor(i / calculateGrid.cols)
        const col = i % calculateGrid.cols

        // Calculate cell dimensions
        const cellWidth = 100 / calculateGrid.cols
        const cellHeight = 100 / calculateGrid.rows

        // Position card in its cell with some padding
        let baseLeft = col * cellWidth + (cellWidth - effectiveCardWidth) / 2
        let baseTop = row * cellHeight + (cellHeight - effectiveCardHeight) / 2

        // For list view, stack vertically with no rotation
        if (viewType === "list") {
          const newPos: Position = {
            left: 5, // 5% margin from left
            top: i * (effectiveCardHeight + 2), // Stack with 2% gap
            rotate: 0,
            zIndex: i,
          }
          gridPositions.push(newPos)
          continue
        }

        // For grid view, use regular grid with no rotation and less randomness
        if (viewType === "grid") {
          const randomOffsetX = (((Math.random() - 0.5) * 10) / 100) * cellWidth // Much less randomness
          const randomOffsetY = (((Math.random() - 0.5) * 10) / 100) * cellHeight

          const newPos: Position = {
            left: Math.max(0, Math.min(100 - effectiveCardWidth, baseLeft + randomOffsetX)),
            top: Math.max(0, Math.min(100 - effectiveCardHeight, baseTop + randomOffsetY)),
            rotate: 0, // No rotation
            zIndex: i,
          }
          gridPositions.push(newPos)
          continue
        }

        // For noticeboard view, use controlled randomness
        let attempts = 0
        let newPos: Position
        const maxAttempts = 30 // Increase max attempts to reduce overlap

        do {
          // Calculate random offsets
          const randomOffsetX = (((Math.random() - 0.5) * spreadFactor) / 100) * cellWidth
          const randomOffsetY = (((Math.random() - 0.5) * spreadFactor) / 100) * cellHeight

          // Apply offsets and ensure bounds
          newPos = {
            left: Math.max(0, Math.min(100 - effectiveCardWidth, baseLeft + randomOffsetX)),
            top: Math.max(0, Math.min(100 - effectiveCardHeight, baseTop + randomOffsetY)),
            rotate: Math.random() * rotationRange * 2 - rotationRange,
            zIndex: i, // Default z-index
          }

          // Check against all existing positions
          const overlaps = gridPositions.some((pos) =>
            doCardsOverlap(pos, newPos, effectiveCardWidth, effectiveCardHeight),
          )

          if (!overlaps || attempts > maxAttempts) {
            // Either doesn't overlap or we've tried too many times
            break
          }

          // If we're getting too many attempts, gradually reduce the randomness
          if (attempts > 15) {
            baseLeft = col * cellWidth + (cellWidth - effectiveCardWidth) / 2
            baseTop = row * cellHeight + (cellHeight - effectiveCardHeight) / 2
          }

          attempts++
        } while (attempts <= maxAttempts)

        gridPositions.push(newPos)
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
  }, [currentMonthEvents, spreadFactor, rotationRange, cardWidth, cardHeight, padding, viewType, calculateGrid])

  // Prepare card refs array
  useEffect(() => {
    cardRefs.current = cardRefs.current.slice(0, currentMonthEvents.length)
  }, [currentMonthEvents])

  return (
    <div className="flex h-full w-full">
      {/* Month scrollbar */}
      

      <div className="flex-1 flex flex-col">
        <ViewSwitcher currentView={viewType} onViewChange={setViewType} />

        <div
          ref={containerRef}
          className={`flex-1 p-8 w-full ${viewType === "noticeboard" ? background : "bg-gray-50"} overflow-auto`}
        >
          <div className={`relative h-full w-full ${viewType === "list" ? "flex flex-col gap-2" : ""}`}>
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
                  zIndex: 100,
                  transition: { duration: 0.2 },
                }}
                onClick={() => handleCardClick(event, index)}
                layoutId={`card-${event.id}`}
              >
                <EventCard
                  eventDetails={event}
                  pinColor={event.category === "featured" ? "blue" : "red"}
                  hoverEffect="scale"
                  size={cardSize}
                  viewType={viewType}
                />
              </motion.div>
            ))}

            {currentMonthEvents.length === 0 && (
              <div className="flex items-center justify-center h-full w-full">
                <div className="text-center p-8 bg-white/80 rounded-lg shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No events this month</h3>
                  <p className="text-gray-500">Try selecting a different month or adding new events.</p>
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
            layoutId={`card-${selectedEvent.id}`}
          />
        )}
      </AnimatePresence>
      <MonthScrollbar currentMonth={currentMonth} onMonthChange={handleMonthChange} />
    </div>
  )
}

export default NoticeBoard
