const crypto = require("crypto");
const User = require("../models/User");
const ErrorResponse = require("../utils/errorResponse");
const sendEmail = require("../utils/sendEmail");

// Controller For handling Register Requests
exports.register = async (req, res, next) => {
  // fetched user details from the Request Body
  const { username, email, password } = req.body;

  try {
    const doesExist = await User.findOne({ email });

    // Send Error if the email already exists
    if (doesExist) {
      return next(new ErrorResponse("Email Already Exists", 400));
    }

    // If Email Not exists then create a New user
    const user = await User.create({
      username,
      email,
      password,
    });

    // Send Success message after Successful registration
    sendToken(user, 201, res);
    // res.status(201).json({
    //   success: true,
    //   token: process.env.AUTH_TOKEN || "super_secret_token",
    // });
  } catch (error) {
    // Send Error message in case if an Error occurs
    next(error);
    // res.status(500).json({
    //   success: false,
    //   error: error.message,
    // });
  }
};

// Controller for handling Login Requests
exports.login = async (req, res, next) => {
  // fetched user details from the Request Body
  const { email, password } = req.body;

  // Check if the request body contains the Email & the Password
  if (!email || !password) {
    // res.status(400).json({
    //   success: false,
    //   error: "Please provide Email & Password",
    // });
    return next(new ErrorResponse("Please provide Email & Password", 400));
  }

  try {
    // Check if the email provided is correct
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      // res.status(404).json({
      //   success: false,
      //   error: "Invalid Credentials!!",
      // });
      return next(new ErrorResponse("Invalid Credentials!!", 401));
    }

    //Check if the password is correct
    const isMatch = await user.matchPassword(password);

    // Send error response if the password is In-correct
    if (!isMatch) {
      // res.status(404).json({
      //   success: false,
      //   error: "Invalid Credentials",
      // });
      return next(new ErrorResponse("Invalid Credentials!!", 401));
    }

    // If the credentials are correct then Send the Access Token
    sendToken(user, 200, res);
    // res.status(200).json({
    //   success: true,
    //   token: process.env.AUTH_TOKEN || "super_secret_token",
    // });
  } catch (error) {
    // Send Error message in case of an Error
    // res.status(500).json({
    //   success: false,
    //   error: error.message,
    // });
    next(error);
  }
};

// Controller for handling Forget Password Requests
exports.forgetpassword = async (req, res, next) => {
  const { email } = req.body;
  try {
    // find if the email exist in the DB
    const user = await User.findOne({ email });

    //Return Error if the email is Invalid
    if (!user) {
      return next(new ErrorResponse("Email could not be sent", 404));
    }

    const resetToken = user.getResetPasswordToken();
    await user.save();

    const resetUrl =
      process.env.RESET_PASS_URL ||
      `http://localhost:5000/resetpassword/${resetToken}`;

    const message = `
      <h1>You have requested a new password reset </h1>
      <p>Please visit this link to reset your Password</p>
      <a clicktracking=off href="${resetUrl}">${resetUrl}</a>
    `;

    try {
      await sendEmail({
        to: user.email,
        subject: "Password Reset Request",
        text: message,
      });

      res.status(200).json({
        success: true,
        data: "Email Sent",
      });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save();

      return next(new ErrorResponse("Email could not be sent", 500));
    }
  } catch (error) {
    next(error);
  }
};

// Controller for handling Reset password Requests
exports.resetpassword = async (req, res, next) => {
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.resetToken)
    .digest("hex");

  try {
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return next(new ErrorResponse("Invalid Reset token", 400));
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();
    res.status(201).json({
      success: true,
      data: "Password has been reset",
    });
  } catch (error) {
    next(error);
  }
};

// Middleware for creating token
const sendToken = (user, statusCode, res) => {
  const token = user.getSignedToken();
  res.status(statusCode).json({
    success: true,
    token,
  });
};
