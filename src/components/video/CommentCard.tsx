import type { Comment } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ThumbsUp, MessageSquare, UserCircle, CornerDownRight } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import Link from 'next/link';

interface CommentCardProps {
  comment: Comment;
  isReply?: boolean;
}

export function CommentCard({ comment, isReply = false }: CommentCardProps) {
  return (
    <div className={`flex gap-3 py-3 ${isReply ? 'pl-8' : ''}`}>
      <Link href={comment.user.channelId ? `/channel/${comment.user.channelId}` : '#'}>
        <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 cursor-pointer">
          <AvatarImage src={comment.user.avatarUrl} alt={comment.user.name} data-ai-hint="user avatar" />
          <AvatarFallback>
            <UserCircle className="h-full w-full text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
      </Link>
      <div className="flex-grow">
        <div className="flex items-center gap-2">
          <Link href={comment.user.channelId ? `/channel/${comment.user.channelId}` : '#'} className="text-xs sm:text-sm font-medium text-foreground hover:text-primary cursor-pointer">
            {comment.user.name}
          </Link>
          <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
        </div>
        {/* Use dangerouslySetInnerHTML for HTML content from YouTube API */}
        <div 
          className="mt-1 text-sm text-foreground prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-a:text-primary hover:prose-a:underline" 
          dangerouslySetInnerHTML={{ __html: comment.text }} 
        />
        <div className="mt-2 flex items-center gap-2 sm:gap-4 text-muted-foreground">
          <Button variant="ghost" size="sm" className="p-1 h-auto text-xs">
            <ThumbsUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
            <span className="text-xs">{formatNumber(comment.likes)}</span>
          </Button>
          <Button variant="ghost" size="sm" className="p-1 h-auto text-xs">
            <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
            <span className="text-xs">Reply</span>
          </Button>
        </div>
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2">
            {/* Could add a button to expand replies */}
            {comment.replies.map(reply => (
              <CommentCard key={reply.id} comment={reply} isReply={true} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
