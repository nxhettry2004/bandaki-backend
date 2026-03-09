export interface JwtPayload {
  userId: string;
  username: string;
  email: string;
  role: "tenant" | "superadmin";
  tenantId: string;
  createdAt?: Date;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
