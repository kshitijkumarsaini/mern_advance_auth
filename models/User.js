const crypto = require("crypto");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// User Collection DataModel
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "Please Provide a Username"],
  },
  email: {
    type: String,
    required: [true, "Please Provide a Email"],
    unique: true,
    match: [
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      "Please provide a valid email",
    ],
  },
  password: {
    type: String,
    required: [true, "Please Add a Password"],
    minlength: 6,
    select: false, //Prevents password from being sent back unless requested
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
});

// Middleware to Hash user password before saving to the DB
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match the password received from the user with the password stored in the DB
UserSchema.methods.matchPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Method to Generate Access Token
UserSchema.methods.getSignedToken = function () {
  return jwt.sign(
    { id: this._id },
    process.env.AUTH_SECRET || "some_super_secret",
    {
      expiresIn: process.env.AUTH_EXPIRES,
    }
  );
};

// Generate new Token for Forget Password Request
UserSchema.methods.getResetPasswordToken = function () {
  // generate token
  const resetToken = crypto.randomBytes(25).toString("hex");

  // Save the hashed token in the DB
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.resetPasswordExpire = Date.now() + 10 * (60 * 1000);

  return resetToken;
};

const User = mongoose.model("User", UserSchema);
module.exports = User;
