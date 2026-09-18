let io = null;

export function setIo(instance) {
  io = instance;
}

// No-ops until initSocket() runs (e.g. in tests) so services never need to
// null-check before broadcasting.
export function broadcastToUser(userId, event, payload) {
  io?.to(`user:${userId}`).emit(event, payload);
}

export function broadcastToRoom(room, event, payload) {
  io?.to(room).emit(event, payload);
}
