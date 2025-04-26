"use client"

import type React from "react"
import { useEffect } from "react"
import { motion } from "framer-motion"
import { X } from "lucide-react"

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

interface EventModalProps {
  event: EventDetails
  isOpen: boolean
  onClose: () => void
  sourceRect: DOMRect | null
  layoutId: string
}

const EventModal: React.FC<EventModalProps> = ({ event, isOpen, onClose, sourceRect, layoutId }) => {
  // Close modal on escape key press
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    window.addEventListener("keydown", handleEscapeKey)
    return () => window.removeEventListener("keydown", handleEscapeKey)
  }, [onClose])

  // Calculate initial position based on source rect
  const getInitialPosition = () => {
    if (!sourceRect) return {}

    return {
      position: "absolute" as const,
      left: sourceRect.left,
      top: sourceRect.top,
      width: sourceRect.width,
      height: sourceRect.height,
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-auto"
      onClick={onClose}
    >
      <motion.div
        layoutId={layoutId}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-auto bg-white rounded-lg shadow-xl"
        initial={sourceRect ? getInitialPosition() : { scale: 0.9, y: 20 }}
        animate={{
          scale: 1,
          y: 0,
          left: undefined,
          top: undefined,
          width: undefined,
          height: undefined,
          position: "relative",
        }}
        exit={sourceRect ? getInitialPosition() : { scale: 0.9, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          className="absolute top-4 right-4 p-1 rounded-full bg-white/80 hover:bg-white text-gray-700 hover:text-gray-900 transition-colors z-10"
          onClick={onClose}
        >
          <X size={24} />
        </button>

        {/* Event image */}
        <div className="relative w-full h-64 overflow-hidden">
          <img src={event.image || "/placeholder.svg"} alt={event.name} className="w-full h-full object-cover" />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            <div className="inline-block px-3 py-1 rounded-full bg-white/90 text-sm font-medium text-gray-800 mb-2">
              {event.category}
            </div>
            <h2 className="text-2xl font-bold text-white">{event.name}</h2>
          </div>
        </div>

        {/* Event details */}
        <div className="p-6">
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center">
              <div className="mr-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <span className="text-gray-700">{event.date}</span>
            </div>
            <div className="flex items-center">
              <div className="mr-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <span className="text-gray-700">{event.location}</span>
            </div>
            <div className="flex items-center">
              <div className="mr-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <span className="text-gray-700">{event.price}</span>
            </div>
          </div>

          <div className="prose max-w-none">
            <h3 className="text-lg font-semibold mb-2">About this event</h3>
            <p className="text-gray-700 whitespace-pre-line">{event.description}</p>
          </div>

          <div className="mt-8">
            <button className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-lg shadow-md hover:from-purple-700 hover:to-indigo-700 transition-colors">
              Register for this event
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default EventModal
