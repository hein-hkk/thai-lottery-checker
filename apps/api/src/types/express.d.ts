import type { CurrentAdminContext } from "../modules/admin-auth/admin-auth.mapper.js";

declare global {
  namespace Express {
    interface Request {
      clientIp?: string;
      currentAdmin?: CurrentAdminContext;
      currentAdminSessionId?: string;
      requestId?: string;
    }
  }
}

export {};
