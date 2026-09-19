/**
 * Currency, number, and string formatting utilities for Web Order Bounty HQ
 */

export function formatRupiah(amount: number, short: boolean = false): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return 'Rp0';
  }

  if (short) {
    if (Math.abs(amount) >= 1_000_000_000) {
      const b = (amount / 1_000_000_000).toFixed(1).replace('.0', '').replace('.', ',');
      return `Rp${b} M`;
    }
    if (Math.abs(amount) >= 1_000_000) {
      const m = (amount / 1_000_000).toFixed(1).replace('.0', '').replace('.', ',');
      return `Rp${m} JT`;
    }
    if (Math.abs(amount) >= 1_000) {
      const k = (amount / 1_000).toFixed(1).replace('.0', '').replace('.', ',');
      return `Rp${k} RB`;
    }
  }

  return 'Rp' + Math.round(amount).toLocaleString('id-ID');
}

export function formatNumber(num: number): string {
  if (isNaN(num) || num === null || num === undefined) return '0';
  return num.toLocaleString('id-ID');
}

export function formatPercent(rate: number): string {
  if (isNaN(rate) || rate === null || rate === undefined) return '0%';
  return `${rate.toFixed(1)}%`;
}

/**
 * Clean phone number to Indonesian format e.g. 0812... or 62812...
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  const cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    return cleaned;
  } else if (cleaned.startsWith('62')) {
    return '0' + cleaned.substring(2);
  }
  return cleaned;
}

/**
 * Standard Indonesian phone number normalization for deduplication
 * Always produces canonical '08...' representation
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('62')) {
    cleaned = '0' + cleaned.substring(2);
  } else if (cleaned.length > 0 && !cleaned.startsWith('0')) {
    cleaned = '0' + cleaned;
  }
  return cleaned;
}

export function getWhatsAppLink(phone: string, text: string = ''): string {
  const cleaned = phone.replace(/[^0-9]/g, '');
  let intlPhone = cleaned;
  if (intlPhone.startsWith('0')) {
    intlPhone = '62' + intlPhone.substring(1);
  }
  const encodedText = encodeURIComponent(text);
  return `https://wa.me/${intlPhone}${text ? `?text=${encodedText}` : ''}`;
}

/**
 * Simple password hash simulator using Web Crypto API SHA-256
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = 'BPC_BOUNTY_HQ_SALT_2026';
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
