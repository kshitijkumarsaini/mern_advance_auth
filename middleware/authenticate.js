const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ErrorResponse = require("../utils/errorResponse");

// Middleware to check for the Authorized Access
exports.protect = async (req, res, next) => {
  let token;

  // Check for the Auth Token in the Request Headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(new ErrorResponse("Un-Authorized Access", 401));
  }

  try {
    // Verify the token
    const decoded = jwt.verify(
      token,
      process.env.AUTH_SECRET || "some_super_secret"
    );
    // Extract User Id from the Token
    const user = await User.findById(decoded.id);

    // Send error if the ID is invalid or the user with that ID not found in the DB
    if (!user) {
      return next(new ErrorResponse("No User Found", 404));
    }

    req.user = user;
    next();
  } catch (error) {
    return next(new ErrorResponse("Un-Authorized Access", 401));
  }
};
