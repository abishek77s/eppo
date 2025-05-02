"use client"
import NoticeBoard from "./NoticeBoard"

// Sample event data
const events = [
  {
    id: 1,
    image: "/retro.jpg?height=300&width=400",
    name: "Summer Music Festival",
    date: "July 15-17, 2023",
    location: "Central Park, New York",
    description:
      "Join us for three days of amazing music featuring top artists from around the world. Food vendors, art installations, and more!\n\nThe festival will feature multiple stages with different genres including rock, pop, electronic, and indie. Don't miss special performances and surprise guests throughout the weekend.",
    price: "$99.00",
    category: "featured",
  },
  {
    id: 2,
    image: "/placeholder.svg?height=300&width=400",
    name: "Tech Conference 2023",
    date: "August 5-7, 2023",
    location: "Convention Center, San Francisco",
    description:
      "The biggest tech conference of the year with keynotes from industry leaders, workshops, and networking opportunities.",
    price: "$199.00",
    category: "conference",
  },
  {
    id: 3,
    image: "/placeholder.svg?height=300&width=400",
    name: "Food & Wine Festival",
    date: "September 10, 2023",
    location: "Waterfront Park, Chicago",
    description: "Taste exquisite dishes and fine wines from renowned chefs and wineries from around the world.",
    price: "$75.00",
    category: "food",
  },
  {
    id: 4,
    image: "/placeholder.svg?height=300&width=400",
    name: "Art Exhibition Opening",
    date: "October 1, 2023",
    location: "Modern Art Gallery, Los Angeles",
    description:
      "Opening night for the new exhibition featuring contemporary artists exploring themes of nature and technology.",
    price: "$25.00",
    category: "art",
  },
  {
    id: 5,
    image: "/placeholder.svg?height=300&width=400",
    name: "Marathon 2023",
    date: "November 12, 2023",
    location: "Downtown, Boston",
    description:
      "Annual marathon event with categories for all skill levels. Register early for discounted entry fees.",
    price: "$50.00",
    category: "sports",
  },
  {
    id: 6,
    image: "/placeholder.svg?height=300&width=400",
    name: "Winter Holiday Market",
    date: "December 1-24, 2023",
    location: "City Square, Seattle",
    description:
      "Shop for unique gifts, enjoy seasonal treats, and experience festive entertainment at our annual holiday market.",
    price: "Free",
    category: "shopping",
  },
  {
    id: 7,
    image: "/placeholder.svg?height=300&width=400",
    name: "New Year's Eve Gala",
    date: "December 31, 2023",
    location: "Grand Hotel, Miami",
    description:
      "Ring in the new year with an elegant gala featuring gourmet dining, live music, and a champagne toast at midnight.",
    price: "$150.00",
    category: "featured",
  },
  {
    id: 8,
    image: "/placeholder.svg?height=300&width=400",
    name: "Film Festival",
    date: "January 15-21, 2024",
    location: "Various Theaters, Austin",
    description: "A week-long celebration of independent cinema with screenings, director Q&As, and industry panels.",
    price: "$85.00",
    category: "entertainment",
  },
  {
    id: 9,
    image: "/placeholder.svg?height=300&width=400",
    name: "Spring Garden Show",
    date: "April 8-10, 2023",
    location: "Botanical Gardens, Portland",
    description: "Explore beautiful garden displays, attend workshops, and shop for plants and garden accessories.",
    price: "$15.00",
    category: "outdoors",
  },
  {
    id: 10,
    image: "/placeholder.svg?height=300&width=400",
    name: "Comic Convention",
    date: "May 20-22, 2023",
    location: "Convention Center, San Diego",
    description: "Meet your favorite comic creators, attend panels, and shop for collectibles at this annual event.",
    price: "$65.00",
    category: "entertainment",
  },
  {
    id: 11,
    image: "/placeholder.svg?height=300&width=400",
    name: "Jazz in the Park",
    date: "June 5, 2023",
    location: "Riverside Park, New Orleans",
    description: "Bring a blanket and enjoy an afternoon of live jazz music in a beautiful outdoor setting.",
    price: "Free",
    category: "music",
  },
  {
    id: 12,
    image: "/placeholder.svg?height=300&width=400",
    name: "Winter Ski Retreat",
    date: "February 10-15, 2023",
    location: "Mountain Resort, Aspen",
    description: "All-inclusive ski retreat with lodging, equipment rentals, and access to premium slopes.",
    price: "$499.00",
    category: "sports",
  },
]

export default function Demo() {
  return (
    <div className="h-screen w-full">
      <NoticeBoard events={events} spreadFactor={70} rotationRange={5} cardSize="medium" />
    </div>
  )
}
