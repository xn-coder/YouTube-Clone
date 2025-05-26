'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function SearchInput() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/results?search_query=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="flex w-full max-w-md items-center">
      <Input
        type="search"
        placeholder="Search videos..."
        className="rounded-r-none focus-visible:ring-0 focus-visible:ring-offset-0 border-r-0"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        aria-label="Search videos"
      />
      <Button type="submit" variant="outline" size="icon" className="rounded-l-none border-l-0" aria-label="Submit search">
        <Search className="h-5 w-5" />
      </Button>
    </form>
  );
}
