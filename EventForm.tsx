"use client"

import type React from "react"
import { useState } from "react"
import { X } from "lucide-react"
import { toast } from "sonner"
import type { EventDetails } from "./NoticeBoard" // Import the main EventDetails type

// Define the data structure for the form, omitting fields set by the server
// and ensuring types match what the API expects for creation.
type EventFormData = Omit<EventDetails, "id" | "author" | "authorId" | "shares" | "forkedFrom" | "forkedFromId" | "forks" | "createdAt" | "updatedAt"> & {
  date: string; // Keep date as string for input field
};


interface EventFormProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated: (event: EventDetails) => void; // Changed from onSave
  categories: string[];
}

const EventForm: React.FC<EventFormProps> = ({ isOpen, onClose, onEventCreated, categories }) => {
  const initialFormData: EventFormData = {
    name: "",
    date: "", // Expects ISO string or parsable date string
    location: "",
    description: "",
    price: "",
    category: categories.length > 0 ? categories[0] : "",
    image: "/placeholder.svg?height=300&width=400", // Default image
    isPublic: false, // Default to private
  };
  const [formData, setFormData] = useState<EventFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simple validation for required fields (API does more)
    if (!formData.name || !formData.date || !formData.location || !formData.price || !formData.category || !formData.description) {
        toast.error("Please fill in all required fields.");
        setIsSubmitting(false);
        return;
    }
    
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          date: new Date(formData.date).toISOString(), // Ensure date is sent in ISO format
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error: ${response.status}`);
      }

      const newEvent: EventDetails = await response.json();
      onEventCreated(newEvent); // Pass the full event object from API
      setFormData(initialFormData); // Reset form
      onClose(); // Close modal
      // Toast success is handled in NoticeBoard's onEventCreated
    } catch (err: any) {
      console.error("Failed to create event:", err);
      toast.error("Failed to create event: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const resetFormAndClose = () => {
    setFormData(initialFormData); // Reset to initial M3-defaulted state
    onClose();
  };

  if (!isOpen) return null;

  // M3 Form Styling: Use surface colors, M3 typography for labels/inputs, M3 buttons.
  // Inputs should have M3 shape (e.g., rounded-lg or rounded-md based on density).
  // Assuming Input and Textarea components would be styled via ui/input.tsx or global styles.
  const inputBaseClass = "w-full px-3.5 py-2.5 border border-outline bg-surface text-on-surface rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-on-surface/60 text-body-lg";
  const labelBaseClass = "block text-label-lg font-medium text-on-surface mb-1.5";


  return (
    // M3 Dialog for form: Scrim, Surface color, Shape
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/30 backdrop-blur-sm overflow-auto"> {/* Reduced padding on smallest screens */}
      {/* Responsive modal width */}
      <div className="relative w-full sm:max-w-md md:max-w-lg max-h-[95vh] sm:max-h-[90vh] overflow-y-auto bg-surface text-on-surface rounded-lg sm:rounded-xl shadow-2xl scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600">
        {/* M3 Close button */}
        <Button 
            variant="ghost" 
            size="icon" 
            onClick={resetFormAndClose}
            className="absolute top-2 right-2 sm:top-3 sm:right-3 text-on-surface/70 hover:text-on-surface z-10" // Adjusted position for smaller padding
            aria-label="Close form"
        >
          <X size={20} sm:size={24} /> {/* Smaller icon on xs */}
        </Button>

        <div className="p-4 sm:p-6 md:p-8"> {/* Responsive padding */}
          <h2 className="text-headline-sm sm:text-headline-md font-semibold mb-5 sm:mb-6 text-on-surface">Add New Event</h2> {/* Responsive title */}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5"> {/* Responsive spacing */}
            <div>
              <label htmlFor="name" className={labelBaseClass}>
                Event Name*
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className={inputBaseClass}
              />
            </div>

            <div>
              <label htmlFor="date" className={labelBaseClass}>
                Date*
              </label>
              <input
                type="date" 
                id="date"
                name="date"
                value={formData.date} 
                onChange={handleChange}
                required
                className={inputBaseClass}
              />
            </div>
            
            <div>
              <label htmlFor="location" className={labelBaseClass}>
                Location*
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                className={inputBaseClass}
              />
            </div>

            <div>
              <label htmlFor="price" className={labelBaseClass}>
                Price*
              </label>
              <input
                type="text"
                id="price"
                name="price"
                value={formData.price || ""}
                onChange={handleChange}
                placeholder="e.g., $99 or Free"
                required
                className={inputBaseClass}
              />
            </div>

            <div>
              <label htmlFor="category" className={labelBaseClass}>
                Category*
              </label>
              <select
                id="category"
                name="category"
                value={formData.category || ""}
                onChange={handleChange}
                required
                className={inputBaseClass}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
                {categories.length === 0 && <option value="">No categories available</option>}
                 {!categories.includes(formData.category || "") && formData.category && (
                    <option value={formData.category || ""}>{formData.category}</option>
                 )}
              </select>
            </div>

            <div>
              <label htmlFor="description" className={labelBaseClass}>
                Description*
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description || ""}
                onChange={handleChange}
                rows={4}
                required
                className={`${inputBaseClass} min-h-[70px] sm:min-h-[80px]`} // Slightly smaller textarea on xs
              />
            </div>

            <div className="flex items-center pt-1 sm:pt-2">
              {/* M3 Switch would be ideal here if available and styled */}
              <input
                id="isPublic"
                name="isPublic"
                type="checkbox"
                checked={formData.isPublic}
                onChange={handleChange}
                className="h-4 w-4 sm:h-5 sm:w-5 text-primary rounded border-outline focus:ring-primary" // Responsive checkbox size
              />
              <label htmlFor="isPublic" className="ml-2 sm:ml-3 text-body-md sm:text-body-lg text-on-surface"> 
                Make event public
              </label>
            </div>

            {/* M3 Buttons - stack on xs, row on sm+ */}
            <div className="pt-4 sm:pt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
              {/* Cancel button full width on xs, auto on sm+ */}
              <Button
                type="button"
                variant="outline" 
                onClick={resetFormAndClose}
                disabled={isSubmitting}
                className="w-full sm:w-auto" 
              >
                Cancel
              </Button>
              {/* Submit button full width on xs, auto on sm+ */}
              <Button
                type="submit"
                variant="default" 
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                {isSubmitting ? "Adding..." : "Add Event"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EventForm;
