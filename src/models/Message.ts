// src/models/Message.ts
export interface Message {
  id: string;
  fromUserId: string;
  toUserId: string;
  text: string;
  timestamp: string; // ISO format
}
