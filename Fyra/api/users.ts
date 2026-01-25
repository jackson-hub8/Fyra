/// file: users.ts
/// Jackson Hurley, Kaitlyn Maes, Cam Horine
/// API endpoint for user management operations

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({ message: 'Endpoint not implemented yet' });
}
