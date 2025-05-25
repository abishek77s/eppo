"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { X, Calendar, MapPin, DollarSign, Share2, Tag, Users, Eye, Edit3, Trash2, Copy, Globe, Lock } from "lucide-react"
import type { EventDetails, EventShareInfo } from "./NoticeBoard" // Import the main EventDetails type
import { Button } from "./components/ui/button"
import { Switch } from "./components/ui/switch" // Assuming Switch component exists
import { Input } from "./components/ui/input" // Assuming Input component exists
import { toast } from "sonner"

interface EventModalProps {
  event: EventDetails;
  isOpen: boolean;
  onClose: () => void;
  sourceRect: DOMRect | null; // Not used in current modal animation, but kept for API compatibility
  isMobile?: boolean;
  currentUserId?: string | null;
  onEventUpdated: (updatedEvent: EventDetails) => void;
  onEventDeleted: (eventId: string) => void;
  onEventForked: (eventId: string) => void;
}

const EventModal: React.FC<EventModalProps> = ({ 
  event, 
  isOpen, 
  onClose, 
  // sourceRect, // Not actively used
  isMobile = false, // Retained, though M3 aims for adaptive layouts
  currentUserId,
  onEventUpdated,
  onEventDeleted,
  onEventForked
}) => {
  const [shareUserId, setShareUserId] = useState("");
  const [isSubmittingShare, setIsSubmittingShare] = useState(false);
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);

  const isAuthor = currentUserId === event.authorId;
  const canFork = !isAuthor && (event.isPublic || event.shares.some(s => s.userId === currentUserId));
  
  const formattedDate = new Date(event.date).toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' // Consider M3 date formatting guidelines
  });

  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => e.key === "Escape" && onClose(); // Standard behavior
    window.addEventListener("keydown", handleEscapeKey); // Standard key binding
    return () => window.removeEventListener("keydown", handleEscapeKey);
  }, [onClose]);

  if (!isOpen) return null; // Don't render if not open

  // M3 Motion: Using a standard spring for modal enter/exit.
  // Reference: https://m3.material.io/styles/motion/easing/standard-easing
  // Standard easing is often approximated by: type: "spring", stiffness: 300, damping: 30
  // Or a specific cubic-bezier if available.
  const m3Transition = { type: "spring", stiffness: 350, damping: 35 };


  const handleVisibilityToggle = async (isPublic: boolean) => {
    setIsUpdatingVisibility(true);
    try {
      const response = await fetch(`/api/events/${event.id}/visibility`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic }),
      });
      if (!response.ok) throw new Error(await response.text());
      const updatedEvent = await response.json();
      onEventUpdated(updatedEvent.event); 
      toast.success(`Event visibility updated to ${isPublic ? 'public' : 'private'}.`);
    } catch (err: any) {
      toast.error("Failed to update visibility: " + err.message);
    } finally {
      setIsUpdatingVisibility(false);
    }
  };

  const handleShareWithUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareUserId.trim()) {
      toast.error("Please enter a User ID to share with.");
      return;
    }
    setIsSubmittingShare(true);
    try {
      const response = await fetch(`/api/events/${event.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIdToShareWith: shareUserId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Failed to share event.");
      // Optimistically update or re-fetch. For M3, ensure feedback is clear.
      onEventUpdated({...event, shares: [...event.shares, result.share]}); 
      toast.success(`Event shared with user ${shareUserId}.`);
      setShareUserId("");
    } catch (err: any) {
      toast.error("Failed to share event: " + err.message);
    } finally {
      setIsSubmittingShare(false);
    }
  };

  const handleUnshareWithUser = async (userIdToUnshare: string) => {
    if (!window.confirm(`Are you sure you want to unshare this event with user ${userIdToUnshare}?`)) return;
    try {
      const response = await fetch(`/api/events/${event.id}/share`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIdToUnshareWith: userIdToUnshare }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Failed to unshare event.");
      onEventUpdated({...event, shares: event.shares.filter(s => s.userId !== userIdToUnshare)});
      toast.success(`Unshared event with user ${userIdToUnshare}.`);
    } catch (err: any) {
      toast.error("Failed to unshare event: " + err.message);
    }
  };

  const handleDeleteEvent = async () => {
    if (window.confirm("Are you sure you want to permanently delete this event?")) {
      try {
        const response = await fetch(`/api/events/${event.id}`, { method: 'DELETE' });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to delete event.");
        }
        toast.success("Event deleted successfully.");
        onEventDeleted(event.id);
        onClose(); 
      } catch (err: any) {
        toast.error("Failed to delete event: " + err.message);
      }
    }
  };

  const handleForkEvent = () => {
    onEventForked(event.id); 
    onClose(); 
  };
  
  const handleEditEvent = () => {
    toast.info("Edit Event: This would typically open the EventForm in an edit mode.");
    // Example: onClose(); // Then trigger opening EventForm with event data
  };


  return (
    // M3 Dialogs: Often use a scrim (overlay)
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" // M3 Scrim: darker, more blur
      onClick={onClose} 
    >
      {/* M3 Dialog Shape: rounded-xl (28px), Color: bg-surface */}
      {/* Responsive width: full on smallest, then progressively larger max-w */}
      <motion.div
        className="relative w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl max-h-[90vh] overflow-y-auto 
                   bg-surface text-on-surface rounded-xl shadow-2xl 
                   scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600"
        initial={{ opacity: 0, scale: 0.9, y: isMobile ? 30 : 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: isMobile ? 30 : 15 }}
        transition={m3Transition}
        onClick={(e) => e.stopPropagation()} 
      >
        {/* M3 Close Button: Standard icon button if possible */}
        <Button
          variant="ghost" // Use M3 text button style
          size="icon"
          className="absolute top-3 right-3 text-on-surface/70 hover:text-on-surface z-10" // Subtle color
          onClick={onClose}
        >
          <X size={24} />
        </button>

        <div className="relative w-full h-60 md:h-72 overflow-hidden">
          <img src={event.image || "/placeholder.svg"} alt={event.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 md:p-6"> {/* Responsive padding for header */}
            {event.category && (
              <span className="inline-block px-2 py-1 sm:px-3 rounded-full bg-secondary-container text-on-secondary-container text-label-sm sm:text-label-md font-medium mb-1 sm:mb-2">
                {event.category} {/* Updated to M3 badge style */}
              </span>
            )}
            {/* Responsive Typography for Modal Title */}
            <h2 className="text-headline-sm sm:text-headline-md md:text-headline-lg font-semibold text-white mb-1 line-clamp-2">{event.name}</h2>
            <div className="flex items-center text-body-sm sm:text-body-md text-white/90">
                <Calendar size={14} sm:size={16} className="mr-1.5 sm:mr-2 opacity-80" /> {formattedDate}
            </div>
          </div>
        </div>

        <div className="p-3 sm:p-4 md:p-6"> {/* Responsive padding for content */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-4"> {/* Responsive gap */}
            <div className="md:col-span-2">
              <h3 className="text-title-lg font-semibold mb-2 text-on-surface">Details</h3>
              <div className="flex items-center text-body-md text-on-surface-variant mb-1.5">
                <MapPin size={16} className="mr-2 opacity-70 flex-shrink-0" /> <span>{event.location}</span>
              </div>
              {event.price && (
                <div className="flex items-center text-body-md text-on-surface-variant mb-1.5">
                  <DollarSign size={16} className="mr-2 opacity-70 flex-shrink-0" /> <span>{event.price}</span>
                </div>
              )}
              <p className="text-body-md text-on-surface-variant/80 mb-1">By: {event.author?.name || 'Unknown User'}</p>
              {event.forkedFrom && (
                <p className="text-body-md text-secondary"> {/* M3: Secondary color for accents like this */}
                  <Copy size={14} className="inline mr-1 align-middle"/> Forked from: {event.forkedFrom.name} (by {event.forkedFrom.author?.name || 'Unknown'})
                </p>
              )}
              {/* M3: Body text styles, ensure prose class aligns with M3 if it has strong opinions */}
              <div className="prose prose-sm sm:prose-base max-w-none mt-3 text-body-lg text-on-surface whitespace-pre-line">
                {event.description}
              </div>
            </div>
            <div className="md:col-span-1 space-y-2 sm:space-y-3">
                <h3 className="text-title-lg font-semibold text-on-surface">Actions</h3>
                {isAuthor && (
                    <>
                        <Button onClick={handleEditEvent} className="w-full justify-start" variant="outline"><Edit3 size={16} className="mr-2"/> Edit Event</Button>
                        <Button onClick={handleDeleteEvent} className="w-full justify-start" variant="destructive"><Trash2 size={16} className="mr-2"/> Delete Event</Button>
                    </>
                )}
                {canFork && (
                    <Button onClick={handleForkEvent} className="w-full justify-start" variant="outline"><Copy size={16} className="mr-2"/> Fork Event</Button>
                )}
                 {!isAuthor && !canFork && currentUserId && (
                    <p className="text-xs text-gray-500">You cannot fork your own event directly via this button. To duplicate, edit and save as new.</p>
                 )}
                 {!currentUserId && (
                    <p className="text-xs text-gray-500">Login to fork this event.</p>
                 )}
            </div>
          </div>
          
          {/* Sharing Section */}
          {isAuthor && (
            <div className="mt-4 md:mt-6 pt-4 border-t border-outline-variant">
              <h3 className="text-title-lg font-semibold mb-3 text-on-surface">Sharing Settings</h3>
              <div className="flex items-center justify-between mb-3 p-3 bg-surface-variant rounded-lg"> {/* M3: Surface variant for this section bg */}
                <div className="flex items-center">
                  {event.isPublic ? <Globe size={18} className="mr-2 text-primary"/> : <Lock size={18} className="mr-2 text-error"/>}
                  <label htmlFor="isPublicToggle" className="text-body-md font-medium text-on-surface-variant">
                    {event.isPublic ? "Public Event" : "Private Event"}
                  </label>
                </div>
                <Switch // Assuming this is a pre-styled M3 switch from components/ui
                  id="isPublicToggle"
                  checked={event.isPublic}
                  onCheckedChange={handleVisibilityToggle}
                  disabled={isUpdatingVisibility}
                />
              </div>
              
              <form onSubmit={handleShareWithUser} className="flex flex-col sm:flex-row gap-2 mb-3">
                <Input // Assuming this is a pre-styled M3 input
                  type="text" 
                  placeholder="User ID to share with" 
                  value={shareUserId}
                  onChange={(e) => setShareUserId(e.target.value)}
                  className="flex-grow text-body-md" // M3: Input text style
                />
                <Button type="submit" disabled={isSubmittingShare || !shareUserId.trim()} size="default" className="w-full sm:w-auto"> {/* M3: Standard button size */}
                  {isSubmittingShare ? "Sharing..." : "Share"}
                </Button>
              </form>
              
              {event.shares && event.shares.length > 0 && (
                <div>
                  <h4 className="text-body-lg font-medium text-on-surface-variant mb-1.5">Shared with:</h4>
                  <ul className="space-y-1.5 max-h-24 sm:max-h-28 overflow-y-auto text-body-md"> {/* Increased max-h */}
                    {event.shares.map(share => (
                      <li key={share.userId} className="flex justify-between items-center p-1 bg-gray-100 rounded">
                        <span>{share.user?.name || share.user?.email || share.userId}</span>
                        <Button variant="ghost" size="xs" onClick={() => handleUnshareWithUser(share.userId)} title="Unshare">
                          <X size={14} />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
           {!isAuthor && event.shares && event.shares.length > 0 && (
             <div className="mt-4 pt-4 border-t">
                <h3 className="text-sm font-semibold mb-1 text-gray-600">Shared with:</h3>
                <div className="flex flex-wrap gap-2">
                    {event.shares.map(share => (
                        <span key={share.userId} className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                            {share.user?.name || share.userId}
                        </span>
                    ))}
                </div>
             </div>
           )}

        </div>
      </motion.div>
    </div>
  );
}

export default EventModal;
