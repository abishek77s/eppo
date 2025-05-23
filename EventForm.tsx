"use client"

import type React from "react"
import { useState } from "react"
import { X } from "lucide-react"

import { useEffect } from "react"; // Import useEffect

// Reflecting the ApiEvent structure (excluding fields managed by backend like id, createdAt, etc.)
interface EventFormData {
  name: string;
  date: string;
  location: string;
  description: string;
  price: string;
  category: string;
  image?: string | null; // Optional image
  // Fields for positioning/pinning if your form handles them
  positionX?: number | null;
  positionY?: number | null;
  isPinned?: boolean;
  pinOrder?: number | null;
}

// To match ApiEvent for eventToEdit prop
interface ApiEvent {
  id: number;
  name: string;
  date: string;
  location: string;
  description: string;
  price: string;
  category: string;
  image?: string | null;
  eventListId: number; // Though not directly used in form fields, it's part of the event
  createdAt: string;
  updatedAt: string;
  positionX?: number | null;
  positionY?: number | null;
  isPinned?: boolean;
  pinOrder?: number | null;
}


interface EventFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: EventFormData & { id?: number }) => void; // id is optional for new events
  categories: string[];
  eventToEdit?: ApiEvent | null; // Optional: pass an event to pre-fill the form for editing
}

const EventForm: React.FC<EventFormProps> = ({ isOpen, onClose, onSave, categories, eventToEdit }) => {
  const initialFormData: EventFormData = {
    name: "",
    date: "",
    location: "",
    description: "",
    price: "",
    category: categories.length > 0 ? categories[0] : "general", // Default category
    image: "/placeholder.svg?height=300&width=400",
    positionX: null,
    positionY: null,
    isPinned: false,
    pinOrder: null,
  };

  const [formData, setFormData] = useState<EventFormData>(initialFormData);

  useEffect(() => {
    if (eventToEdit) {
      setFormData({
        name: eventToEdit.name,
        date: eventToEdit.date,
        location: eventToEdit.location,
        description: eventToEdit.description,
        price: String(eventToEdit.price), // Ensure price is string
        category: eventToEdit.category,
        image: eventToEdit.image || "/placeholder.svg?height=300&width=400",
        positionX: eventToEdit.positionX,
        positionY: eventToEdit.positionY,
        isPinned: eventToEdit.isPinned,
        pinOrder: eventToEdit.pinOrder,
      });
    } else {
      // Reset to initial form data (with potentially updated categories)
      setFormData({
        ...initialFormData,
        category: categories.length > 0 ? categories[0] : "general",
      });
    }
  }, [eventToEdit, isOpen, categories]); // Rerun if isOpen changes (form opened/closed) or categories update

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? (value === '' ? null : parseFloat(value)) : value,
        }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...formData, id: eventToEdit?.id }); // Pass id if editing
    // No need to reset form here, useEffect handles it when isOpen changes or eventToEdit changes
  };

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
          <h2 className="text-2xl font-bold mb-4">{eventToEdit ? "Edit Event" : "Add New Event"}</h2>

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
                {eventToEdit ? "Save Changes" : "Add Event"}
              </button>
            </div>
            {/* Additional fields for positioning - can be hidden or styled as needed */}
            <details className="group">
              <summary className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-800">
                Advanced Options (Positioning)
              </summary>
              <div className="mt-2 space-y-3 p-3 border rounded-md">
                <div>
                  <label htmlFor="positionX" className="block text-xs font-medium text-gray-700">Position X (% or px)</label>
                  <input type="number" step="any" name="positionX" id="positionX" value={formData.positionX ?? ""} onChange={handleChange} className="w-full mt-1 px-2 py-1 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="e.g., 10.5"/>
                </div>
                <div>
                  <label htmlFor="positionY" className="block text-xs font-medium text-gray-700">Position Y (% or px)</label>
                  <input type="number" step="any" name="positionY" id="positionY" value={formData.positionY ?? ""} onChange={handleChange} className="w-full mt-1 px-2 py-1 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="e.g., 20"/>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" name="isPinned" id="isPinned" checked={formData.isPinned ?? false} onChange={handleChange} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"/>
                  <label htmlFor="isPinned" className="ml-2 block text-sm text-gray-900">Pin Event</label>
                </div>
                 <div>
                  <label htmlFor="pinOrder" className="block text-xs font-medium text-gray-700">Pin Order (optional)</label>
                  <input type="number" name="pinOrder" id="pinOrder" value={formData.pinOrder ?? ""} onChange={handleChange} className="w-full mt-1 px-2 py-1 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="e.g., 1"/>
                </div>
              </div>
            </details>
          </form>
        </div>
      </div>
    </div>
  )
}

export default EventForm
