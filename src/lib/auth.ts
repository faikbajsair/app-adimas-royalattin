const getCrypto = (): Crypto => {
  if (typeof crypto !== 'undefined') return crypto;
  return require('crypto').webcrypto;
};

const SECRET_KEY = process.env.SESSION_SECRET || 'adimas-school-app-secret-session-key-fallback-32chars';

function base64UrlEncode(str: string): string {
  return Buffer.from(str).toString('base64url');
}

function base64UrlDecode(str: string): string {
  return Buffer.from(str, 'base64url').toString('utf8');
}

// Menghasilkan tanda tangan HMAC untuk keamanan data session
async function getSignature(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(SECRET_KEY);
  const cryptoLib = getCrypto();
  const key = await cryptoLib.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await cryptoLib.subtle.sign(
    'HMAC',
    key,
    encoder.encode(data)
  );
  return Buffer.from(signature).toString('base64url');
}

// Membuat token sesi yang valid selama 1 hari
export async function createSessionToken(payload: Record<string, any>): Promise<string> {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  // Set kedaluwarsa 24 jam ke depan
  const body = base64UrlEncode(JSON.stringify({ ...payload, exp: Date.now() + 1000 * 60 * 60 * 24 }));
  const data = `${header}.${body}`;
  const signature = await getSignature(data);
  return `${data}.${signature}`;
}

// Memverifikasi dan mendekode token sesi
export async function verifySessionToken(token: string): Promise<Record<string, any> | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const data = `${header}.${body}`;
    const expectedSignature = await getSignature(data);
    if (signature !== expectedSignature) return null;

    const payload = JSON.parse(base64UrlDecode(body));
    if (payload.exp && Date.now() > payload.exp) {
      return null; // Token kedaluwarsa
    }
    return payload;
  } catch (e) {
    return null;
  }
}

