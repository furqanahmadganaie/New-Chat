
 import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../lib/utils.js";
import cloudinary from "../lib/cloudinary.js";
import { io } from "../lib/socket.js";
import { measure } from "../utils/performance.js";
import logger from "../config/logger.js";


export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;// fetch user datatfrom 
  logger.info({ requestId: req.requestId, email }, "Signup request received");

  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({ email }); //  userr withis emal find 

    if (user) return res.status(400).json({ message: "Email already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
    });

    if (newUser) {
      // generate jwt token here
      generateToken(newUser._id, res);
      logger.info({ requestId: req.requestId, userId: newUser._id }, "Saving new user to MongoDB");
      await newUser.save();
      logger.info(
  {
    requestId: req.requestId,
    userId: newUser._id,
  },
  "User created successfully"
);


      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        profilePic: newUser.profilePic,
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    logger.error(
  {
    requestId: req.requestId,
    error: error.message,
    stack: error.stack,
  },
  "Error in signup controller"
);
    res.status(500).json({ message: "Internal Server Error" });
  }
};






export const login = async (req, res) => {
  logger.info({ requestId: req.requestId, email: req.body.email }, "Login request received");
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    generateToken(user._id, res);

    logger.info({ requestId: req.requestId, userId: user._id }, "User logged in successfully");
    
    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
    });
  } catch (error) {
    logger.error({ requestId: req.requestId, error: error.message }, "Error in login controller");
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const logout = (req, res) => {
  try {
    //just clear cookie
    res.cookie("jwt", "", { maxAge: 0 });
    logger.info(
  {
    requestId: req.requestId,
    userId: req.user?._id,
  },
  "User logged out"
);
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    logger.error({ requestId: req.requestId, error: error.message }, "Error in logout controller");
    res.status(500).json({ message: "Internal Server Error" });
  }
};


export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;
    const userId = req.user._id;
    logger.info(
  {
    requestId: req.requestId,
    userId,
  },
  "Profile update request received"
);

    if (!profilePic) {
      return res.status(400).json({ message: "Profile pic is required" });
    }

    logger.info(
  {
    requestId: req.requestId,
    userId,
  },
  "Uploading profile picture to Cloudinary"
);
    const uploadResponse = await cloudinary.uploader.upload(profilePic,{
      folder: "pingme/profile_pictures",
      resource_type: "image",
      transformation: [
        { width: 800, height: 800, crop: "limit" },
        { quality: "auto", fetch_format: "auto" },
      ],
    });

    logger.info(
  {
    requestId: req.requestId,
    userId,
  },
  "Profile picture uploaded successfully"
);


    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: uploadResponse.secure_url },
      { new: true }
    ).select("-password");
    logger.info(
  {
    requestId: req.requestId,
    userId,
  },
  "Profile updated successfully"
);

    // Update the cached contact/profile data in every connected client.
    io.emit("profileUpdated", {
      _id: updatedUser._id,
      fullName: updatedUser.fullName,
      profilePic: updatedUser.profilePic,
      updatedAt: updatedUser.updatedAt,
    });

    res.status(200).json(updatedUser);
  } catch (error) {
    logger.error({ requestId: req.requestId, error: error.message }, "Error in updateProfile controller");

    if (error?.http_code === 403) {
      return res.status(503).json({
        message:
          "Cloudinary is blocking uploads for this account. Verify your Cloudinary email/account activation and check that the API key is enabled for this product environment.",
      });
    }

    res.status(500).json({
      message: error?.message || "Profile image upload failed",
    });
  }
};

export const checkAuth = (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    logger.error({ requestId: req.requestId, error: error.message }, "Error in checkAuth controller");
    res.status(500).json({ message: "Internal Server Error" });
  }
};
