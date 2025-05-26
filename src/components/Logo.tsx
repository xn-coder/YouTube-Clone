import { PlaySquare } from 'lucide-react';
import Link from 'next/link';

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <Link href="/" className={`flex items-center gap-2 text-primary ${className}`}>
      <PlaySquare className="h-8 w-8" />
      <span className="text-2xl font-bold text-foreground">Youtube Clone</span>
    </Link>
  );
}
