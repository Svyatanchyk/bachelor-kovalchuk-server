import { Request, Response, NextFunction } from "express";
import validator from "validator";

export const validateSignup = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let { email, password } = req.body;

  email = email?.trim();
  password = password?.trim();

  if (!email || !password) {
    res.status(400).json({
      status: "FAILED",
      message: "Email and password are required",
    });
    return;
  }

  if (!validator.isEmail(email)) {
    res.status(400).json({
      status: "FAILED",
      message: "Invalid email format",
    });
    return;
  }

  if (
    !validator.isStrongPassword(password, {
      minLength: 8,
      minNumbers: 1,
      minUppercase: 1,
      minSymbols: 0,
    })
  ) {
    res.status(400).json({
      status: "FAILED",
      message:
        "Password must be at least 8 characters long and include at least one number and at least 1 uppercase character",
    });
    return;
  }

  req.body.email = email;
  req.body.password = password;

  next();
};
