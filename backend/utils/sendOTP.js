const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send OTP via email
const sendOTPEmail = async (email, otp, type = 'verification') => {
  try {
    const transporter = createTransporter();

    let subject, html;

    if (type === 'verification') {
      subject = 'GamePasal - Email Verification Code';
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
          <div style="background-color: #1a1a1a; padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="color: #ff4757; margin-bottom: 20px;">🎮 GamePasal</h1>
            <h2 style="color: #ffffff; margin-bottom: 20px;">Email Verification</h2>
            <p style="color: #cccccc; font-size: 16px; margin-bottom: 30px;">
              Thank you for signing up! Please use the verification code below to complete your registration:
            </p>
            <div style="background-color: #333; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h1 style="color: #ff4757; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
            </div>
            <p style="color: #888; font-size: 14px; margin-top: 20px;">
              This code will expire in ${process.env.OTP_EXPIRE_MINUTES || 10} minutes.
            </p>
            <p style="color: #888; font-size: 14px;">
              If you didn't request this verification, please ignore this email.
            </p>
          </div>
        </div>
      `;
    } else if (type === 'reset') {
      subject = 'GamePasal - Password Reset Code';
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
          <div style="background-color: #1a1a1a; padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="color: #ff4757; margin-bottom: 20px;">🎮 GamePasal</h1>
            <h2 style="color: #ffffff; margin-bottom: 20px;">Password Reset</h2>
            <p style="color: #cccccc; font-size: 16px; margin-bottom: 30px;">
              You requested a password reset. Please use the code below to reset your password:
            </p>
            <div style="background-color: #333; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h1 style="color: #ff4757; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
            </div>
            <p style="color: #888; font-size: 14px; margin-top: 20px;">
              This code will expire in ${process.env.OTP_EXPIRE_MINUTES || 10} minutes.
            </p>
            <p style="color: #888; font-size: 14px;">
              If you didn't request this reset, please ignore this email and your password will remain unchanged.
            </p>
          </div>
        </div>
      `;
    }

    const mailOptions = {
      from: `"GamePasal" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      html: html
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ OTP email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };

  } catch (error) {
    console.error('❌ Error sending OTP email:', error);
    return { success: false, error: error.message };
  }
};

// Send order confirmation email
const sendOrderConfirmation = async (email, orderDetails) => {
  try {
    const transporter = createTransporter();

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
        <div style="background-color: #1a1a1a; padding: 30px; border-radius: 10px;">
          <h1 style="color: #ff4757; text-align: center; margin-bottom: 20px;">🎮 GamePasal</h1>
          <h2 style="color: #ffffff; margin-bottom: 20px;">Order Confirmation</h2>
          <p style="color: #cccccc; font-size: 16px; margin-bottom: 20px;">
            Thank you for your order! Here are the details:
          </p>
          <div style="background-color: #333; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #ffffff; margin: 5px 0;"><strong>Order Number:</strong> ${orderDetails.orderNumber}</p>
            <p style="color: #ffffff; margin: 5px 0;"><strong>Total Amount:</strong> NRS ${orderDetails.totalAmount}</p>
            <p style="color: #ffffff; margin: 5px 0;"><strong>Payment Status:</strong> ${orderDetails.paymentStatus}</p>
          </div>
          <p style="color: #888; font-size: 14px;">
            You will receive your digital products via email once payment is confirmed.
          </p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"GamePasal" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'GamePasal - Order Confirmation',
      html: html
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Order confirmation email sent:', result.messageId);
    return { success: true, messageId: result.messageId };

  } catch (error) {
    console.error('❌ Error sending order confirmation:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendOTPEmail,
  sendOrderConfirmation
};