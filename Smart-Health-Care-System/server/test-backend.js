const mongoose = require("mongoose");
const User = require("./models/User");

// Connect to MongoDB
mongoose
  .connect("mongodb://localhost:27017/diabetes_prediction")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

async function testAvatarField() {
  try {
    console.log("Testing avatar field functionality...");
    
    // Find a user to test with
    const user = await User.findOne({});
    if (!user) {
      console.log("No users found in database");
      return;
    }
    
    console.log("Found user:", user.email);
    console.log("Current avatar:", user.avatar);
    
    // Test updating avatar
    user.avatar = "/uploads/avatars/test_avatar.jpg";
    await user.save();
    
    console.log("Avatar updated to:", user.avatar);
    
    // Reload user to verify persistence
    const reloadedUser = await User.findById(user._id);
    console.log("Reloaded user avatar:", reloadedUser.avatar);
    
    console.log("Avatar field test completed successfully!");
    
  } catch (error) {
    console.error("Test error:", error);
  } finally {
    mongoose.connection.close();
  }
}

testAvatarField(); 