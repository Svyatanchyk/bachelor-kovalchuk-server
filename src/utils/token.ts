import jwt from "jsonwebtoken";

const ACCESS_TOKEN_EXPIRE_TIME = "3h";
const REFRESH_TOKEN_EXPIRE_TIME = "7d";

export const generateAccessToken = (userId: string) => {
  const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET || "";
  return jwt.sign({ userId }, accessTokenSecret, {
    expiresIn: ACCESS_TOKEN_EXPIRE_TIME,
  });
};

export const generateRefreshToken = (userId: string) => {
  const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET || "";
  return jwt.sign({ userId }, refreshTokenSecret, {
    expiresIn: REFRESH_TOKEN_EXPIRE_TIME,
  });
};
