'use client';

import { useState, type FormEvent } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import type { Comment } from '@/types';
import { UserCircle } from 'lucide-react';

interface AddCommentFormProps {
  videoId: string;
  onCommentAdded: (newComment: Comment) => void;
}

export function AddCommentForm({ videoId, onCommentAdded }: AddCommentFormProps) {
  const [commentText, setCommentText] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      videoId,
      user: { name: 'Guest User', avatarUrl: 'https://placehold.co/40x40.png' },
      text: commentText,
      timestamp: 'Just now',
      likes: 0,
    };
    onCommentAdded(newComment);
    setCommentText('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-start gap-3 py-4">
      <Avatar className="h-10 w-10 flex-shrink-0">
        <AvatarImage src="https://placehold.co/40x40.png" alt="Your avatar" data-ai-hint="user avatar" />
        <AvatarFallback>
          <UserCircle className="h-full w-full text-muted-foreground" />
        </AvatarFallback>
      </Avatar>
      <div className="flex-grow">
        <Textarea
          placeholder="Add a comment..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          className="mb-2 min-h-[60px]"
          rows={2}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => setCommentText('')}>
            Cancel
          </Button>
          <Button type="submit" disabled={!commentText.trim()}>Comment</Button>
        </div>
      </div>
    </form>
  );
}
