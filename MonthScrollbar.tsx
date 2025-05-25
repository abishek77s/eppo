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
  orientation = "auto", // 'auto' will use md breakpoint to switch
}) => {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ]; // Shortened for space, especially horizontal

  // M3: Use surface colors, on-surface text, primary for active indicator
  const commonItemClass = "relative cursor-pointer whitespace-nowrap text-center text-label-lg";
  const activeClass = "font-semibold text-primary"; // M3: Primary color for active text
  const inactiveClass = "text-on-surface-variant hover:text-on-surface";

  const motionProps = {
    layoutId: orientation === "horizontal" ? "activeMonthHorizontal" : "activeMonthVertical",
    className: "absolute inset-0 bg-primary-container rounded-md z-0", // M3: Primary container for selection
    initial: false,
    transition: { type: "spring", stiffness: 350, damping: 30 }, // M3 Emphasized Easing
  };

  const Horizontal = (
    // M3: Bottom app bars / navigation often use surface container or surface with elevation
    <div className="w-full bg-surface-variant border-t border-outline-variant flex items-center overflow-x-auto fixed bottom-0 left-0 z-30 h-14 shadow-md">
      {/* Increased height for better touch, shadow for elevation */}
      <div className="flex px-1 w-full justify-around"> {/* justify-around for better spacing */}
        {months.map((month, index) => (
          <div
            key={month}
            className={`${commonItemClass} px-3 py-3.5 ${ // Increased padding for touch
              currentMonth === index ? activeClass : inactiveClass
            }`}
            onClick={() => onMonthChange(index)}
          >
            {currentMonth === index && (
              <motion.div {...motionProps} />
            )}
            <span className="relative z-10">{month}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const Vertical = (
    // M3: Navigation rails or sidebars use surface colors
    <div className="w-full h-full bg-surface-variant border-r border-outline-variant flex flex-col">
      <div className="flex-1 overflow-auto py-2 space-y-1"> {/* Added space-y for separation */}
        {months.map((month, index) => (
          <div
            key={month}
            className={`${commonItemClass} px-2 py-3 mx-1 ${ // Added horizontal margin
              currentMonth === index ? activeClass : inactiveClass
            }`}
            onClick={() => onMonthChange(index)}
          >
            {currentMonth === index && (
              <motion.div {...motionProps} />
            )}
            <span className="relative z-10">{month}</span>
          </div>
        ))}
      </div>
    </div>
  );

  // Default: auto (responsive) - this logic switches based on 'md' breakpoint
  // If 'auto' is desired, it might be better to handle the switch directly via CSS classes
  // or ensure the parent component correctly sets 'horizontal' or 'vertical' based on useMediaQuery.
  // The current 'auto' here renders both and relies on CSS (hidden md:block) which is fine.
  if (orientation === "horizontal") return Horizontal;
  if (orientation === "vertical") return Vertical;
  
  // Fallback for 'auto' if not explicitly handled by parent (NoticeBoard does this)
  return (
    <>
      <div className="hidden md:block h-full">{Vertical}</div> {/* Ensure h-full for vertical */}
      <div className="block md:hidden">{Horizontal}</div>
    </>
  );
};
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
