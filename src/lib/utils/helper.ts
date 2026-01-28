/**
 * Convert 24-hour time format (HH:MM:SS) to 12-hour format with AM/PM
 * @param timeString - Time in format "HH:MM:SS" or "HH:MM"
 * @returns Formatted time string like "12:00 AM" or "2:00 PM"
 */
export function formatTimeTo12Hour(timeString: string): string {
    if (!timeString) return '';
    
    // Extract hours and minutes (handle both HH:MM:SS and HH:MM formats)
    console.log("timeString", timeString);
    const [hours, minutes] = timeString.split(':').map(Number);
    
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return timeString;
    
    // Convert to 12-hour format
    let hour12: number;
    if (hours === 0) {
      hour12 = 12;
    } else if (hours > 12) {
      hour12 = hours - 12;
    } else {
      hour12 = hours;
    }
    
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const minutesStr = minutes.toString().padStart(2, '0');
    
    return `${hour12}:${minutesStr} ${ampm}`;
}