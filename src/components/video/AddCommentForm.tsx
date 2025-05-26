'use client';

import { useState, type FormEvent } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import type { Comment } from '@/types';
import { UserCircle } from 'lucide-react';

interface AddCommentFormProps {
  videoId: string;
  onCommentAdded: (newComment: Comment) => void; // This will be a mock addition for now
}

// Mock user for adding comments, as YouTube API doesn't allow unauthenticated comment posting.
const mockCurrentUser = {
  name: 'Guest User',
  avatarUrl: 'https://placehold.co/40x40.png', // Placeholder for guest
  channelId: undefined, 
};

export function AddCommentForm({ videoId, onCommentAdded }: AddCommentFormProps) {
  const [commentText, setCommentText] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    // NOTE: Actual comment posting requires YouTube API OAuth authentication.
    // This is a visual mock of adding a comment.
    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      videoId,
      user: mockCurrentUser,
      text: commentText, // In a real scenario, this would be sanitized or sent as plain text
      timestamp: 'Just now',
      publishedAt: new Date().toISOString(),
      likes: 0,
      replyCount: 0,
    };
    onCommentAdded(newComment);
    setCommentText('');
    setIsFocused(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-start gap-3 py-4">
      <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 mt-1">
        <AvatarImage src={mockCurrentUser.avatarUrl} alt={mockCurrentUser.name} data-ai-hint="user avatar" />
        <AvatarFallback>
          <UserCircle className="h-full w-full text-muted-foreground" />
        </AvatarFallback>
      </Avatar>
      <div className="flex-grow">
        <Textarea
          placeholder="Add a comment..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          onFocus={() => setIsFocused(true)}
          className={`mb-2 min-h-[${isFocused ? '80px' : '40px'}] transition-all duration-200 ease-in-out`}
          rows={isFocused ? 3 : 1}
        />
        {isFocused && (
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => { setCommentText(''); setIsFocused(false); }}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={!commentText.trim()}>Comment</Button>
          </div>
        )}
      </div>
    </form>
  );
}
