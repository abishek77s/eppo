"use client"

import type React from "react"
import { useState } from "react"
import { X } from "lucide-react"

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

interface EventFormProps {
  isOpen: boolean
  onClose: () => void
  onSave: (event: Omit<EventDetails, "id">) => void
  categories: string[]
}

const EventForm: React.FC<EventFormProps> = ({ isOpen, onClose, onSave, categories }) => {
  const [formData, setFormData] = useState<Omit<EventDetails, "id">>({
    name: "",
    date: "",
    location: "",
    description: "",
    price: "",
    category: categories.length > 0 ? categories[0] : "",
    image: "/placeholder.svg?height=300&width=400",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
    setFormData({
      name: "",
      date: "",
      location: "",
      description: "",
      price: "",
      category: categories.length > 0 ? categories[0] : "",
      image: "/placeholder.svg?height=300&width=400",
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-auto">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-auto bg-white rounded-xl shadow-2xl">
        <button
          className="absolute top-4 right-4 p-2 rounded-full bg-white/90 hover:bg-white text-gray-700 hover:text-gray-900 transition-colors z-10 shadow-md"
          onClick={onClose}
        >
          <X size={20} />
        </button>

        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">Add New Event</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Event Name*
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                Date*
              </label>
              <input
                type="text"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                placeholder="e.g., July 15-17, 2023"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                Location*
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                Price*
              </label>
              <input
                type="text"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="e.g., $99.00 or Free"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category*
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
                {categories.length === 0 && <option value="">No categories available</option>}
              </select>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description*
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="pt-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Add Event
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default EventForm
