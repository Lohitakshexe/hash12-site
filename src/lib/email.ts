import nodemailer from "nodemailer";

const emailUser = process.env.GMAIL_USER || "";
const emailPassword = process.env.GMAIL_APP_PASSWORD || "";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: emailUser,
    pass: emailPassword,
  },
});

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!emailUser || !emailPassword) {
    console.warn("Gmail SMTP credentials missing in env variables");
    return;
  }

  const mailOptions = {
    from: `"Hash 12.0 AI Bot" <${emailUser}>`,
    to,
    subject,
    html,
  };

  return transporter.sendMail(mailOptions);
}
