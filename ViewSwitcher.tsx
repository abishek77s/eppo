"use client"

import type React from "react"
import { Rows, PinIcon, Plus } from "lucide-react"
import FilterBar from "./FilterBar"

interface ViewSwitcherProps {
  currentView: "noticeboard" | "list"
  onViewChange: (view: "noticeboard" | "list") => void
  categories: string[]
  selectedCategories: string[]
  onFilterChange: (categories: string[]) => void
  onAddEvent: () => void
}

const ViewSwitcher: React.FC<ViewSwitcherProps> = ({
  currentView,
  onViewChange,
  categories,
  selectedCategories,
  onFilterChange,
  onAddEvent,
}) => {
  return (
    <div className="flex items-center justify-between px-4 p-3 bg-white border-b">
      <div className="flex  items-center gap-2">
        <h1 className="text-xl font-bold">eppo</h1>
        <p> /Kollywood Blockbusters </p>
        <p> /2025 </p>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={onAddEvent}
          className="p-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-1"
          aria-label="Add event"
          title="Add event"
        >
          <Plus size={18} />
          <span className="text-sm">Add Event</span>
        </button>

        <FilterBar categories={categories} selectedCategories={selectedCategories} onFilterChange={onFilterChange} />

        <div className="bg-gray-100 p-1 rounded-md flex">
          <button
            className={`p-2 rounded-md transition-colors ${
              currentView === "noticeboard" ? "bg-white shadow-sm" : "hover:bg-gray-200"
            }`}
            onClick={() => onViewChange("noticeboard")}
            aria-label="Noticeboard view"
            title="Noticeboard view"
          >
            <PinIcon size={18} />
          </button>

          <button
            className={`p-2 rounded-md transition-colors ${
              currentView === "list" ? "bg-white shadow-sm" : "hover:bg-gray-200"
            }`}
            onClick={() => onViewChange("list")}
            aria-label="List view"
            title="List view"
          >
            <Rows size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default ViewSwitcher
