import { Request } from 'express';

export interface AuthUserPayload {
  id: string;
  email: string;
  username: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUserPayload;
}
