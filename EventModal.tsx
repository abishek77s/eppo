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

// Match ApiEvent type used in NoticeBoard
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
  createdAt: string;
  updatedAt: string;
  positionX?: number | null;
  positionY?: number | null;
  isPinned?: boolean;
  pinOrder?: number | null;
}

interface EventModalProps {
  event: ApiEvent;
  isOpen: boolean;
  onClose: () => void;
  sourceRect: DOMRect | null;
  isMobile?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  canEdit?: boolean; // New prop to control edit/delete visibility/state
}

const EventModal: React.FC<EventModalProps> = ({ event, isOpen, onClose, sourceRect, isMobile = false, onEdit, onDelete, canEdit = false }) => {
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
    // Dialog container - M3 uses scrim, already done by bg-black/60 backdrop-blur-sm
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-auto"
      onClick={onClose} // Close on scrim click
    >
      {/* Dialog panel - M3 surface color, shape, elevation */}
      <motion.div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-auto 
                   bg-surface-light dark:bg-surface-dark  /* M3 Surface */
                   text-on-surface-light dark:text-on-surface-dark
                   rounded-lg shadow-m3-elev-3" // M3 Medium radius (12px), M3 elevation level 3
        initial={{ opacity: 0, scale: 0.95, y: 10 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: "spring", damping: 20, stiffness: 250 }}
        onClick={(e) => e.stopPropagation()} 
      >
        {/* Close button - M3 icon button style */}
        <button
          className="absolute top-3 right-3 p-2 rounded-full 
                     hover:bg-surface-variant-light dark:hover:bg-surface-variant-dark 
                     text-on-surface-variant-light dark:text-on-surface-variant-dark 
                     focus:outline-none focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark z-10"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X size={24} />
        </button>

        {/* Event image - responsive height, rounded top corners if image is first element */}
        <div className="relative w-full h-48 sm:h-60 md:h-72 overflow-hidden rounded-t-lg"> {/* Ensure this rounding is visible if bg-surface isn't rounded */}
          <img src={event.image || "/placeholder.svg"} alt={event.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />

          {/* Content over image - M3 type styles */}
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
            <span className="inline-block px-3 py-1 rounded-full 
                             bg-secondary-container-light text-on-secondary-container-light 
                             dark:bg-secondary-container-dark dark:text-on-secondary-container-dark 
                             text-xs font-medium shadow-sm"> {/* M3 Chip style */}
              {event.category}
            </span>
            {/* M3 Display/Headline styles for title */}
            <h2 className="text-2xl sm:text-3xl font-semibold text-white mt-2 line-clamp-2">{event.name}</h2> 
            <p className="text-white/90 text-sm sm:text-base mt-1">{event.date}</p>
          </div>
        </div>

        {/* Event details section */}
        <div className="p-4 md:p-6">
          {/* Action Buttons - M3 styles */}
          {canEdit && (
            <div className="flex justify-end space-x-2 mb-4">
              {/* M3 Filled Button */}
              <button 
                onClick={onEdit}
                disabled={!canEdit}
                className={`px-6 py-2.5 text-sm font-medium rounded-full 
                            bg-primary-light text-on-primary-light dark:bg-primary-dark dark:text-on-primary-dark
                            hover:opacity-90 shadow-m3-elev-1
                            ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Edit
              </button>
              {/* M3 Filled Button (using error colors for destructive action) */}
              <button 
                onClick={onDelete}
                disabled={!canEdit}
                className={`px-6 py-2.5 text-sm font-medium rounded-full 
                            bg-error-light text-on-error-light dark:bg-error-dark dark:text-on-error-dark
                            hover:opacity-90 shadow-m3-elev-1
                            ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Delete
              </button>
            </div>
          )}
          
          {/* About this event - M3 type styles */}
          <div className="mb-6">
             {/* M3 Title Medium/Large */}
            <h3 className="text-lg font-medium text-on-surface-light dark:text-on-surface-dark mb-2">About this event</h3>
            {/* M3 Body Large */}
            <div className="prose prose-sm sm:prose-base max-w-none text-on-surface-variant-light dark:text-on-surface-variant-dark whitespace-pre-line">
              <p>{event.description}</p>
            </div>
          </div>

          {/* Details Grid - M3 list-item like appearance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
            {[
              { icon: <MapPin size={20} className="text-secondary-light dark:text-secondary-dark"/>, label: "Location", value: event.location },
              { icon: <DollarSign size={20} className="text-secondary-light dark:text-secondary-dark"/>, label: "Price", value: event.price },
              { icon: <Tag size={20} className="text-secondary-light dark:text-secondary-dark"/>, label: "Category (already shown)", value: event.category, hidden: true }, 
              { icon: <Calendar size={20} className="text-secondary-light dark:text-secondary-dark"/>, label: "Created", value: event.createdAt ? new Date(event.createdAt).toLocaleDateString() : "N/A" }
            ].map((item, index) => !item.hidden && (
              // M3 List Item structure (conceptual)
              <div key={index} className="flex items-start space-x-3 p-2 rounded-md hover:bg-surface-variant-light/50 dark:hover:bg-surface-variant-dark/50">
                <div className="flex-shrink-0 mt-0.5">{item.icon}</div>
                <div>
                  {/* M3 Label Small/Medium */}
                  <p className="text-xs text-on-surface-variant-light dark:text-on-surface-variant-dark">{item.label}</p>
                  {/* M3 Body Medium/Large */}
                  <p className="text-sm font-medium text-on-surface-light dark:text-on-surface-dark">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default EventModal
