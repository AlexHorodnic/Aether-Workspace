import { Injectable } from '@angular/core';

export interface PromptGuardResult {
  allowed: boolean;
  reason?: string;
}

@Injectable({ providedIn: 'root' })
export class PromptGuardService {
  private readonly recent: Array<{ content: string; timestamp: number }> = [];
  private lastSentAt = 0;

  check(content: string): PromptGuardResult {
    const now = Date.now();
    const normalized = content.trim().toLowerCase().replace(/\s+/g, ' ');
    const firstCurrent = this.recent.findIndex((entry) => now - entry.timestamp < 60_000);
    if (firstCurrent === -1) {
      this.recent.length = 0;
    } else if (firstCurrent > 0) {
      this.recent.splice(0, firstCurrent);
    }

    if (content.length > 4_000) {
      return { allowed: false, reason: 'Keep messages under 4,000 characters.' };
    }
    if (now - this.lastSentAt < 1_500) {
      return { allowed: false, reason: 'Please wait a moment before sending again.' };
    }
    if (this.recent.length >= 6) {
      return { allowed: false, reason: 'Local rate limit reached. Try again in a minute.' };
    }
    if (this.recent.some((entry) => entry.content === normalized && now - entry.timestamp < 20_000)) {
      return { allowed: false, reason: 'That message was just submitted.' };
    }

    this.lastSentAt = now;
    this.recent.push({ content: normalized, timestamp: now });
    return { allowed: true };
  }
}
