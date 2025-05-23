"use client"

import type React from "react"
import { Calendar, MapPin, DollarSign } from "lucide-react"

import { Pin, PinOff } from "lucide-react"; // Import icons for pinning

// Assuming EventDetails will include isPinned, positionX, positionY from ApiEvent
interface EventDetails {
  id: number;
  image: string;
  name: string;
  date: string;
  location: string;
  description: string;
  price: string;
  category: string;
  isPinned?: boolean; // Added for pinning visual
  positionX?: number | null; // For positioning logic if needed directly in card
  positionY?: number | null; // For positioning logic if needed directly in card
}

interface EventCardProps {
  eventDetails: EventDetails;
  pinColor?: "red" | "blue" | "green" | "yellow"; // This existing prop might conflict or be combined with isPinned visual
  hoverEffect?: "scale" | "rotate" | "lift" | "none";
  size?: "small" | "medium" | "large";
  viewType?: "noticeboard" | "list";
  onPinToggle?: () => void; // Callback for pin/unpin action
  canPin?: boolean; // To enable/disable pin button based on permissions
  // isPinned prop is now part of eventDetails
}

const EventCard: React.FC<EventCardProps> = ({
  eventDetails,
  // pinColor prop is kept for the top decorative pin, can be removed if new pin icon is sufficient
  pinColor = "red", 
  hoverEffect = "none",
  size = "small",
  viewType = "noticeboard",
  onPinToggle,
  canPin = false, // Default to false, NoticeBoard will control this
}) => {
  const isActuallyPinned = eventDetails.isPinned; // Use isPinned from eventDetails

  const sizeClasses = {
    small: "w-32 h-48",
    medium: "w-48 h-64",
    large: "w-64 h-80",
  }

  // Pin color mappings
  const pinColors = {
    red: "bg-red-500",
    blue: "bg-blue-500",
    green: "bg-green-500",
    yellow: "bg-yellow-500",
  }

  // Get size based on view type
  const getSizeClass = () => {
    if (viewType === "list") {
      return "w-full h-full"
    } else {
      return sizeClasses[size]
    }
  }

  // Render different layouts based on view type
  if (viewType === "list") {
    return (
      <div className={`${getSizeClass()} transform transition-transform duration-300`}>
        <div className="w-full bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 flex h-24 md:h-28">
          {/* Image */}
          <div className="w-24 md:w-32 overflow-hidden">
            <img
              src={eventDetails.image || "/placeholder.svg"}
              alt={eventDetails.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Content */}
          <div className="p-3 flex-1 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-sm md:text-base line-clamp-1">{eventDetails.name}</h3>
              <div className="flex items-center text-xs text-gray-600 mt-1">
                <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
                <span className="line-clamp-1">{eventDetails.date}</span>
              </div>
              <div className="flex items-center text-xs text-gray-600 mt-1">
                <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                <span className="line-clamp-1">{eventDetails.location}</span>
              </div>
            </div>
            <div className="flex justify-between items-center mt-1">

              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{eventDetails.category}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Default noticeboard view
  return (
    <div className={`relative ${getSizeClass()} transform transition-transform duration-300 ${isActuallyPinned ? 'border-2 border-blue-500 shadow-xl' : 'border border-gray-200'}`}>
      {/* Original Decorative Pin - can be shown or hidden based on isActuallyPinned or kept as is */}
      {!isActuallyPinned && ( // Only show decorative pin if not "actually" pinned via functionality
         <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
           <div className={`w-4 h-4 rounded-full ${pinColors[pinColor]} shadow-md`}></div>
           <div className="w-0.5 h-3 bg-gray-800/50 mx-auto"></div>
         </div>
      )}

      {/* Card content */}
      <div className={`w-full h-full bg-white rounded-md shadow-lg overflow-hidden ${isActuallyPinned ? '' : ''}`}>
        {/* Image */}
        <div className="w-full h-4/5 overflow-hidden relative"> {/* Adjusted height for content visibility */}
          <img
            src={eventDetails.image || "/placeholder.svg"}
            alt={eventDetails.name}
            className="w-full h-full object-cover"
          />
          {/* Pin/Unpin Button - visible in noticeboard view if canPin */}
          {viewType === "noticeboard" && canPin && onPinToggle && (
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent card click event if button is clicked
                onPinToggle();
              }}
              className={`absolute top-1 right-1 p-1.5 rounded-full text-white 
                          ${isActuallyPinned ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-500/70 hover:bg-gray-700/90'} 
                          focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 z-20`}
              title={isActuallyPinned ? "Unpin Event" : "Pin Event"}
            >
              {isActuallyPinned ? <PinOff size={14} /> : <Pin size={14} />}
            </button>
          )}
           {isActuallyPinned && ( // Visual indicator for pinned status - e.g. a prominent pin icon on the image
            <div className="absolute top-1 left-1 p-1 bg-blue-500 rounded-full z-20 shadow-lg">
              <Pin size={12} className="text-white" />
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
            <span className="text-xs font-medium text-white">{eventDetails.date}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-2 h-1/5 flex flex-col justify-center"> {/* Adjusted padding and height */}
          <h3 className="font-bold text-xs line-clamp-2">{eventDetails.name}</h3>
          {/* Optionally show location or other details if space allows */}
          {/* <p className="text-xs text-gray-500 line-clamp-1">{eventDetails.location}</p> */}
        </div>
      </div>
    </div>
  )
}

export default EventCard
