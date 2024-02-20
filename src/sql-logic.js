const loadInitialMessages = `
  SELECT *
  FROM messages
  WHERE chat_id = ?
  ORDER BY message_id DESC
  LIMIT 20;
`;

const loadAdditionalMessages = `
SELECT *
FROM messages
WHERE chat_id = ? AND message_id < ?
ORDER BY message_id DESC
LIMIT 20;
`;

const appendChat = `
  INSERT INTO chats (user1_id, user2_id)
  VALUES (?, ?);
`;

const getLatestChatId = `
  SELECT chat_id
  FROM chats
  ORDER BY chat_id DESC
  LIMIT 1;
`;

const appendMessage = `
  INSERT INTO messages (chat_id, sender_id, content, timestamp)
  VALUES (?, ?, ?, ?);
`;



module.exports = {
  loadInitialMessages,
  loadAdditionalMessages,
  appendChat,
  getLatestChatId,
  appendMessage,
};