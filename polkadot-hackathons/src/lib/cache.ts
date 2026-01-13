// Cache utility for reducing Supabase queries
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

// Cache data structure for internal use

export interface EventDay {
  id: string;
  event_id: string;
  day_number: number;
  day_name: string | null;
  start_time: string;
  end_time: string;
  created_at: string;
}

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
  is_multi_day: boolean;
  organizer?: {
    name: string;
    email: string;
  };
  event_days?: EventDay[];
}

class EventCache {
  private static instance: EventCache;
  private cache: Map<string, CacheItem<unknown>>;
  private readonly CACHE_PREFIX = 'sui_events_';
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
import { useState, useEffect, useCallback, useRef } from 'react';

// Error handling configuration
const ERROR_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAYS: [1000, 2000, 4000], // Progressive backoff: 1s, 2s, 4s
  STALE_DATA_TTL: 24 * 60 * 60 * 1000, // Keep stale data for 24 hours
  CIRCUIT_BREAKER_THRESHOLD: 5, // Stop retrying after 5 consecutive failures
  CIRCUIT_BREAKER_TIMEOUT: 60 * 1000, // Wait 1 minute before trying again
};

// Global circuit breaker state
class CircuitBreaker {
  private static instance: CircuitBreaker;
  private failures: Map<string, { count: number; lastFailure: number }> = new Map();

  static getInstance(): CircuitBreaker {
    if (!CircuitBreaker.instance) {
      CircuitBreaker.instance = new CircuitBreaker();
    }
    return CircuitBreaker.instance;
  }

  shouldAttempt(key: string): boolean {
    const failure = this.failures.get(key);
    if (!failure) return true;

    const now = Date.now();
    if (failure.count >= ERROR_CONFIG.CIRCUIT_BREAKER_THRESHOLD) {
      // Check if timeout has passed
      if (now - failure.lastFailure > ERROR_CONFIG.CIRCUIT_BREAKER_TIMEOUT) {
        this.failures.delete(key);
        return true;
      }
      return false; // Circuit is open
    }
    return true;
  }

  recordFailure(key: string): void {
    const failure = this.failures.get(key) || { count: 0, lastFailure: 0 };
    failure.count++;
    failure.lastFailure = Date.now();
    this.failures.set(key, failure);
  }

  recordSuccess(key: string): void {
    this.failures.delete(key);
  }
}

// Enhanced error types
interface APIError extends Error {
  status?: number;
  code?: string;
  retryable?: boolean;
}

function createAPIError(error: unknown): APIError {
  let apiError: APIError;
  
  if (error instanceof Error) {
    apiError = error as APIError;
  } else {
    apiError = new Error('Unknown error') as APIError;
  }

  // Determine if error is retryable based on the error message/type
  if (error && typeof error === 'object') {
    const errorObj = error as { message?: string; code?: string; status?: number };
    
    // Network errors are retryable
    if (errorObj.message?.includes('Failed to fetch') || 
        errorObj.message?.includes('TypeError: Failed to fetch') ||
        errorObj.code === 'ECONNREFUSED' ||
        errorObj.status === 503 ||
        errorObj.status === 502 ||
        errorObj.status === 504 ||
        errorObj.status === 429) {
      apiError.retryable = true;
      apiError.status = errorObj.status;
    } else {
      apiError.retryable = false;
    }
  }

  return apiError;
}

// Sleep utility for delays
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function useEventCache<T>(
  key: string,
  fetchFunction: () => Promise<T>,
  ttl: number = 5 * 60 * 1000
): { data: T | null; loading: boolean; error: Error | null; refetch: () => Promise<void> } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const retryCount = useRef(0);
  const fetchFunctionRef = useRef(fetchFunction);
  const circuitBreaker = CircuitBreaker.getInstance();

  // Update the ref when fetchFunction changes
  useEffect(() => {
    fetchFunctionRef.current = fetchFunction;
  }, [fetchFunction]);

  const cache = EventCache.getInstance();

  const fetchWithRetry = useCallback(async (attempt: number = 0): Promise<T> => {
    // Check circuit breaker
    if (!circuitBreaker.shouldAttempt(key)) {
      throw new Error('Service temporarily unavailable. Please try again later.');
    }

    try {
      const result = await fetchFunctionRef.current();
      circuitBreaker.recordSuccess(key);
      return result;
    } catch (error) {
      const apiError = createAPIError(error);
      
      // Record failure in circuit breaker
      circuitBreaker.recordFailure(key);

      // Only retry if error is retryable and we haven't exceeded max retries
      if (apiError.retryable && attempt < ERROR_CONFIG.MAX_RETRIES) {
        console.warn(`API call failed (attempt ${attempt + 1}/${ERROR_CONFIG.MAX_RETRIES + 1}), retrying in ${ERROR_CONFIG.RETRY_DELAYS[attempt]}ms...`, apiError.message);
        
        await sleep(ERROR_CONFIG.RETRY_DELAYS[attempt]);
        return fetchWithRetry(attempt + 1);
      }

      throw apiError;
    }
  }, [key, circuitBreaker]);

  const fetchData = useCallback(async (forceRefresh: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cachedData = cache.get<T>(key);
        if (cachedData) {
          setData(cachedData);
          setLoading(false);
          return;
        }
      }

      // Check for stale data we can use as fallback
      const staleKey = `${key}_stale`;
      const staleData = cache.get<T>(staleKey);

      try {
        // Attempt to fetch fresh data
        const freshData = await fetchWithRetry();
        
        // Cache both fresh and stale versions
        cache.set(key, freshData, ttl);
        cache.set(staleKey, freshData, ERROR_CONFIG.STALE_DATA_TTL);
        
        setData(freshData);
        retryCount.current = 0;
      } catch (err) {
        const apiError = createAPIError(err);
        
        // If we have stale data, use it
        if (staleData) {
          console.warn('Using stale data due to API failure:', apiError.message);
          setData(staleData);
          // Set a non-blocking error to indicate stale data
          setError(new Error('Using cached data - some information may be outdated'));
        } else {
          // No fallback data available
          console.error('API call failed with no fallback data:', apiError.message);
          setError(apiError);
        }
      }
    } catch (err) {
      const apiError = createAPIError(err);
      setError(apiError);
    } finally {
      setLoading(false);
    }
  }, [key, fetchWithRetry, ttl, cache]);

  useEffect(() => {
    fetchData();
  }, [key, fetchData]); // Include fetchData in dependencies

  const refetch = useCallback(() => fetchData(true), [fetchData]);

  return { data, loading, error, refetch };
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