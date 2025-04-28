"use client"

import type React from "react"

import { motion, AnimatePresence } from "framer-motion"
import { Calendar, MapPin, DollarSign } from "lucide-react"

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

interface EventPopupProps {
  event: EventDetails | null
  position: { x: number; y: number } | null
  isVisible: boolean
}

const EventPopup: React.FC<EventPopupProps> = ({ event, position, isVisible }) => {
  if (!event || !position) return null

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed z-40 w-64 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
          style={{
            left: position.x,
            top: position.y,
            transformOrigin: "bottom center",
          }}
          initial={{ opacity: 0, scale: 0.8, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: -20 }}
          exit={{ opacity: 0, scale: 0.8, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="p-3">
            <h3 className="font-bold text-sm mb-2">{event.name}</h3>
            <div className="flex items-center text-xs text-gray-600 mb-1">
              <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
              <span>{event.date}</span>
            </div>
            <div className="flex items-center text-xs text-gray-600 mb-1">
              <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="line-clamp-1">{event.location}</span>
            </div>
            <div className="flex items-center text-xs text-gray-600">
              <DollarSign className="h-3 w-3 mr-1 flex-shrink-0" />
              <span>{event.price}</span>
            </div>
          </div>
          <div className="bg-gray-50 px-3 py-2 text-xs text-center">Click for more details</div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default EventPopup
