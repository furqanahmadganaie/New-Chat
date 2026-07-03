import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { io } from "../lib/socket.js";
import { measure } from "../utils/performance.js";
import logger from "../config/logger.js";

// get all users without you 
export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    logger.info({ requestId: req.requestId, userId: loggedInUserId }, "Fetching users for sidebar");
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } })
      .select("-password")
      .lean();

    const usersWithConversationData = await Promise.all(
      filteredUsers.map(async (user) => {
        const [lastMessage, unreadCount] = await Promise.all([
          Message.findOne({
            $or: [
              { senderId: loggedInUserId, receiverId: user._id },
              { senderId: user._id, receiverId: loggedInUserId },
            ],
          })
            .sort({ createdAt: -1 })
            .lean(),
          Message.countDocuments({
            senderId: user._id,
            receiverId: loggedInUserId,
            read: false,
          }),
        ]);

        return { ...user, lastMessage, unreadCount };
      })
    );

    res.status(200).json(usersWithConversationData);
  } catch (error) {
    logger.error({ requestId: req.requestId, error: error.message }, "Error in getUsersForSidebar");
    res.status(500).json({ error: "Internal server error" });
  }
};






export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    await Message.updateMany(
      {
        senderId: userToChatId,
        receiverId: myId,
        read: false,
      },
      { $set: { read: true } }
    );

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    res.status(200).json(messages);
  } catch (error) {
    logger.error({ requestId: req.requestId, error: error.message }, "Error in getMessages controller");
    res.status(500).json({ error: "Internal server error" });
  }
};




export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;
    logger.info(
  {
    requestId: req.requestId,
    senderId,
    receiverId,
  },
  "Send message request received"
);

    if (!text?.trim() && !image) {
      return res.status(400).json({ message: "A message or image is required" });
    }

    let imageUrl;
    if (image) {

      // Upload base64 image to cloudinary
      logger.info(
  {
    requestId: req.requestId,
  },
  "Uploading image to Cloudinary"
);

const uploadResponse =
await measure(

    req,

    "Cloudinary Upload",

    async () => {

        return await cloudinary.uploader.upload(image);

    }

);
      imageUrl = uploadResponse.secure_url;
    }

    logger.info(
  {
    requestId: req.requestId,
  },
  "Image uploaded successfully"
);
    const newMessage = new Message({
      senderId,
      receiverId,
      text: text?.trim() || "",
      image: imageUrl,
    });
    logger.info(
  {
    requestId: req.requestId,
  },
  "Saving message to MongoDB"
);

 await measure(
    req,

    "MongoDB Save",

    async () => {

        return await newMessage.save();

    }
);

    
    // sent msg to user  in realtime 
    // Every tab/device for this user joins a room named with their user id.
await measure(

    req,

    "Socket Emit",

    async () => {

        io.to(String(receiverId))
            .emit("newMessage", newMessage);

    }

);

logger.info(
  {
    requestId: req.requestId,
    messageId: newMessage._id,
  },
  "Message sent successfully"
);

    res.status(201).json(newMessage);
  } catch (error) {
    logger.error({ requestId: req.requestId, error: error.message }, "Error in sendMessage controller");

    if (error?.http_code === 403) {
      return res.status(503).json({
        message:
          "Cloudinary is blocking image uploads. Verify the Cloudinary account and API key before sending images.",
      });
    }

    res.status(500).json({ error: "Internal server error" });
  }
};




export const markMessagesAsRead = async (req, res) => {
  try {
    const { id: senderId } = req.params;
    const receiverId = req.user._id;

    await Message.updateMany(
      {
        senderId,
        receiverId,
        read: false,
      },
      { $set: { read: true } }
    );

    res.status(200).json({ message: "Messages marked as read" });
  } catch (error) {
    logger.error({ requestId: req.requestId, error: error.message }, "Error marking messages as read");
    res.status(500).json({ error: "Internal server error" });
  }
};
