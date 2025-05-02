"use client"

import type React from "react"
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

interface EventCardProps {
  eventDetails: EventDetails
  pinColor?: "red" | "blue" | "green" | "yellow"
  hoverEffect?: "scale" | "rotate" | "lift" | "none"
  size?: "small" | "medium" | "large"
  viewType?: "noticeboard" | "list"
}

const EventCard: React.FC<EventCardProps> = ({
  eventDetails,
  pinColor = "red",
  hoverEffect = "none",
  size = "small",
  viewType = "noticeboard",
}) => {
  // Size mappings
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
              <span className="text-xs font-semibold flex items-center">
                <DollarSign className="h-3 w-3 mr-0.5" />
                {eventDetails.price}
              </span>
              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{eventDetails.category}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Default noticeboard view
  return (
    <div className={`relative ${getSizeClass()} transform transition-transform duration-300`}>
      {/* Pin */}
      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
        <div className={`w-4 h-4 rounded-full ${pinColors[pinColor]} shadow-md`}></div>
        <div className="w-0.5 h-3 bg-gray-800/50 mx-auto"></div>
      </div>

      {/* Card */}
      <div className="w-full h-full bg-white rounded-md shadow-lg overflow-hidden border border-gray-200">
        {/* Image */}
        <div className="w-full h-1/2 overflow-hidden relative">
          <img
            src={eventDetails.image || "/placeholder.svg"}
            alt={eventDetails.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
            <span className="text-xs font-medium text-white">{eventDetails.date}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 h-1/2 flex flex-col">
          <h3 className="font-bold text-sm mb-1 line-clamp-2">{eventDetails.name}</h3>
          <div className="flex items-center text-xs text-gray-600 mb-1">
            <MapPin className="h-3 w-3 mr-1" />
            <span className="line-clamp-1">{eventDetails.location}</span>
          </div>
          <div className="mt-auto flex items-center justify-between">
            <span className="text-xs font-semibold flex items-center">
              <DollarSign className="h-3 w-3 mr-0.5" />
              {eventDetails.price}
            </span>
            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{eventDetails.category}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EventCard
