import { Request, Response, NextFunction } from "express";
import ForbiddenError from "../../domain/errors/forbidden-error";


interface AuthenticatedRequest extends Request {
  auth?: any;
};

export const isAdmin = (
    req: AuthenticatedRequest, 
    res: Response, 
    next: NextFunction
) => {
  const auth = req.auth;
  if (auth?.sessionClaims?.metadata?.role !== "admin") {
    throw new ForbiddenError("Forbidden");
  }
  next();
};