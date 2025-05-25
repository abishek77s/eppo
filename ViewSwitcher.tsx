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
    // M3: Surface color for app bars/headers, appropriate text colors
    <div className="flex flex-col md:flex-row items-center justify-between gap-3 px-4 py-3 bg-surface text-on-surface border-b border-outline-variant">
      {/* Left section: Title and breadcrumbs */}
      <div className="flex items-center gap-2 self-start md:self-center">
        <h1 className="text-headline-sm font-semibold text-primary">eppo</h1>
        {/* Breadcrumbs: Hide on smaller screens or simplify */}
        <p className="text-title-sm text-on-surface-variant hidden sm:inline"> /Kollywood Blockbusters </p>
        <p className="text-title-sm text-on-surface-variant hidden md:inline"> /2025 </p>
      </div>

      {/* Right section: Actions and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
        {/* Add Event Button: M3 Filled Button. Icon only on xs, text on sm+ */}
        <Button
          onClick={onAddEvent}
          variant="default" // M3 Filled button
          size="default"
          className="w-full sm:w-auto"
          aria-label="Add event"
          title="Add event"
        >
          <Plus size={18} className="sm:mr-2" /> {/* Icon always visible */}
          <span className="hidden sm:inline text-label-lg">Add Event</span> {/* Text visible sm and up */}
        </Button>

        {/* FilterBar: Assuming it's a simple component for now. Responsive handling might be internal to FilterBar. */}
        <FilterBar categories={categories} selectedCategories={selectedCategories} onFilterChange={onFilterChange} />

        {/* View Toggle Buttons: M3 Segmented Button style */}
        <div className="bg-secondary-container p-1 rounded-full flex w-full sm:w-auto justify-center">
          <Button
            variant={currentView === "noticeboard" ? "secondary" : "ghost"} // Active state uses secondary (filled tonal)
            size="sm" // M3 Segmented buttons are often compact
            className={`flex-1 sm:flex-none rounded-full ${currentView === "noticeboard" ? "text-on-secondary-container" : "text-on-surface-variant"}`}
            onClick={() => onViewChange("noticeboard")}
            aria-label="Noticeboard view"
            title="Noticeboard view"
          >
            <PinIcon size={18} />
            <span className="ml-1.5 hidden xs:inline sm:hidden md:inline">Board</span> {/* Adjust text visibility */}
          </Button>

          <Button
             variant={currentView === "list" ? "secondary" : "ghost"}
             size="sm"
             className={`flex-1 sm:flex-none rounded-full ${currentView === "list" ? "text-on-secondary-container" : "text-on-surface-variant"}`}
            onClick={() => onViewChange("list")}
            aria-label="List view"
            title="List view"
          >
            <Rows size={18} />
            <span className="ml-1.5 hidden xs:inline sm:hidden md:inline">List</span> {/* Adjust text visibility */}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ViewSwitcher
