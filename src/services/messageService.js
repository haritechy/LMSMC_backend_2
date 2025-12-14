// messageService.js - FIXED: Count ALL recent messages globally (not user-specific)
const repo = require("../respositories/messageRepository");
const { clients } = require("../socket/socket");

exports.getMessages = (userId, currentUserId) => {
  return repo.findMessagesBetweenUsers(userId, currentUserId);
};

exports.sendMessage = async (senderId, receiverId, content) => {
  if (!receiverId || !content) {
    throw new Error("Missing fields");
  }

  const receiverUser = await repo.findUserById(receiverId);
  if (!receiverUser) {
    throw new Error("Receiver does not exist");
  }

  const isInappropriate = content.toLowerCase().includes("inappropriate");

  const newMessage = await repo.createMessage({
    senderId,
    receiverId,
    content,
    status: isInappropriate ? "flagged" : "delivered",
    priority: isInappropriate ? "high" : "normal",
    read: false,
  });

  const receiver = clients.get(receiverId);
  if (receiver?.ws) {
    receiver.ws.send(JSON.stringify({
      from: senderId,
      content,
      createdAt: newMessage.createdAt,
    }));
  }

  return newMessage;
};

exports.markMessagesAsRead = (senderId, receiverId) => {
  return repo.markMessagesAsRead(senderId, receiverId);
};

exports.getChatContacts = async (currentUserId) => {
  const messages = await repo.findAllUserMessages(currentUserId);
  const contactMap = new Map();

  messages.forEach((msg) => {
    const user = msg.senderId === currentUserId ? msg.Receiver : msg.Sender;
    if (!user) return;

    if (!contactMap.has(user.id)) {
      contactMap.set(user.id, {
        id: user.id,
        name: user.name,
        unreadCount: 0,
      });
    }

    if (msg.receiverId === currentUserId && !msg.read) {
      contactMap.get(user.id).unreadCount += 1;
    }
  });

  return Array.from(contactMap.values());
};

exports.getAllMessages = async (page = 1, limit = 10, filters = {}) => {
  try {
    const offset = (page - 1) * limit;
    const {
      searchTerm,
      userFilter,
      statusFilter,
      startDate,
      endDate,
      sortBy = "createdAt",
      sortOrder = "DESC"
    } = filters;

    const whereConditions = {};

    if (statusFilter && statusFilter !== "all") {
      whereConditions.status = statusFilter;
    }

    if (startDate || endDate) {
      whereConditions.createdAt = {};
      if (startDate) {
        whereConditions.createdAt[require("sequelize").Op.gte] = new Date(startDate);
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        whereConditions.createdAt[require("sequelize").Op.lte] = endDateTime;
      }
    }

    const { messages, total } = await repo.findAllMessagesAdminPaginated(
      whereConditions,
      offset,
      limit,
      sortBy,
      sortOrder,
      searchTerm,
      userFilter
    );

    const totalPages = Math.ceil(total / limit);

    const formattedMessages = messages.map((msg) => ({
      id: msg.id,
      senderId: msg.senderId,
      receiverId: msg.receiverId,
      senderName: msg.Sender?.name || "Unknown",
      senderRole: msg.Sender?.Role?.name || "unknown",
      receiverName: msg.Receiver?.name || "Unknown",
      receiverRole: msg.Receiver?.Role?.name || "unknown",
      content: msg.content,
      preview: msg.content.slice(0, 100),
      length: msg.content.length,
      status: msg.status,
      priority: msg.priority,
      read: msg.read,
      timestamp: msg.createdAt,
      flagged: msg.status === "flagged"
    }));

    return {
      messages: formattedMessages,
      pagination: {
        currentPage: page,
        totalPages,
        totalMessages: total,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  } catch (error) {
    console.error("Get all messages error:", error);
    throw error;
  }
};

// 🔥 FIXED: Count ALL recent messages (admin sees all new messages globally)
exports.getRecentMessagesCount = async (lastCheckTime) => {
  try {
    console.log(`📊 Counting messages created after: ${lastCheckTime}`);
    
    // Use current time minus 5 minutes as default if no lastCheckTime
    const checkTime = lastCheckTime || new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const count = await repo.countRecentMessages(checkTime);
    
    console.log(`✅ Found ${count} recent messages`);
    return count;
  } catch (error) {
    console.error("❌ Get recent messages count error:", error);
    throw error;
  }
};

// 🔥 FIXED: Get ALL recent messages (not filtered by user)
exports.getRecentMessages = async (limit = 10) => {
  try {
    console.log(`📨 Fetching ${limit} most recent messages`);
    
    const messages = await repo.findRecentMessages(limit);
    
    console.log(`✅ Retrieved ${messages.length} messages`);
    
    return messages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      timestamp: msg.createdAt,
      senderId: msg.senderId,
      receiverId: msg.receiverId,
      senderName: msg.Sender?.name || "Unknown",
      senderRole: msg.Sender?.Role?.name || "unknown",
      receiverName: msg.Receiver?.name || "Unknown",
      receiverRole: msg.Receiver?.Role?.name || "unknown",
      preview: msg.content.slice(0, 100) + (msg.content.length > 100 ? "..." : ""),
      status: msg.status,
      read: msg.read
    }));
  } catch (error) {
    console.error("❌ Get recent messages error:", error);
    throw error;
  }
};

exports.getChatHistory = (currentUserId, otherUserId) => {
  return repo.findChatHistory(currentUserId, otherUserId);
};

exports.deleteMessage = async (messageId) => {
  const message = await repo.findMessageById(messageId);
  if (!message) {
    throw new Error("Message not found");
  }
  await repo.deleteMessage(message);
  return { message: "Message deleted successfully" };
};

exports.bulkDeleteMessages = async (messageIds) => {
  try {
    const deletedCount = await repo.bulkDeleteMessages(messageIds);
    return {
      message: "Messages deleted successfully",
      deletedCount
    };
  } catch (error) {
    console.error("Bulk delete messages error:", error);
    throw error;
  }
};

exports.deleteOldMessages = async (days = 15) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    console.log(`🗑️ Auto-delete: Removing messages older than ${days} days (before ${cutoffDate.toISOString()})`);
    
    const deletedCount = await repo.deleteMessagesOlderThan(cutoffDate);
    
    console.log(`✅ Auto-delete completed: ${deletedCount} messages deleted`);
    
    return {
      success: true,
      message: `Successfully deleted ${deletedCount} messages older than ${days} days`,
      deletedCount,
      cutoffDate: cutoffDate.toISOString()
    };
  } catch (error) {
    console.error("❌ Delete old messages error:", error);
    return {
      success: false,
      error: error.message,
      deletedCount: 0
    };
  }
};