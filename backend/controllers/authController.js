const User = require('../models/User');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const generateCode = require('../utils/generateVerificationCode');
const createTransporter = require('../config/mailer')
const { generateToken, verifyToken } = require('../utils/jwtUtils');

// Register a new user
exports.register = async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = generateCode();

    const user = new User({
      email,
      password: hashedPassword,
      verificationCode,
    });

    await user.save();

    const transporter = createTransporter();
    await transporter.sendMail({
      from: 'BloodApp <bloodonerl@gmail.com>',
      to: email,
      subject: 'Verify your email',
      text: `Your verification code is: ${verificationCode}`,
    });

    res.json({ message: 'Registered! Check your email for verification code.' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// Verify user's email
exports.verify = async (req, res) => {
  try {
    const { code } = req.body;

    const user = await User.findOne({ verificationCode: code });
    if (!user) {
      return res.status(400).json({ message: 'Invalid code or code expired' });
    }

    user.isVerified = true;
    user.verificationCode = null;
    await user.save();

    // Generate JWT token
    const token = generateToken(user._id);

    res.json({ 
      message: 'Email verified and logged in!',
      token: token,
      user: { 
        id: user._id,
        email: user.email 
      }
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ message: 'Server error during verification' });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    if (!user.isVerified) {
      return res.status(403).json({ message: 'Email not verified' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid password' });

    // Generate JWT token
    const token = generateToken(user._id);

    res.json({ 
      message: 'Logged in successfully!',
      token: token,
      user: { 
        id: user._id,
        email: user.email 
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// Logout user (optional - mainly for client-side token removal)
exports.logout = (req, res) => {
  res.json({ message: 'Logged out successfully. Please remove token from client.' });
};

// Forgot password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();

    // Send reset email
    const transporter = createTransporter();
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
    
    await transporter.sendMail({
      from: 'BloodApp <bloodonerl@gmail.com>',
      to: email,
      subject: 'Password Reset Request',
      html: `
        <h2>Password Reset Request</h2>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetUrl}" style="color: #007bff; text-decoration: underline;">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    });

    res.json({ message: 'Password reset link sent to your email' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error during password reset request' });
  }
};

// Reset password
// exports.resetPassword = async (req, res) => {
//   try {
//     const { token } = req.params;
//     const { password, confirmPassword } = req.body;

//     if (password !== confirmPassword) {
//       return res.status(400).json({ message: 'Passwords do not match' });
//     }

//     const user = await User.findOne({
//       resetPasswordToken: token,
//       resetPasswordExpires: { $gt: Date.now() }
//     });

//     if (!user) {
//       return res.status(400).json({ message: 'Invalid or expired reset token' });
//     }

//     // Hash new password
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Update user
//     user.password = hashedPassword;
//     user.resetPasswordToken = undefined;
//     user.resetPasswordExpires = undefined;
//     await user.save();

//     res.json({ message: 'Password reset successfully' });
//   } catch (error) {
//     console.error('Reset password error:', error);
//     res.status(500).json({ message: 'Server error during password reset' });
//   }
// };


// Add this token validation endpoint
// authController.js - Fix the validateToken and resetPassword functions

exports.validateToken = async (req, res) => {
  try {
    const { token } = req.params;
    
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ valid: false });
    }

    // Return email and validity
    res.json({ 
      valid: true, 
      email: user.email 
    });
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).json({ 
      error: 'Server error during token validation',
      valid: false
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params; // Get token from URL params
    const { password, confirmPassword } = req.body;

    // Validate inputs
    if (!password || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    // Find user by token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Hash and save new password
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error during password reset' });
  }
};