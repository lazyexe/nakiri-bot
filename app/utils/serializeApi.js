import { jidNormalizedUser } from 'baileys';

export default async ({ sock, metadata = null, user = null }) => {
  return {
    isGroup: Boolean(metadata),
    isUserAdmin:
      metadata && user
        ? Boolean(
          metadata.participants.find(
            participant => participant.jid === user.jid && participant.admin
          )
        )
        : false,
    isUserParticipant:
      metadata && user
        ? Boolean(
          metadata.participants.find(
            participant => participant.jid === user.jid
          )
        )
        : false,
    isBotAdmin: metadata
      ? Boolean(
        metadata.participants.find(
          participant =>
            participant.jid === jidNormalizedUser(sock?.user?.id) &&
              participant.admin
        )
      )
      : false,
  };
};
