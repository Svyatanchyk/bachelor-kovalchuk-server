import transporter from "../config/nodemailer";

export const sendVerificationEmail = async (
  to: string,
  verificationLink: string
): Promise<void> => {
  try {
    const mailOptions = {
      from: `"Search Arbitrage" <${process.env.AUTH_EMAIL}>`,
      to,
      subject: "Verify your email",
      text: "Thank you for signing up!",
      html: `<p>Verify your email address to complete the sign up and login into your account</p>
        <p>This link <b>expires in 6 hours<b>.</p>
        <p>Press <a href=${verificationLink}>here</a> to proceed.</p>
        `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Message sent successfully:", info.messageId);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
};

export const sendResetPasswordEmail = async (
  to: string,
  resetPasswordLink: string
) => {
  try {
    const mailOptions = {
      from: `"Search Arbitrage" <${process.env.AUTH_EMAIL}>`,
      to,
      subject: "Password Reset",
      html: `<p>We heard that you lost the password.</p>
        <p>Do not worry, use the link below to reset it.</p>
        <p>This link <b>expires in 1 hour<b>.</p>
        <p>Press <a href=${resetPasswordLink}>here</a> to proceed.</p>
        `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Message sent successfully:", info.messageId);
  } catch (error) {
    console.error("Password reset email failed:", error);
    throw new Error("Failed to send password reset email");
  }
};
