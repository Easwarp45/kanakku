export interface UPIPaymentRequest {
  payeeVpa: string;
  payeeName: string;
  amount: number;
  note?: string;
  referenceId?: string;
}

const UPI_ID_REGEX = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z0-9.-]{2,64}$/;

export function isValidUpiId(value: string): boolean {
  return UPI_ID_REGEX.test(value.trim());
}

export function generateUpiReference(prefix: string = 'KAN'): string {
  const ts = Date.now().toString().slice(-10);
  const rand = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `${prefix}${ts}${rand}`;
}

export function buildUpiIntentUrl(request: UPIPaymentRequest): string {
  const params = new URLSearchParams();
  params.set('pa', request.payeeVpa.trim());
  params.set('pn', request.payeeName.trim());
  params.set('am', request.amount.toFixed(2));
  params.set('cu', 'INR');

  if (request.note?.trim()) {
    params.set('tn', request.note.trim());
  }

  if (request.referenceId?.trim()) {
    params.set('tr', request.referenceId.trim());
    params.set('tid', request.referenceId.trim());
  }

  return `upi://pay?${params.toString()}`;
}

export function buildUpiQrCodeUrl(intentUrl: string, size: number = 320): string {
  const safeSize = Math.max(180, Math.min(size, 600));
  return `https://api.qrserver.com/v1/create-qr-code/?size=${safeSize}x${safeSize}&data=${encodeURIComponent(intentUrl)}`;
}

export function isLikelyMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}
