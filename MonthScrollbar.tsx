"use client"

import type React from "react"
import { motion } from "framer-motion"

interface MonthScrollbarProps {
  currentMonth: number
  onMonthChange: (month: number) => void
}

const MonthScrollbar: React.FC<MonthScrollbarProps> = ({ currentMonth, onMonthChange }) => {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  return (
    <div className="w-16 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-3 border-b border-gray-200 text-center">
        <span className="text-sm font-semibold">Months</span>
      </div>
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
                layoutId="activeMonth"
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
}

export default MonthScrollbar
