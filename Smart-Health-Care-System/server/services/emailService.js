const nodemailer = require("nodemailer");
const crypto = require("crypto");

// Create transporter for Mailtrap
const transporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST || "sandbox.smtp.mailtrap.io",
  port: process.env.MAILTRAP_PORT || 2525,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS,
  },
  // Add timeout settings
  connectionTimeout: 60000, // 60 seconds
  greetingTimeout: 30000, // 30 seconds
  socketTimeout: 60000, // 60 seconds
});

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP Email
const sendOTPEmail = async (email, otp, firstName) => {
  try {
    console.log("Attempting to send email to:", email);
    console.log("Using Mailtrap config:", {
      host: process.env.MAILTRAP_HOST,
      port: process.env.MAILTRAP_PORT,
      user: process.env.MAILTRAP_USER ? "***" : "NOT SET",
      pass: process.env.MAILTRAP_PASS ? "***" : "NOT SET",
    });

    const mailOptions = {
      from: '"Smart Health Care System" <noreply@smarthealth.com>',
      to: email,
      subject: "Email Verification - Smart Health Care System",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #3b82f6; text-align: center; margin-bottom: 20px;">Email Verification</h2>
            <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">
              Hello ${firstName || "there"},
            </p>
            <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">
              Thank you for registering with Smart Health Care System. Please use the following verification code to complete your registration:
            </p>
            <div style="background-color: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
              <h1 style="font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
            </div>
            <p style="color: #6b7280; font-size: 14px; margin-bottom: 20px;">
              This code will expire in 10 minutes. If you didn't request this verification, please ignore this email.
            </p>
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #6b7280; font-size: 12px;">
                Smart Health Care System<br>
                Your trusted health companion
              </p>
            </div>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully: ", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Email sending failed:", error);
    console.error("Error details:", {
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
    });
    return { success: false, error: error.message };
  }
};

// Verify OTP
const verifyOTP = (storedOTP, userOTP, expiryTime) => {
  if (!storedOTP || !userOTP) return false;
  if (Date.now() > expiryTime) return false;
  return storedOTP === userOTP;
};

// Generic email sender for custom subjects and HTML bodies
const sendEmail = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: '"Smart Health Care System" <noreply@smarthealth.com>',
      to,
      subject,
      html,
    };
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully: ", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Email sending failed:", error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  generateOTP,
  sendOTPEmail,
  verifyOTP,
  sendEmail,
};
