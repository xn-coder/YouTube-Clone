
'use client';

import { useState, useEffect, type FormEvent } from 'react';
import type { AppComment } from '@/types';
import { AppCommentCard } from './AppCommentCard';
import { AddCommentForm } from './AddCommentForm';
import { Skeleton } from '@/components/ui/skeleton';
import { getAppComments, addAppComment } from '@/app/actions/userInteractions';
import { Button } from '../ui/button'; // Corrected path
import type { User as FirebaseUser } from 'firebase/auth'; // Keep this if used, or remove if only custom type used
import { useToast } from '@/hooks/use-toast';

interface AppCommentsListProps {
  videoId: string;
  currentUser: { uid: string; displayName: string | null; photoURL: string | null } | null;
}

const CommentsLoadingSkeleton = () => (
  <>
    {[...Array(3)].map((_, i) => (
      <div key={i} className="flex gap-3 py-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-grow space-y-2">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2 mt-1" />
        </div>
      </div>
    ))}
  </>
);

export function AppCommentsList({ videoId, currentUser }: AppCommentsListProps) {
  const [comments, setComments] = useState<AppComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchComments = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedComments = await getAppComments(videoId);
        setComments(fetchedComments);
      } catch (err) {
        console.error('Error fetching comments:', err);
        setError('Failed to load comments.');
        toast({
          title: 'Error',
          description: 'Could not load comments. Please try again later.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (videoId) {
      fetchComments();
    }
  }, [videoId, toast]);

  const handleCommentAdded = (newComment: AppComment) => {
    // Add the new comment to the top of the list optimistically
    setComments(prevComments => [newComment, ...prevComments]);
  };

  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-2 text-foreground">
        {isLoading ? 'Comments' : `${comments.length} Comment${comments.length === 1 ? '' : 's'}`}
      </h2>
      
      <AddCommentForm 
        videoId={videoId} 
        currentUser={currentUser}
        onCommentAdded={handleCommentAdded} 
      />

      {isLoading && <CommentsLoadingSkeleton />}
      
      {!isLoading && error && (
        <p className="text-destructive text-center py-4">{error}</p>
      )}

      {!isLoading && !error && comments.length === 0 && (
        <p className="text-muted-foreground text-center py-4">No comments yet. Be the first to comment!</p>
      )}

      {!isLoading && !error && comments.length > 0 && (
        <div className="divide-y divide-border">
          {comments.map((comment) => (
            <AppCommentCard key={comment.id} comment={comment} />
          ))}
        </div>
      )}
    </div>
  );
}

    