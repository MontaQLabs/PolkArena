// Cache utility for reducing Supabase queries
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

// Cache data structure for internal use

export interface Event {
  id: string;
  name: string;
  description: string;
  start_time: string;
  end_time: string;
  organizer_id: string;
  organizer_name: string;
  location: string | null;
  is_online: boolean;
  participant_limit: number | null;
  tags: string[] | null;
  custom_fields: unknown[] | null;
  registration_deadline: string | null;
  website_url: string | null;
  discord_url: string | null;
  twitter_url: string | null;
  requirements: string | null;
  banner_image_url: string | null;
  short_code: string;
  organizer?: {
    name: string;
    email: string;
  };
}

class EventCache {
  private static instance: EventCache;
  private cache: Map<string, CacheItem<unknown>>;
  private readonly CACHE_PREFIX = 'polkadot_events_';
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    this.cache = new Map();
    this.loadFromStorage();
  }

  static getInstance(): EventCache {
    if (!EventCache.instance) {
      EventCache.instance = new EventCache();
    }
    return EventCache.instance;
  }

  // Get cached data with TTL check
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      this.removeFromStorage(key);
      return null;
    }

    return item.data as T;
  }

  // Set cache data
  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };
    this.cache.set(key, item as CacheItem<unknown>);
    this.saveToStorage(key, item);
  }

  // Delete cache entry
  delete(key: string): void {
    this.cache.delete(key);
    this.removeFromStorage(key);
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
    this.clearStorage();
  }

  // Invalidate all event-related cache
  invalidateEvents(): void {
    const keysToDelete = Array.from(this.cache.keys()).filter(key => 
      key.startsWith('events_') || 
      key.startsWith('event_') || 
      key.startsWith('participants_')
    );
    keysToDelete.forEach(key => this.delete(key));
  }

  // Invalidate specific event cache
  invalidateEvent(eventId: string): void {
    this.delete(`event_${eventId}`);
    this.delete(`participants_${eventId}`);
    this.delete('events_list');
    this.delete('past_events_list');
  }

  // Cache keys
  static getKeys() {
    return {
      eventsList: 'events_list',
      pastEventsList: 'past_events_list',
      eventDetails: (id: string) => `event_${id}`,
      participantCount: (eventId: string) => `participants_${eventId}`,
      userRegistration: (eventId: string, userId: string) => `registration_${eventId}_${userId}`,
    };
  }

  // Storage methods
  private saveToStorage(key: string, item: CacheItem<unknown>): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.CACHE_PREFIX + key, JSON.stringify(item));
      }
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      if (typeof window !== 'undefined') {
        const keys = Object.keys(localStorage);
        const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));
        
        cacheKeys.forEach(key => {
          const storageKey = key.replace(this.CACHE_PREFIX, '');
          const item = localStorage.getItem(key);
          if (item) {
            try {
              const parsedItem = JSON.parse(item);
              this.cache.set(storageKey, parsedItem);
            } catch (error) {
              console.warn('Failed to parse cached item:', error);
              localStorage.removeItem(key);
            }
          }
        });
      }
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
    }
  }

  private removeFromStorage(key: string): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(this.CACHE_PREFIX + key);
      }
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error);
    }
  }

  private clearStorage(): void {
    try {
      if (typeof window !== 'undefined') {
        const keys = Object.keys(localStorage);
        const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));
        cacheKeys.forEach(key => localStorage.removeItem(key));
      }
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  }
}

// Hook for using cache in React components
import { useState, useEffect, useCallback } from 'react';

export function useEventCache<T>(
  key: string,
  fetchFunction: () => Promise<T>,
  ttl: number = 5 * 60 * 1000
): { data: T | null; loading: boolean; error: Error | null; refetch: () => Promise<void> } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const cache = EventCache.getInstance();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check cache first
      const cachedData = cache.get<T>(key);
      if (cachedData) {
        setData(cachedData);
        setLoading(false);
        return;
      }

      // Fetch fresh data
      const freshData = await fetchFunction();
      
      // Cache the data
      cache.set(key, freshData, ttl);
      setData(freshData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [key, fetchFunction, ttl, cache]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// Utility functions for common cache operations
export const cacheUtils = {
  // Cache events list
  cacheEvents: (events: Event[]) => {
    const cache = EventCache.getInstance();
    cache.set(EventCache.getKeys().eventsList, events, 2 * 60 * 1000); // 2 minutes
  },

  // Cache past events list
  cachePastEvents: (events: Event[]) => {
    const cache = EventCache.getInstance();
    cache.set(EventCache.getKeys().pastEventsList, events, 10 * 60 * 1000); // 10 minutes
  },

  // Cache event details
  cacheEventDetails: (event: Event) => {
    const cache = EventCache.getInstance();
    cache.set(EventCache.getKeys().eventDetails(event.id), event, 5 * 60 * 1000); // 5 minutes
  },

  // Cache participant count
  cacheParticipantCount: (eventId: string, count: number) => {
    const cache = EventCache.getInstance();
    cache.set(EventCache.getKeys().participantCount(eventId), count, 2 * 60 * 1000); // 2 minutes
  },

  // Get cached events
  getCachedEvents: (): Event[] | null => {
    const cache = EventCache.getInstance();
    return cache.get<Event[]>(EventCache.getKeys().eventsList);
  },

  // Get cached past events
  getCachedPastEvents: (): Event[] | null => {
    const cache = EventCache.getInstance();
    return cache.get<Event[]>(EventCache.getKeys().pastEventsList);
  },

  // Get cached event details
  getCachedEventDetails: (eventId: string): Event | null => {
    const cache = EventCache.getInstance();
    return cache.get<Event>(EventCache.getKeys().eventDetails(eventId));
  },

  // Get cached participant count
  getCachedParticipantCount: (eventId: string): number | null => {
    const cache = EventCache.getInstance();
    return cache.get<number>(EventCache.getKeys().participantCount(eventId));
  },

  // Invalidate event cache
  invalidateEvent: (eventId: string) => {
    const cache = EventCache.getInstance();
    cache.invalidateEvent(eventId);
  },

  // Invalidate all events cache
  invalidateAllEvents: () => {
    const cache = EventCache.getInstance();
    cache.invalidateEvents();
  },
};

export default EventCache; 