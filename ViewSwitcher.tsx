"use client"

import type React from "react"
import { LayoutGrid, Rows, PinIcon } from "lucide-react"

interface ViewSwitcherProps {
  currentView: "noticeboard" | "grid" | "list"
  onViewChange: (view: "noticeboard" | "grid" | "list") => void
}

const ViewSwitcher: React.FC<ViewSwitcherProps> = ({ currentView, onViewChange }) => {
  return (
    <div className="flex items-center justify-between p-4 bg-white border-b">
      <h1 className="text-xl font-bold">Event Board</h1>

      <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-md">
        <button
          className={`p-2 rounded-md transition-colors ${
            currentView === "noticeboard" ? "bg-white shadow-sm" : "hover:bg-gray-200"
          }`}
          onClick={() => onViewChange("noticeboard")}
          aria-label="Noticeboard view"
          title="Noticeboard view"
        >
          <PinIcon size={20} />
        </button>

        <button
          className={`p-2 rounded-md transition-colors ${
            currentView === "grid" ? "bg-white shadow-sm" : "hover:bg-gray-200"
          }`}
          onClick={() => onViewChange("grid")}
          aria-label="Grid view"
          title="Grid view"
        >
          <LayoutGrid size={20} />
        </button>

        <button
          className={`p-2 rounded-md transition-colors ${
            currentView === "list" ? "bg-white shadow-sm" : "hover:bg-gray-200"
          }`}
          onClick={() => onViewChange("list")}
          aria-label="List view"
          title="List view"
        >
          <Rows size={20} />
        </button>
      </div>
    </div>
  )
}

export default ViewSwitcher
