"use client"

import type React from "react"
import { useEffect } from "react"
import { motion } from "framer-motion"
import { X, Calendar, MapPin, DollarSign, Share2, Tag } from "lucide-react"

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
  isMobile?: boolean
}

const EventModal: React.FC<EventModalProps> = ({ event, isOpen, onClose, sourceRect, isMobile = false }) => {
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-auto"
      onClick={onClose}
    >
      <motion.div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-auto bg-white rounded-xl shadow-2xl"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          className="absolute top-4 right-4 p-2 rounded-full bg-white/90 hover:bg-white text-gray-700 hover:text-gray-900 transition-colors z-10 shadow-md"
          onClick={onClose}
        >
          <X size={20} />
        </button>

        {/* Event image */}
        <div className="relative w-full h-72 overflow-hidden">
          <img src={event.image || "/placeholder.svg"} alt={event.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block px-3 py-1 rounded-full bg-white/90 text-sm font-medium text-gray-800">
                {event.category}
              </span>
            
            </div>
            <h2 className="text-3xl font-bold text-white mb-1">{event.name}</h2>
            <p className="text-white/90 text-lg">{event.date}</p>
          </div>
        </div>

        {/* Event details */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
           
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-3">About this event</h3>
            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-line">{event.description}</p>
            </div>
          </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="bg-red-100 p-2 rounded-full">
                <MapPin className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="font-medium">{event.location}</p>
              </div>
            </div>

           

           
          </div>


         
        </div>
      </motion.div>
    </div>
  )
}

export default EventModal
