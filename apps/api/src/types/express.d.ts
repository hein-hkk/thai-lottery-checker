import type { CurrentAdminContext } from "../modules/admin-auth/admin-auth.mapper.js";

declare global {
  namespace Express {
    interface Request {
      currentAdmin?: CurrentAdminContext;
    }
  }
}

export {};
