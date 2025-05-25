"use client"

import type React from "react"
import { Calendar, MapPin, Share2, Users, Eye, Edit3, Trash2, Copy } from "lucide-react"
import type { EventDetails } from "./NoticeBoard" // Import the main EventDetails type
import { Button } from "./components/ui/button" // Assuming Button component exists
import { toast } from "sonner"

interface EventCardProps {
  eventDetails: EventDetails;
  pinColor?: "red" | "blue" | "green" | "yellow";
  hoverEffect?: "scale" | "rotate" | "lift" | "none";
  size?: "small" | "medium" | "large";
  viewType?: "noticeboard" | "list";
  currentUserId?: string | null;
  onDelete: (eventId: string) => void; // Callback to handle deletion in NoticeBoard
  onUpdate: (updatedEvent: EventDetails) => void; // Callback to handle updates (e.g. after sharing)
  onFork: (eventId: string) => void; // Callback to handle forking
  // Add onClick prop that NoticeBoard uses to open the modal
  onClick?: () => void; 
}

const EventCard: React.FC<EventCardProps> = ({
  eventDetails,
  pinColor = "red",
  // hoverEffect = "none", // hoverEffect is not used for M3 styling
  size = "small",
  viewType = "noticeboard",
  currentUserId,
  onDelete,
  onUpdate, // Retained for potential future use like inline edits from card
  onFork,
  onClick,
}) => {
  const isAuthor = currentUserId === eventDetails.authorId;
  const canFork = !isAuthor && (eventDetails.isPublic || eventDetails.shares.some(s => s.userId === currentUserId));

  // M3 Card Shape: using 'rounded-lg' (16px) or 'rounded-xl' (28px for larger cards)
  // M3 Card Color: bg-surface-variant, text-on-surface-variant
  // M3 Card Elevation: shadow-lg (M3 elevation +2 or +3) or shadow-md (+1)

  const sizeClasses = { // These might need adjustment based on M3 density/spacing.
    small: "w-40 h-56", // Slightly increased size for better touch targets / M3 feel
    medium: "w-48 h-64",
    large: "w-60 h-72",
  };

  const pinColors = { // These are not strictly M3, but part of existing design. Keep or adapt.
    red: "bg-error-container", // Using M3 error container for 'red' pin
    blue: "bg-primary-container", // Using M3 primary container for 'blue' pin
    green: "bg-green-500", // Keep green as is or map to a tertiary/custom M3 accent
    yellow: "bg-yellow-500", // Keep yellow as is or map
  };

  const getSizeClass = () => viewType === "list" ? "w-full" : sizeClasses[size]; // List view height will be auto

  const formattedDate = new Date(eventDetails.date).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric'
  });

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        const response = await fetch(`/api/events/${eventDetails.id}`, { method: 'DELETE' });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Error: ${response.status}`);
        }
        toast.success("Event deleted successfully.");
        onDelete(eventDetails.id); // Notify parent to update UI
      } catch (err: any) {
        console.error("Failed to delete event:", err);
        toast.error("Failed to delete event: " + err.message);
      }
    }
  };
  
  const handleFork = async (e: React.MouseEvent) => {
    e.stopPropagation();
    onFork(eventDetails.id); // Call the onFork passed from NoticeBoard
  };

  // Placeholder for Share and Edit functionality
  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast.info("Share functionality to be implemented in modal.");
    // Typically would open a share dialog/modal here
    // For now, let's assume this is handled by opening the main modal (EventModal)
    if (onClick) onClick(); 
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast.info("Edit functionality to be implemented (e.g. open EventForm in edit mode).");
     if (onClick) onClick(); // Open modal which might contain edit form or link
  };


  if (viewType === "list") {
    // List view uses the updated Card component from ui/card.tsx which is already M3 styled.
    // We just need to structure the content within it.
    return (
      <div className={`${getSizeClass()} cursor-pointer`} onClick={onClick}>
        {/* Using a div that mimics Card props, or ideally, if Card allows complex children:
            <Card className="flex h-auto md:h-32 overflow-hidden">...</Card> 
            For now, direct styling to match the new Card look and feel.
        */}
        <div className="w-full bg-surface-variant text-on-surface-variant rounded-lg shadow-md overflow-hidden border border-outline-variant flex h-auto md:h-36">
          <div className="w-28 md:w-36 flex-shrink-0 overflow-hidden">
            <img
              src={eventDetails.image || "/placeholder.svg?bg=surface-variant"}
              alt={eventDetails.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-4 flex-1 flex flex-col justify-between">
            <div>
              <h3 className="text-title-md font-medium line-clamp-1">{eventDetails.name}</h3>
              <div className="flex items-center text-body-sm text-on-surface-variant/80 mt-1">
                <Calendar size={14} className="mr-1.5 flex-shrink-0" />
                <span className="line-clamp-1">{formattedDate}</span>
              </div>
              <div className="flex items-center text-body-sm text-on-surface-variant/80 mt-1">
                <MapPin size={14} className="mr-1.5 flex-shrink-0" />
                <span className="line-clamp-1">{eventDetails.location}</span>
              </div>
              <p className="text-body-sm text-on-surface-variant/60 mt-0.5">By: {eventDetails.author?.name || 'Unknown'}</p>
              {eventDetails.forkedFrom && (
                <p className="text-body-sm text-secondary mt-0.5">
                  <Copy size={12} className="inline mr-1"/> Forked from: {eventDetails.forkedFrom.name}
                </p>
              )}
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className={`text-label-sm px-2 py-0.5 rounded-full ${eventDetails.isPublic ? 'bg-primary-container text-on-primary-container' : 'bg-error-container text-on-error-container'}`}>
                {eventDetails.isPublic ? 'Public' : 'Private'}
              </span>
              {eventDetails.category && 
                <span className="text-label-sm bg-tertiary-container text-on-tertiary-container px-2 py-0.5 rounded-full">{eventDetails.category}</span>
              }
            </div>
            <div className="mt-3 flex space-x-2">
                {isAuthor && (
                    <>
                        <Button variant="outline" size="sm" onClick={handleEdit}><Edit3 size={16} className="mr-1.5"/>Edit</Button>
                        <Button variant="outline" size="sm" onClick={handleShare}><Share2 size={16} className="mr-1.5"/>Share</Button>
                        <Button variant="destructive" size="sm" onClick={handleDelete}><Trash2 size={16} className="mr-1.5"/>Delete</Button>
                    </>
                )}
                {canFork && <Button variant="secondary" size="sm" onClick={handleFork}><Copy size={16} className="mr-1.5"/> Fork</Button>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default noticeboard view (classic card) - M3 Styled
  return (
    <div 
      className={`relative ${getSizeClass()} transform transition-transform duration-300 cursor-pointer 
                  bg-surface-variant text-on-surface-variant 
                  rounded-xl shadow-lg hover:shadow-xl border border-outline-variant 
                  flex flex-col overflow-hidden`} // M3: rounded-xl (28px), surface-variant, elevation
      onClick={onClick}
    >
      {/* Pin - Kept from original, consider M3 alternatives if desired */}
      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-20">
        <div className={`w-3.5 h-3.5 rounded-full ${pinColors[pinColor]} shadow-md`}></div>
        <div className="w-0.5 h-2.5 bg-outline mx-auto"></div>
      </div>

      <div className="w-full h-3/5 flex-shrink-0 overflow-hidden relative">
        <img
          src={eventDetails.image || "/placeholder.svg?bg=surface-variant"}
          alt={eventDetails.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent p-3">
          <span className="text-body-md font-medium text-white">{formattedDate}</span>
        </div>
        <span 
          className={`absolute top-2 right-2 text-label-sm px-2 py-0.5 rounded-full
                      ${eventDetails.isPublic ? 'bg-primary-container text-on-primary-container' : 'bg-error-container text-on-error-container'}`}
        >
          {eventDetails.isPublic ? 'Public' : 'Private'}
        </span>
      </div>

      <div className="p-3 flex-grow flex flex-col justify-between">
        <div>
          <h3 className="text-title-md font-medium line-clamp-2 mb-1">{eventDetails.name}</h3>
          <p className="text-body-sm text-on-surface-variant/80 line-clamp-1 mb-0.5">
            By: {eventDetails.author?.name || 'Unknown'}
          </p>
          {eventDetails.forkedFrom && (
              <p className="text-body-sm text-secondary line-clamp-1">
                 <Copy size={12} className="inline mr-1"/> Forked: {eventDetails.forkedFrom.name}
              </p>
          )}
        </div>
        <div className="mt-2 flex space-x-1 justify-end items-center">
          {isAuthor && (
              <>
                  <Button variant="ghost" size="icon_xs" onClick={handleEdit} title="Edit"><Edit3 size={16}/></Button>
                  <Button variant="ghost" size="icon_xs" onClick={handleShare} title="Share"><Share2 size={16}/></Button>
                  <Button variant="ghost" size="icon_xs" onClick={handleDelete} title="Delete"><Trash2 className="text-error" size={16}/></Button>
              </>
          )}
          {canFork && <Button variant="ghost" size="icon_xs" onClick={handleFork} title="Fork"><Copy size={16}/></Button>}
        </div>
      </div>
    </div>
  );
}

export default EventCard;
