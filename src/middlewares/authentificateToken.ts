import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

interface AuthRequest extends Request {
  user?: string | JwtPayload;
}

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET || "";
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ message: "Access denied" });
    return;
  }

  try {
    const decodedUser = jwt.verify(token, accessTokenSecret) as JwtPayload;
    req.user = decodedUser;
    next();
  } catch (error) {
    res.status(403).json({ message: "Invalid or expired token" });
  }
};
