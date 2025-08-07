// Timezone utilities for global event management

export interface TimezoneInfo {
  timezone: string;
  offset: string;
  abbreviation: string;
}

export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function formatDateWithTimezone(
  dateString: string | null, 
  targetTimezone?: string,
  options: Intl.DateTimeFormatOptions = {}
): string {
  if (!dateString) return "N/A";
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Invalid Date";
  
  const timezone = targetTimezone || getUserTimezone();
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
    timeZone: timezone,
    ...options
  };

  return new Intl.DateTimeFormat("en-US", defaultOptions).format(date);
}

export function convertToUserTimezone(dateString: string): Date {
  return new Date(dateString);
}

export function getTimezoneOffset(timezone: string, date?: Date): string {
  const targetDate = date || new Date();
  const formatter = new Intl.DateTimeFormat("en", {
    timeZone: timezone,
    timeZoneName: "longOffset"
  });
  
  const parts = formatter.formatToParts(targetDate);
  const offsetPart = parts.find(part => part.type === "timeZoneName");
  return offsetPart?.value || "";
}

export function getCommonTimezones(): TimezoneInfo[] {
  const timezones = [
    "UTC",
    "America/New_York",
    "America/Los_Angeles", 
    "America/Chicago",
    "Europe/London",
    "Europe/Berlin",
    "Europe/Paris",
    "Asia/Tokyo",
    "Asia/Shanghai",
    "Asia/Kolkata",
    "Australia/Sydney",
    "Pacific/Auckland"
  ];

  return timezones.map(tz => ({
    timezone: tz,
    offset: getTimezoneOffset(tz),
    abbreviation: getTimezoneAbbreviation(tz)
  }));
}

function getTimezoneAbbreviation(timezone: string): string {
  const date = new Date();
  const formatter = new Intl.DateTimeFormat("en", {
    timeZone: timezone,
    timeZoneName: "short"
  });
  
  const parts = formatter.formatToParts(date);
  const abbr = parts.find(part => part.type === "timeZoneName");
  return abbr?.value || timezone.split("/").pop() || "";
}

export interface EventDay {
  id: string;
  day_number: number;
  day_name: string | null;
  start_time: string;
  end_time: string;
}

export function createCalendarUrls(event: {
  name: string;
  description: string;
  start_time: string;
  end_time: string;
  location?: string | null;
  is_multi_day?: boolean;
  event_days?: EventDay[];
}) {
  const startDate = new Date(event.start_time);
  const endDate = new Date(event.end_time);
  
  // Format for calendar URLs (YYYYMMDDTHHMMSSZ)
  const formatCalendarDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const startFormatted = formatCalendarDate(startDate);
  const endFormatted = formatCalendarDate(endDate);
  
  const encodedTitle = encodeURIComponent(event.name);
  const encodedLocation = encodeURIComponent(event.location || 'Online Event');
  
  // Enhanced description for multi-day events
  let description = event.description;
  if (event.is_multi_day && event.event_days && event.event_days.length > 0) {
    description += '\n\nSchedule:\n';
    event.event_days.forEach(day => {
      const dayStart = new Date(day.start_time);
      const dayEnd = new Date(day.end_time);
      description += `Day ${day.day_number}${day.day_name ? ` (${day.day_name})` : ''}: ${dayStart.toLocaleString()} - ${dayEnd.toLocaleString()}\n`;
    });
  }
  const encodedDescription = encodeURIComponent(description);

  return {
    google: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodedTitle}&dates=${startFormatted}/${endFormatted}&details=${encodedDescription}&location=${encodedLocation}`,
    
    outlook: `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodedTitle}&startdt=${startDate.toISOString()}&enddt=${endDate.toISOString()}&body=${encodedDescription}&location=${encodedLocation}`,
    
    yahoo: `https://calendar.yahoo.com/?v=60&view=d&type=20&title=${encodedTitle}&st=${startFormatted}&dur=false&et=${endFormatted}&desc=${encodedDescription}&in_loc=${encodedLocation}`,
    
    // ICS file for Apple Calendar and other apps
    ics: generateICSFile(event, startDate, endDate, description)
  };
}

function generateICSFile(event: {
  name: string;
  description: string;
  location?: string | null;
}, startDate: Date, endDate: Date, description?: string): string {
  const formatICSDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Event Platform//Event//EN',
    'BEGIN:VEVENT',
    `UID:${Date.now()}@eventplatform.com`,
    `DTSTART:${formatICSDate(startDate)}`,
    `DTEND:${formatICSDate(endDate)}`,
    `SUMMARY:${event.name}`,
    `DESCRIPTION:${(description || event.description).replace(/\n/g, '\\n')}`,
    `LOCATION:${event.location || 'Online Event'}`,
    `DTSTAMP:${formatICSDate(new Date())}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  // Create blob URL for download
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  return URL.createObjectURL(blob);
}

export function downloadICSFile(event: {
  name: string;
  description: string;
  start_time: string;
  end_time: string;
  location?: string | null;
  is_multi_day?: boolean;
  event_days?: EventDay[];
}) {
  const startDate = new Date(event.start_time);
  const endDate = new Date(event.end_time);
  
  // Enhanced description for multi-day events
  let description = event.description;
  if (event.is_multi_day && event.event_days && event.event_days.length > 0) {
    description += '\n\nSchedule:\n';
    event.event_days.forEach(day => {
      const dayStart = new Date(day.start_time);
      const dayEnd = new Date(day.end_time);
      description += `Day ${day.day_number}${day.day_name ? ` (${day.day_name})` : ''}: ${dayStart.toLocaleString()} - ${dayEnd.toLocaleString()}\n`;
    });
  }
  
  const icsUrl = generateICSFile(event, startDate, endDate, description);
  
  const link = document.createElement('a');
  link.href = icsUrl;
  link.download = `${event.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the blob URL
  setTimeout(() => URL.revokeObjectURL(icsUrl), 100);
} 