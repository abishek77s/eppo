"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Filter, X } from "lucide-react"

interface FilterBarProps {
  categories: string[]
  selectedCategories: string[]
  onFilterChange: (categories: string[]) => void
}

const FilterBar: React.FC<FilterBarProps> = ({ categories, selectedCategories, onFilterChange }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [localSelected, setLocalSelected] = useState<string[]>(selectedCategories)

  useEffect(() => {
    setLocalSelected(selectedCategories)
  }, [selectedCategories])

  const handleToggleCategory = (category: string) => {
    const newSelected = localSelected.includes(category)
      ? localSelected.filter((c) => c !== category)
      : [...localSelected, category]

    setLocalSelected(newSelected)
    onFilterChange(newSelected)
  }

  const handleClearFilters = () => {
    setLocalSelected([])
    onFilterChange([])
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-md transition-colors flex items-center gap-1 ${
          selectedCategories.length > 0 ? "bg-blue-100 text-blue-700" : "bg-gray-100 hover:bg-gray-200"
        }`}
        aria-label="Filter events"
        title="Filter events"
      >
        <Filter size={18} />
        {selectedCategories.length > 0 && <span className="text-xs font-medium">{selectedCategories.length}</span>}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 p-3 z-50 w-64">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium text-sm">Filter by category</h3>
            <button
              onClick={handleClearFilters}
              className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <X size={12} />
              Clear all
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mt-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleToggleCategory(category)}
                className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                  localSelected.includes(category)
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default FilterBar
