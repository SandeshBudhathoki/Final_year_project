const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      console.log("No token provided in request");
      return res
        .status(401)
        .json({ message: "No token provided, authorization denied" });
    }

    console.log("Token received, verifying...");
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    );
    console.log("Token verified, user ID:", decoded.userId);
    
    const user = await User.findById(decoded.userId);

    if (!user) {
      console.log("User not found for ID:", decoded.userId);
      return res.status(401).json({ message: "Token is not valid - user not found" });
    }

    console.log("User found:", user.email, "role:", user.role);
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: "Invalid token format" });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Token has expired" });
    }
    
    res.status(401).json({ message: "Token is not valid" });
  }
};

const admin = (req, res, next) => {
  console.log("Admin middleware check - user:", req.user?.email, "role:", req.user?.role);
  
  if (!req.user) {
    console.error("No user found in request");
    return res.status(401).json({ message: "No user found - authentication required" });
  }
  
  if (req.user.role === "admin") {
    console.log("Admin access granted for:", req.user.email);
    return next();
  }
  
  console.error("Access denied - user role:", req.user.role, "email:", req.user.email);
  return res.status(403).json({ 
    message: "Access denied: Admins only", 
    userRole: req.user.role,
    userEmail: req.user.email 
  });
};

const doctor = (req, res, next) => {
  if (req.user && req.user.role === "doctor") {
    return next();
  }
  return res.status(403).json({ message: "Access denied: Doctors only" });
};

module.exports = auth;
module.exports.admin = admin;
module.exports.doctor = doctor;
