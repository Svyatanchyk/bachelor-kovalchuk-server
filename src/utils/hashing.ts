import bcrypt from "bcrypt";
import dotenv from "dotenv";
dotenv.config();

export const hashString = async (plainText: string): Promise<string> => {
  try {
    const saltRounds = parseInt(process.env.SALT || "8", 10);
    const hashedString = await bcrypt.hash(plainText, saltRounds);
    return hashedString;
  } catch (error) {
    console.error("An error occured during hashing:", error);
    throw new Error("Hashing failed");
  }
};

export const compareHashString = async (
  plainText: string,
  hashedPlainText: string
): Promise<boolean> => {
  try {
    const isMatch = await bcrypt.compare(plainText, hashedPlainText);
    return isMatch;
  } catch (error) {
    console.error("An error occured during comparing plain text:", error);
    throw new Error("Plain text comparing failed");
  }
};
