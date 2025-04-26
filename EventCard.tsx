"use client"

import type React from "react"

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
  viewType?: "noticeboard" | "grid" | "list"
}

const EventCard: React.FC<EventCardProps> = ({
  eventDetails,
  pinColor = "red",
  hoverEffect = "none",
  size = "medium",
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
    } else if (viewType === "grid") {
      return "w-full h-full"
    } else {
      return sizeClasses[size]
    }
  }

  // Render different layouts based on view type
  if (viewType === "list") {
    return (
      <div className={`${getSizeClass()} transform transition-transform duration-300`}>
        <div className="w-full h-full bg-white rounded-md shadow-lg overflow-hidden border border-gray-200 flex">
          {/* Image */}
          <div className="w-1/4 overflow-hidden">
            <img
              src={eventDetails.image || "/placeholder.svg"}
              alt={eventDetails.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Content */}
          <div className="p-4 flex-1 flex flex-col">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg mb-1">{eventDetails.name}</h3>
                <p className="text-sm text-gray-600 mb-1">{eventDetails.date}</p>
              </div>
              <span className="text-sm font-semibold bg-gray-100 px-2 py-1 rounded-full">{eventDetails.price}</span>
            </div>
            <p className="text-sm text-gray-600 mb-2">{eventDetails.location}</p>
            <p className="text-sm text-gray-700 line-clamp-2 mt-auto">{eventDetails.description}</p>
          </div>
        </div>
      </div>
    )
  }

  if (viewType === "grid") {
    return (
      <div className={`${getSizeClass()} transform transition-transform duration-300`}>
        <div className="w-full h-full bg-white rounded-md shadow-lg overflow-hidden border border-gray-200">
          {/* Image */}
          <div className="w-full h-1/2 overflow-hidden">
            <img
              src={eventDetails.image || "/placeholder.svg"}
              alt={eventDetails.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Content */}
          <div className="p-4 h-1/2 flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-base line-clamp-1">{eventDetails.name}</h3>
              <span className="text-xs font-semibold bg-gray-100 px-2 py-1 rounded-full">{eventDetails.price}</span>
            </div>
            <p className="text-xs text-gray-600 mb-1">{eventDetails.date}</p>
            <p className="text-xs text-gray-600 mb-2 line-clamp-1">{eventDetails.location}</p>
            <p className="text-xs text-gray-700 line-clamp-2 mt-auto">{eventDetails.description}</p>
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
        <div className="w-full h-1/2 overflow-hidden">
          <img
            src={eventDetails.image || "/placeholder.svg"}
            alt={eventDetails.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content */}
        <div className="p-3 h-1/2 flex flex-col">
          <h3 className="font-bold text-sm mb-1 line-clamp-1">{eventDetails.name}</h3>
          <p className="text-xs text-gray-600 mb-1">{eventDetails.date}</p>
          <p className="text-xs text-gray-600 mb-1 line-clamp-1">{eventDetails.location}</p>
          <div className="mt-auto">
            <span className="text-xs font-semibold">{eventDetails.price}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EventCard
