// messageController.js - Updated Controller
const messageService = require("../services/messageService");

// 🔹 Controller: Get messages between two users
exports.getMessages = async (req, res) => {
  try {
    const messages = await messageService.getMessages(req.params.userId, req.user.id);
    res.json(messages);
  } catch (err) {
    console.error("Get messages failed:", err);
    res.status(500).json({ error: err.message });
  }
};

// 🔹 Controller: Send message
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    const newMessage = await messageService.sendMessage(req.user.id, receiverId, content);
    res.json(newMessage);
  } catch (err) {
    console.error("Send message failed:", err);
    res.status(400).json({ error: err.message });
  }
};

// 🔹 Controller: Mark messages as read
exports.markMessagesAsRead = async (req, res) => {
  try {
    await messageService.markMessagesAsRead(req.params.userId, req.user.id);
    res.json({ message: "Messages marked as read" });
  } catch (err) {
    console.error("Mark messages failed:", err);
    res.status(500).json({ error: err.message });
  }
};

// 🔹 Controller: Get chat contacts with unread count
exports.getChatContacts = async (req, res) => {
  try {
    const contacts = await messageService.getChatContacts(req.user.id);
    res.json(contacts);
  } catch (err) {
    console.error("Get contacts failed:", err);
    res.status(500).json({ error: err.message });
  }
};

// 🔹 Controller: Admin get all messages with pagination
exports.getAllMessages = async (req, res) => {
  try {
    // Uncomment this for admin-only access
    // if (!req.user || req.user.roleid != 1) {
    //   return res.status(403).json({ error: "Admins only" });
    // }

    // Extract pagination and filter params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const filters = {
      searchTerm: req.query.search || "",
      userFilter: req.query.userFilter || "all",
      statusFilter: req.query.statusFilter || "all",
      startDate: req.query.startDate || null,
      endDate: req.query.endDate || null,
      sortBy: req.query.sortBy || "createdAt",
      sortOrder: req.query.sortOrder || "DESC"
    };

    const data = await messageService.getAllMessages(page, limit, filters);
    
    res.json({
      success: true,
      ...data
    });
  } catch (err) {
    console.error("Get all messages failed:", err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

// 🔹 Controller: Get recent messages count
exports.getRecentMessagesCount = async (req, res) => {
  try {
    const lastCheckTime = req.query.lastCheckTime || new Date(Date.now() - 60000).toISOString();
    const count = await messageService.getRecentMessagesCount(lastCheckTime);
    
    res.json({
      success: true,
      count
    });
  } catch (err) {
    console.error("Get recent messages count failed:", err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

// 🔹 Controller: Get recent messages
exports.getRecentMessages = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const messages = await messageService.getRecentMessages(limit);
    
    res.json({
      success: true,
      messages
    });
  } catch (err) {
    console.error("Get recent messages failed:", err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

// 🔹 Controller: Get chat history
exports.getChatHistory = async (req, res) => {
  try {
    const history = await messageService.getChatHistory(req.user.id, req.params.otherUserId);
    res.json(history);
  } catch (err) {
    console.error("Get chat history failed:", err);
    res.status(500).json({ error: err.message });
  }
};

// 🔹 Controller: Admin delete message
exports.deleteMessage = async (req, res) => {
  try {
    // Uncomment for admin-only access
    // if (!req.user || req.user.role !== "admin") {
    //   return res.status(403).json({ error: "Admins only" });
    // }

    const result = await messageService.deleteMessage(req.params.messageId);
    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    console.error("Delete message failed:", err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

// 🔹 Controller: Bulk delete messages
exports.bulkDeleteMessages = async (req, res) => {
  try {
    // Uncomment for admin-only access
    // if (!req.user || req.user.role !== "admin") {
    //   return res.status(403).json({ 
    //     success: false,
    //     error: "Admins only" 
    //   });
    // }

    const { messageIds } = req.body;
    
    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: "Invalid message IDs" 
      });
    }

    const result = await messageService.bulkDeleteMessages(messageIds);
    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    console.error("Bulk delete messages failed:", err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

exports.autoDeleteOldMessages = async (req, res) => {
  try {
    const { days = 15 } = req.query;
    
    console.log(`🗑️ Manual auto-delete triggered for messages older than ${days} days`);
    
    const result = await messageService.deleteOldMessages(parseInt(days));
    
    res.status(200).json(result);
  } catch (error) {
    console.error("Auto-delete error:", error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      deletedCount: 0
    });
  }
};