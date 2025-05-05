"use client"

import type React from "react"
import { motion } from "framer-motion"

interface MonthScrollbarProps {
  currentMonth: number
  onMonthChange: (month: number) => void
  orientation?: "horizontal" | "vertical" | "auto"
}

const MonthScrollbar: React.FC<MonthScrollbarProps> = ({
  currentMonth,
  onMonthChange,
  orientation = "auto",
}) => {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const Horizontal = (
    <div className="w-full bg-white border-t border-gray-200 flex items-center overflow-x-auto fixed bottom-0 left-0 z-10">
      <div className="flex px-2 w-full justify-evenly">
        {months.map((month, index) => (
          <div
            key={month}
            className={`relative cursor-pointer px-2 py-2 whitespace-nowrap ${
              currentMonth === index ? "font-bold" : "text-gray-500 hover:text-gray-800"
            }`}
            onClick={() => onMonthChange(index)}
          >
            {currentMonth === index && (
              <motion.div
                layoutId="activeMonthHorizontal"
                className="absolute inset-0 bg-blue-50 rounded-md z-0"
                initial={false}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <span className="relative z-10 text-sm">{month.substring(0, 3)}</span>
          </div>
        ))}
      </div>
    </div>
  )

  const Vertical = (
    <div className="w-full h-full bg-white border-r border-gray-200 flex flex-col">
      
      <div className="flex-1 overflow-auto py-2">
        {months.map((month, index) => (
          <div
            key={month}
            className={`relative cursor-pointer px-2 py-3 text-center ${
              currentMonth === index ? "font-bold" : "text-gray-500 hover:text-gray-800"
            }`}
            onClick={() => onMonthChange(index)}
          >
            {currentMonth === index && (
              <motion.div
                layoutId="activeMonthVertical"
                className="absolute inset-0 bg-blue-50 rounded-md z-0"
                initial={false}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <span className="relative z-10 text-sm">{month.substring(0, 3)}</span>
          </div>
        ))}
      </div>
    </div>
  )

  if (orientation === "horizontal") return Horizontal
  if (orientation === "vertical") return Vertical

  // Default: auto (responsive)
  return (
    <>
      <div className="hidden md:block">{Vertical}</div>
      <div className="block md:hidden">{Horizontal}</div>
    </>
  )
}

export default MonthScrollbar
