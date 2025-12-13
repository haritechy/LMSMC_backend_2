// messageRepository.js - Complete Repository with Auto-Delete
const { Op } = require("sequelize");
const { Message, User, Role } = require("../models/associations");

exports.findMessagesBetweenUsers = (user1, user2) => {
  return Message.findAll({
    where: {
      [Op.or]: [
        { senderId: user1, receiverId: user2 },
        { senderId: user2, receiverId: user1 }
      ]
    },
    order: [['createdAt', 'ASC']]
  });
};

exports.createMessage = (data) => {
  return Message.create(data);
};

exports.findUserById = (id) => {
  return User.findByPk(id);
};

exports.markMessagesAsRead = (senderId, receiverId) => {
  return Message.update(
    { read: true, status: "read" },
    {
      where: {
        senderId,
        receiverId,
        read: false
      }
    }
  );
};

exports.findAllUserMessages = (userId) => {
  return Message.findAll({
    where: {
      [Op.or]: [{ senderId: userId }, { receiverId: userId }]
    },
    include: [
      { model: User, as: "Sender", attributes: ["id", "name"] },
      { model: User, as: "Receiver", attributes: ["id", "name"] }
    ],
    order: [["createdAt", "DESC"]]
  });
};

exports.findAllMessagesAdmin = () => {
  return Message.findAll({
    order: [["createdAt", "DESC"]],
    include: [
      {
        model: User,
        as: "Sender",
        attributes: ["id", "name"],
        include: [{ model: Role, attributes: ["name"] }]
      },
      {
        model: User,
        as: "Receiver",
        attributes: ["id", "name"],
        include: [{ model: Role, attributes: ["name"] }]
      }
    ]
  });
};

// Paginated admin messages with filters
exports.findAllMessagesAdminPaginated = async (
  whereConditions,
  offset,
  limit,
  sortBy = "createdAt",
  sortOrder = "DESC",
  searchTerm = "",
  userFilter = "all"
) => {
  try {
    const queryOptions = {
      where: whereConditions,
      include: [
        {
          model: User,
          as: "Sender",
          attributes: ["id", "name"],
          include: [{ 
            model: Role, 
            attributes: ["name"]
          }],
          required: false
        },
        {
          model: User,
          as: "Receiver",
          attributes: ["id", "name"],
          include: [{ 
            model: Role, 
            attributes: ["name"] 
          }],
          required: false
        }
      ],
      order: [[sortBy, sortOrder]],
      limit,
      offset
    };

    if (searchTerm) {
      queryOptions.where = {
        ...queryOptions.where,
        [Op.or]: [
          { content: { [Op.iLike]: `%${searchTerm}%` } }
        ]
      };
    }

    if (userFilter !== "all") {
      queryOptions.include[0].include[0].where = { name: userFilter };
      queryOptions.include[0].required = true;
    }

    const countOptions = {
      where: queryOptions.where,
      include: queryOptions.include.map(inc => ({
        ...inc,
        attributes: []
      })),
      distinct: true
    };

    const [messages, total] = await Promise.all([
      Message.findAll(queryOptions),
      Message.count(countOptions)
    ]);

    return { messages, total };
  } catch (error) {
    console.error("Repository pagination error:", error);
    throw error;
  }
};

// Count recent messages
exports.countRecentMessages = async (lastCheckTime) => {
  return await Message.count({
    where: {
      createdAt: {
        [Op.gt]: new Date(lastCheckTime)
      }
    }
  });
};

// Find recent messages
exports.findRecentMessages = async (limit = 5) => {
  return await Message.findAll({
    order: [["createdAt", "DESC"]],
    limit,
    include: [
      {
        model: User,
        as: "Sender",
        attributes: ["id", "name"],
        include: [{ model: Role, attributes: ["name"] }]
      },
      {
        model: User,
        as: "Receiver",
        attributes: ["id", "name"],
        include: [{ model: Role, attributes: ["name"] }]
      }
    ]
  });
};

exports.findChatHistory = (user1, user2) => {
  return Message.findAll({
    where: {
      [Op.or]: [
        { senderId: user1, receiverId: user2 },
        { senderId: user2, receiverId: user1 }
      ]
    },
    order: [['createdAt', 'ASC']],
    attributes: ['id', 'senderId', 'receiverId', 'content', 'createdAt', 'status', 'priority', 'read'],
    include: [
      {
        model: User,
        as: 'Sender',
        attributes: ['id', 'name'],
        include: [{ model: Role, attributes: ['name'] }]
      },
      {
        model: User,
        as: 'Receiver',
        attributes: ['id', 'name'],
        include: [{ model: Role, attributes: ['name'] }]
      }
    ]
  });
};

exports.findMessageById = (id) => {
  return Message.findByPk(id);
};

exports.deleteMessage = (message) => {
  return message.destroy();
};

// Bulk delete messages
exports.bulkDeleteMessages = async (messageIds) => {
  const result = await Message.destroy({
    where: {
      id: {
        [Op.in]: messageIds
      }
    }
  });
  return result;
};

// 🔥 AUTO-DELETE: Delete messages older than cutoff date
exports.deleteMessagesOlderThan = async (cutoffDate) => {
  try {
    console.log(`🗑️ Repository: Deleting messages created before ${cutoffDate.toISOString()}`);
    
    const result = await Message.destroy({
      where: {
        createdAt: {
          [Op.lt]: cutoffDate
        }
      }
    });
    
    console.log(`✅ Repository: Deleted ${result} messages`);
    return result;
  } catch (error) {
    console.error("❌ Repository delete old messages error:", error);
    throw error;
  }
};