import crypto from 'crypto';

export function signToken(payload) {
  const secret = process.env.PAYMENT_TOKEN_SECRET;
  if (!secret) throw new Error("PAYMENT_TOKEN_SECRET not configured");

  const payloadString = JSON.stringify(payload);
  const base64Payload = Buffer.from(payloadString).toString('base64url');
  
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(base64Payload);
  const signature = hmac.digest('base64url');

  return `${base64Payload}.${signature}`;
}

export function verifyToken(token) {
  const secret = process.env.PAYMENT_TOKEN_SECRET;
  if (!secret) return null;
  
  if (!token) return null;
  
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  
  const [base64Payload, signature] = parts;
  
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(base64Payload);
  const expectedSignature = hmac.digest('base64url');
  
  if (signature !== expectedSignature) return null;
  
  try {
    const payloadString = Buffer.from(base64Payload, 'base64url').toString('utf8');
    const payload = JSON.parse(payloadString);
    
    if (payload.exp && payload.exp < Date.now()) {
      return null;
    }
    
    return payload;
  } catch (error) {
    return null;
  }
}
