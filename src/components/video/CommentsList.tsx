'use client';

import { useState, useEffect } from 'react';
import type { Comment } from '@/types';
import { CommentCard } from './CommentCard';
import { AddCommentForm } from './AddCommentForm';
import { Skeleton } from '@/components/ui/skeleton';

interface CommentsListProps {
  videoId: string;
  initialComments: Comment[];
}

export function CommentsList({ videoId, initialComments }: CommentsListProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [isLoading, setIsLoading] = useState(true); // Simulate loading

  useEffect(() => {
    // Simulate fetching comments if needed, or just use initialComments
    setComments(initialComments);
    const timer = setTimeout(() => setIsLoading(false), 500); // Simulate loading delay
    return () => clearTimeout(timer);
  }, [initialComments]);

  const handleCommentAdded = (newComment: Comment) => {
    setComments(prevComments => [newComment, ...prevComments]);
  };

  if (isLoading) {
    return (
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-4 text-foreground">Comments</h2>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-3 py-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-grow space-y-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-2 text-foreground">{comments.length} Comments</h2>
      <AddCommentForm videoId={videoId} onCommentAdded={handleCommentAdded} />
      <div className="divide-y divide-border">
        {comments.map((comment) => (
          <CommentCard key={comment.id} comment={comment} />
        ))}
      </div>
    </div>
  );
}
