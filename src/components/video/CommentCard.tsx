import Image from 'next/image';
import type { Comment } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ThumbsUp, MessageSquare, UserCircle } from 'lucide-react';

interface CommentCardProps {
  comment: Comment;
}

export function CommentCard({ comment }: CommentCardProps) {
  return (
    <div className="flex gap-3 py-4">
      <Avatar className="h-10 w-10 flex-shrink-0">
        <AvatarImage src={comment.user.avatarUrl} alt={comment.user.name} data-ai-hint="user avatar" />
        <AvatarFallback>
          <UserCircle className="h-full w-full text-muted-foreground" />
        </AvatarFallback>
      </Avatar>
      <div className="flex-grow">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{comment.user.name}</span>
          <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
        </div>
        <p className="mt-1 text-sm text-foreground">{comment.text}</p>
        <div className="mt-2 flex items-center gap-4 text-muted-foreground">
          <Button variant="ghost" size="sm" className="p-1 h-auto">
            <ThumbsUp className="h-4 w-4 mr-1" />
            <span className="text-xs">{comment.likes}</span>
          </Button>
          <Button variant="ghost" size="sm" className="p-1 h-auto">
            <MessageSquare className="h-4 w-4 mr-1" />
            <span className="text-xs">Reply</span>
          </Button>
        </div>
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 pl-6 border-l-2 border-border">
            {comment.replies.map(reply => (
              <CommentCard key={reply.id} comment={reply} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
