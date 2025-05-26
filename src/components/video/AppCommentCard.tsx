
import type { AppComment } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ThumbsUp, MessageSquare, UserCircle } // CornerDownRight removed as not used for now
from 'lucide-react';
import { formatNumber, formatPublishedAt } from '@/lib/utils';
import Link from 'next/link';

interface AppCommentCardProps {
  comment: AppComment;
  isReply?: boolean; // Kept for potential future use with replies
}

export function AppCommentCard({ comment, isReply = false }: AppCommentCardProps) {
  return (
    <div className={`flex gap-3 py-3 ${isReply ? 'pl-8' : ''}`}>
      {/* User avatar, not linking to channel for app-specific comments unless user profile pages are built */}
      <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
        <AvatarImage src={comment.userAvatarUrl || undefined} alt={comment.userName} data-ai-hint="user avatar" />
        <AvatarFallback>
          <UserCircle className="h-full w-full text-muted-foreground" />
        </AvatarFallback>
      </Avatar>
      <div className="flex-grow">
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-medium text-foreground">
            {comment.userName || 'Anonymous User'}
          </span>
          <span className="text-xs text-muted-foreground">{formatPublishedAt(comment.createdAt.toISOString())}</span>
        </div>
        {/* Display plain text content; if HTML is stored, ensure sanitization or use dangerouslySetInnerHTML carefully */}
        <p className="mt-1 text-sm text-foreground whitespace-pre-wrap">{comment.text}</p>
        
        <div className="mt-2 flex items-center gap-2 sm:gap-4 text-muted-foreground">
          <Button variant="ghost" size="sm" className="p-1 h-auto text-xs" disabled> {/* Likes not implemented yet */}
            <ThumbsUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
            <span className="text-xs">{formatNumber(comment.likes)}</span>
          </Button>
          <Button variant="ghost" size="sm" className="p-1 h-auto text-xs" disabled> {/* Replies not implemented yet */}
            <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
            <span className="text-xs">Reply</span>
          </Button>
        </div>
        {/* Placeholder for replies if implemented in future
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2">
            {comment.replies.map(reply => (
              <AppCommentCard key={reply.id} comment={reply} isReply={true} />
            ))}
          </div>
        )}
        */}
      </div>
    </div>
  );
}

    