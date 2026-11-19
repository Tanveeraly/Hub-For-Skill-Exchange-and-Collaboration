import { getIO } from "./chat.socket.js";

/**
 * Save a notification and push it to the recipient in real time.
 * Drop-in replacement for prisma.notification.create({ data }).
 * The live push is best-effort: if the socket server isn't ready, the
 * notification is still saved and shows up the next time the user loads them.
 */
export const createAndPush = async (prisma, args) => {
  const notification = await prisma.notification.create({
    ...args,
    include: {
      sender: { select: { id: true, name: true, profile: { select: { avatarUrl: true } } } },
    },
  });
  try {
    getIO().to(String(notification.userId)).emit("notification", notification);
  } catch (err) {
    console.error("Live notification failed:", err.message);
  }
  return notification;
};
