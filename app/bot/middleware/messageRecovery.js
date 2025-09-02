import { WAProto } from 'baileys';
import * as luxon from 'luxon';
import { deletedMessagesLog } from '../../utils/globalMap.js';

const MAX_MESSAGES_TO_STORE = 5;

export const handler = async (sock, m, $next) => {
  if (!m.isGroup) return $next;
  if (m.isSenderBot) return $next;
  if (m.mtype !== 'protocolMessage' || m.message[m.mtype].type !== WAProto.Message.ProtocolMessage.Type.REVOKE) {
    return $next;
  }

  const deletedMessages = deletedMessagesLog.get(m.chat) || [];
  
  deletedMessages.unshift({
    pushName: m.pushName,
    sender: m.sender,
    timestamp: luxon.DateTime.now().toMillis(),
    key: m.key
  });
  
  if (deletedMessages.length > MAX_MESSAGES_TO_STORE) {
    deletedMessages.pop();
  }
  
  deletedMessagesLog.set(m.chat, deletedMessages);

  return $next;
};