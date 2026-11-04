import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

export function formatTime(timeString: string): string {
  try {
    // If format is HH:MM
    if (/^\d{2}:\d{2}$/.test(timeString)) {
      const [hours, minutes] = timeString.split(":").map(Number);
      const period = hours >= 12 ? "PM" : "AM";
      const adjustedHour = hours % 12 || 12;
      return `${adjustedHour}:${minutes.toString().padStart(2, "0")} ${period}`;
    }
    return timeString;
  } catch {
    return timeString;
  }
}

export function getDaysRemaining(targetDate: string): number {
  try {
    const target = new Date(targetDate);
    const now = new Date();
    target.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diffMs = target.getTime() - now.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}
