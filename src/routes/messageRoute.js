// messageRoutes.js - Complete Routes with Auto-Delete Support
const express = require("express");
const router = express.Router();

const {
  getMessages,
  getChatContacts,
  sendMessage,
  getAllMessages,
  getChatHistory,
  deleteMessage,
  markMessagesAsRead,
  getRecentMessagesCount,
  getRecentMessages,
  bulkDeleteMessages,
  autoDeleteOldMessages
} = require("../controllers/messageController");

const { verifyToken } = require("../middleware/socketAuth");

// ============= CHAT ROUTES =============
router.get("/messages/:userId", verifyToken, getMessages);
router.post("/messages", verifyToken, sendMessage);
router.post("/messages/read/:userId", verifyToken, markMessagesAsRead);
router.get("/history/:otherUserId", verifyToken, getChatHistory);
router.get("/contacts", verifyToken, getChatContacts);

// ============= ADMIN ROUTES =============
// Get all messages with pagination and filters
router.get("/admin/messages", verifyToken, getAllMessages);

// Get recent messages count for notification badge
router.get("/admin/messages/recent-count", verifyToken, getRecentMessagesCount);

// Get recent messages for notification preview
router.get("/admin/messages/recent", verifyToken, getRecentMessages);

// 🔥 Manual trigger for auto-delete (optional - for testing or manual cleanup)
router.post("/admin/messages/auto-delete", verifyToken, autoDeleteOldMessages);

// ============= DELETE ROUTES =============
// Delete single message
router.delete("/delete/:messageId", verifyToken, deleteMessage);

// Bulk delete messages
router.post("/delete/bulk", verifyToken, bulkDeleteMessages);

module.exports = router;