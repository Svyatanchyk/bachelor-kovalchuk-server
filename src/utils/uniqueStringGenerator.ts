import { v4 as uuidv4 } from "uuid";

export const generateUniqueString = (userId: string): string => {
  return `${uuidv4()}${userId}`;
};
