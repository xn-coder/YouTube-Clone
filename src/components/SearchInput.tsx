
'use client';

import { useState, type FormEvent, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { searchVideos } from '@/lib/data';
import type { Video } from '@/types';
import Link from 'next/link';
import Image from 'next/image';

export function SearchInput() {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Video[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isSuggestionsVisible, setIsSuggestionsVisible] = useState(false);
  const router = useRouter();
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      setIsSuggestionsVisible(false);
      router.push(`/results?search_query=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsSuggestionsVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSuggestions([]);
      setIsSuggestionsVisible(false);
      return;
    }

    const fetchDebounced = setTimeout(async () => {
      setIsLoadingSuggestions(true);
      try {
        const results = await searchVideos(searchQuery, 5); // Fetch 5 suggestions
        setSuggestions(results);
        if (results.length > 0 && document.activeElement === inputRef.current) {
          setIsSuggestionsVisible(true);
        } else {
          setIsSuggestionsVisible(false);
        }
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        setSuggestions([]);
        setIsSuggestionsVisible(false);
      }
      setIsLoadingSuggestions(false);
    }, 300); // 300ms debounce

    return () => clearTimeout(fetchDebounced);
  }, [searchQuery]);

  const handleSuggestionClick = (video: Video) => {
    setSearchQuery(video.title);
    setIsSuggestionsVisible(false);
    router.push(`/watch/${video.id}`);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.trim() === '') {
      setIsSuggestionsVisible(false);
      setSuggestions([]);
    }
  }

  return (
    <form onSubmit={handleSearch} className="flex w-full max-w-md items-center relative">
      <Input
        ref={inputRef}
        type="search"
        placeholder="Search videos..."
        className="rounded-r-none focus-visible:ring-0 focus-visible:ring-offset-0 border-r-0"
        value={searchQuery}
        onChange={handleInputChange}
        onFocus={() => {
          if (searchQuery.trim() && suggestions.length > 0) {
            setIsSuggestionsVisible(true);
          }
        }}
        aria-label="Search videos"
        autoComplete="off"
      />
      <Button type="submit" variant="outline" size="icon" className="rounded-l-none border-l-0" aria-label="Submit search">
        {isLoadingSuggestions ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
      </Button>

      {isSuggestionsVisible && (
        <div 
          ref={suggestionsRef} 
          className="absolute top-full left-0 right-0 mt-1 w-full bg-popover border border-border rounded-md shadow-lg z-50 max-h-96 overflow-y-auto"
        >
          {isLoadingSuggestions && suggestions.length === 0 && (
            <div className="p-3 text-sm text-muted-foreground text-center">Loading suggestions...</div>
          )}
          {!isLoadingSuggestions && suggestions.length === 0 && searchQuery.trim() !== '' && (
             <div className="p-3 text-sm text-muted-foreground">No suggestions found.</div>
          )}
          {suggestions.map((video) => (
            <div
              key={video.id}
              className="flex items-center p-2 hover:bg-accent cursor-pointer gap-2"
              onClick={() => handleSuggestionClick(video)}
              onMouseDown={(e) => e.preventDefault()} // Prevents input blur before click registers
            >
              <div className="w-16 h-9 relative flex-shrink-0">
                <Image
                  src={video.thumbnailUrl || 'https://placehold.co/64x36.png'}
                  alt={video.title}
                  fill
                  sizes="64px"
                  className="object-cover rounded-sm"
                  data-ai-hint="video thumbnail suggestion"
                />
              </div>
              <span className="text-sm text-popover-foreground truncate flex-grow">{video.title}</span>
            </div>
          ))}
        </div>
      )}
    </form>
  );
}
