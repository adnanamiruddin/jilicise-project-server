import { formatDate } from "../helpers/helper.js";

class RoomContestant {
  constructor(roomId, userId, score) {
    this.roomId = roomId;
    this.userId = userId;
    this.score = score;
    this.createdAt = new Date();
  }

  toObject() {
    return {
      roomId: this.roomId,
      userId: this.userId,
      score: this.score,
      createdAt: this.createdAt,
    };
  }

  static toFormattedObject(doc) {
    const data = doc.data();
    const roomContestant = new RoomContestant(
      data.roomId,
      data.userId,
      data.score
    );
    roomContestant.id = doc.id;
    roomContestant.createdAt = formatDate(data.createdAt);
    return roomContestant;
  }
}

export default RoomContestant;
