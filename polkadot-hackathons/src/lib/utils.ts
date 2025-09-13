import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { supabase } from "./supabase"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate a short code for events (like Luma)
 * Format: 6-8 characters, alphanumeric, readable
 */
export function generateShortCode(eventName?: string): string {
  const characters = '23456789abcdefghjkmnpqrstuvwxyz'; // Removed confusing chars: 0,1,i,l,o
  let result = '';
  
  // If event name provided, use first 2-3 chars as prefix
  if (eventName) {
    const prefix = eventName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 3);
    if (prefix.length >= 2) {
      result = prefix;
    }
  }
  
  // Fill remaining with random characters
  const targetLength = 7;
  while (result.length < targetLength) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
}

/**
 * Generate a unique short code by checking database
 */
export async function generateUniqueShortCode(eventName?: string): Promise<string> {
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    const shortCode = generateShortCode(eventName);
    
    // Check if code already exists
    const { data, error } = await supabase
      .from('events')
      .select('id')
      .eq('short_code', shortCode)
      .single();
    
    console.log(data, error);
    if (error && error.code === 'PGRST116') {
      // No match found - code is available
      return shortCode;
    }
    
    attempts++;
  }
  
  // Fallback to completely random if all attempts failed
  return generateShortCode();
}

/**
 * Create shareable URLs for events
 */
export function createShareableEventURL(shortCode: string, baseUrl?: string): string {
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://crucible.montaq.org');
  return `${base}/e/${shortCode}`;
}

/**
 * Extract short code from shareable URL
 */
export function extractShortCodeFromURL(url: string): string | null {
  const match = url.match(/\/e\/([a-z0-9]+)/i);
  return match ? match[1] : null;
}

/**
 * Format event duration for display
 */
export function formatEventDuration(startTime: string, endTime: string): string {
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  const startDate = start.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: start.getFullYear() !== end.getFullYear() ? 'numeric' : undefined
  });
  
  const endDate = end.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
  
  const startTimeStr = start.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
  
  const endTimeStr = end.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
  
  if (startDate === endDate) {
    // Same day
    return `${startDate} • ${startTimeStr} - ${endTimeStr}`;
  } else {
    // Different days
    return `${startDate} ${startTimeStr} - ${endDate} ${endTimeStr}`;
  }
}

/**
 * Format multi-day event duration
 */
export function formatMultiDayEventDuration(eventDays: Array<{ day_number: number; start_time: string; end_time: string }>): string {
  if (!eventDays || eventDays.length === 0) return '';
  
  const firstDay = new Date(eventDays[0].start_time);
  const lastDay = new Date(eventDays[eventDays.length - 1].end_time);
  
  const firstDayStr = firstDay.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: firstDay.getFullYear() !== lastDay.getFullYear() ? 'numeric' : undefined
  });
  
  const lastDayStr = lastDay.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
  
  if (firstDayStr === lastDayStr) {
    return firstDayStr;
  } else {
    return `${firstDayStr} - ${lastDayStr}`;
  }
}
