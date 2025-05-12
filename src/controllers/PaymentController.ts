import { Request, Response } from "express";

interface AuthRequest extends Request {
  user?: {
    userId: string;
  };
}

class PaymentController {
  createInvoice = async (req: AuthRequest, res: Response) => {};
}

export default new PaymentController();
