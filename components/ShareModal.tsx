"use client";

import React, { useState, useEffect, FormEvent } from 'react';
import { X, Trash2, UserPlus, Send, Shield, Eye } from 'lucide-react';

interface SharedUser {
  id: number; // This is the SharedEventList ID
  userId: number; // This is the ID of the user it's shared with
  user: { email: string; name?: string | null }; // User details
  permission: 'VIEW_ONLY' | 'EDIT';
}

interface EventListBasic {
  id: number;
  name: string;
  userId: number; // Owner's ID
}

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventList: EventListBasic | null;
  currentUserId: number | string | undefined; // ID of the logged-in user
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, eventList, currentUserId }) => {
  const [shareEmail, setShareEmail] = useState('');
  const [sharePermission, setSharePermission] = useState<'VIEW_ONLY' | 'EDIT'>('VIEW_ONLY');
  const [sharedWithUsers, setSharedWithUsers] = useState<SharedUser[]>([]);
  const [isLoadingShares, setIsLoadingShares] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchSharedUsers = async () => {
    if (!eventList) return;
    setIsLoadingShares(true);
    setError(null);
    try {
      // This endpoint doesn't exist yet. We need to get shared users from the eventList object itself,
      // or have a dedicated endpoint if not included in GET /api/event-lists/<id>
      // For now, let's assume eventList object might contain this, or we adapt later.
      // A more robust way would be: GET /api/event-lists/<listId>/shares
      // For this example, I'll simulate fetching if it were separate.
      // In reality, this data should ideally come with the event list details or a specific call.
      
      // Placeholder: In a real scenario, you'd fetch /api/event-lists/<eventList.id>/shares
      // For now, we'll assume this data is passed or re-fetched in NoticeBoard.tsx and passed down,
      // or NoticeBoard.tsx handles refreshing the whole list which would include its shares.
      // This component will manage its internal list of shares for display and removal.
      // Let's assume NoticeBoard re-fetches the full list data, and this modal just needs to trigger actions.

      // If your `GET /api/event-lists/<id>` (in NoticeBoard) already includes `sharedWith` data,
      // then `eventList` prop should be typed to include `sharedWith: SharedUser[]`
      // and you can initialize `setSharedWithUsers(eventList.sharedWith || [])`.
      // For this task, I'll assume `eventList` has a `sharedWith` field.
      // This part needs to be aligned with how NoticeBoard actually fetches and passes the eventList prop.
      // For now, I'll mock it:
      if (eventList && (eventList as any).sharedWith) {
        setSharedWithUsers((eventList as any).sharedWith);
      } else {
        // If not passed, this modal would ideally fetch it.
        // const response = await fetch(`/api/event-lists/${eventList.id}/shares`);
        // if (!response.ok) throw new Error("Failed to fetch shared users.");
        // const data = await response.json();
        // setSharedWithUsers(data);
        setSharedWithUsers([]); // Default to empty if not provided/fetched
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load share information.');
    } finally {
      setIsLoadingShares(false);
    }
  };
  
  useEffect(() => {
    if (isOpen && eventList) {
      fetchSharedUsers(); // Fetch current shares when modal opens for the specific list
      setShareEmail('');
      setSharePermission('VIEW_ONLY');
      setError(null);
      setSuccessMessage(null);
    }
  }, [isOpen, eventList]);


  const handleShareSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!eventList || !shareEmail) {
      setError('Email and permission are required.');
      return;
    }
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/event-lists/${eventList.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: shareEmail, permission: sharePermission }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to share event list.');
      }
      setSuccessMessage(data.message || 'Event list shared successfully.');
      setShareEmail(''); // Reset form
      // Refresh shared users list - ideally the parent (NoticeBoard) refreshes and passes updated list
      // For now, let's simulate adding to the local state or re-fetch
      if (data.share) { // If the new share object is returned
        setSharedWithUsers(prev => [...prev, {
            id: data.share.id,
            userId: data.share.userId,
            permission: data.share.permission,
            user: { email: shareEmail } // Assuming email is what we have, name might not be available immediately
        }]);
      } else {
        fetchSharedUsers(); // Or re-fetch
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    }
  };

  const handleRemoveShare = async (sharedEventListId: number) => {
    if (!eventList) return;
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/event-lists/${eventList.id}/share/${sharedEventListId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to remove share.');
      }
      setSuccessMessage(data.message || 'Share removed successfully.');
      setSharedWithUsers(prev => prev.filter(share => share.id !== sharedEventListId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    }
  };

  if (!isOpen || !eventList) return null;
  // Only list owner can share
  if (String(eventList.userId) !== String(currentUserId)) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl p-6">
                 <button
                    className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-gray-200 text-gray-600"
                    onClick={onClose}
                    aria-label="Close modal"
                >
                    <X size={20} />
                </button>
                <h2 className="text-xl font-semibold mb-2">Share "{eventList.name}"</h2>
                <p className="text-sm text-gray-600">You do not have permission to manage sharing for this list.</p>
            </div>
        </div>
      )
  }


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-auto">
      <div className="relative w-full max-w-lg max-h-[90vh] bg-white rounded-xl shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Share "{eventList.name}"</h2>
          <button
            className="p-1.5 rounded-full hover:bg-gray-200 text-gray-600"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-grow">
          <form onSubmit={handleShareSubmit} className="space-y-4">
            <p className="text-sm text-gray-600">Share this list with others. They will need an account to access it.</p>
            <div>
              <label htmlFor="share-email" className="block text-sm font-medium text-gray-700 mb-1">
                User's Email
              </label>
              {/* Responsive input group: stacks on xs, row on sm+ */}
              <div className="flex flex-col xs:flex-row items-stretch xs:items-center space-y-2 xs:space-y-0 xs:space-x-2">
                <input
                  type="email"
                  id="share-email"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  placeholder="user@example.com"
                  required
                  className="flex-grow w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 min-w-0" // Added min-w-0 for flex shrinking
                />
                <div className="flex space-x-2 flex-shrink-0"> {/* Container for select + button to keep them together */}
                  <select
                    value={sharePermission}
                    onChange={(e) => setSharePermission(e.target.value as 'VIEW_ONLY' | 'EDIT')}
                    className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="VIEW_ONLY">View Only</option>
                    <option value="EDIT">Edit</option>
                  </select>
                  <button
                    type="submit"
                    className="p-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex-shrink-0" // flex-shrink-0 for button
                    aria-label="Share List"
                >
                    <Send size={20} />
                </button>
              </div>
            </div>
           
            {error && <p className="text-sm text-red-600">{error}</p>}
            {successMessage && <p className="text-sm text-green-600">{successMessage}</p>}
          </form>

          <div className="space-y-3">
            <h3 className="text-md font-semibold text-gray-800 border-t pt-4">Currently Shared With:</h3>
            {isLoadingShares ? (
              <p className="text-sm text-gray-500">Loading users...</p>
            ) : sharedWithUsers.length === 0 ? (
              <p className="text-sm text-gray-500">Not shared with anyone yet.</p>
            ) : (
              <ul className="space-y-2 max-h-60 overflow-y-auto">
                {sharedWithUsers.map((share) => (
                  <li key={share.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-md border">
                    <div className="flex items-center">
                       {share.permission === 'EDIT' ? <Shield size={18} className="text-blue-500 mr-2" /> : <Eye size={18} className="text-green-500 mr-2" />}
                      <div>
                        <span className="text-sm font-medium text-gray-800">{share.user?.email || `User ID: ${share.userId}`}</span>
                        <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${share.permission === 'EDIT' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                          {share.permission === 'EDIT' ? 'Can Edit' : 'View Only'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveShare(share.id)}
                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full"
                      aria-label={`Remove share for ${share.user?.email}`}
                    >
                      <Trash2 size={18} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
         <div className="p-4 border-t bg-gray-50 rounded-b-xl">
            <button
                type="button"
                onClick={onClose}
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
                Close
            </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
