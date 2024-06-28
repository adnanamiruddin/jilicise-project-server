import { getDocs, query, where } from "firebase/firestore";
import { formatDate } from "../helpers/helper.js";
import { RoomsTable } from "../config/config.js";

class Room {
  constructor(name, description, status, code, roomMasterId) {
    this.name = name;
    this.description = description;
    this.status = status; // pending, ongoing, finished
    this.code = code;
    this.roomMasterId = roomMasterId;
    this.typeOfHandPoseId = [];
    this.startAt = null;
    this.endAt = null;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  static async create(name, description, status, roomMasterId) {
    const code = await this.createRoomCode();
    return new Room(name, description, status, code, roomMasterId);
  }

  static async createRoomCode() {
    let code = "";
    let isCodeUnique = false;
    let attemptCount = 0;
    //
    while (!isCodeUnique && attemptCount < 10) {
      code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const teamDoc = await getDocs(
        query(RoomsTable, where("code", "==", code))
      );
      isCodeUnique = teamDoc.empty;
      attemptCount++;
    }
    // If the team code is still not unique after 10 attempts
    if (!isCodeUnique) throw new Error("Failed to generate a unique team code");
    //
    return code;
  }

  toObject() {
    return {
      name: this.name,
      description: this.description,
      status: this.status,
      code: this.code,
      roomMasterId: this.roomMasterId,
      typeOfHandPoseId: this.typeOfHandPoseId,
      startAt: this.startAt,
      endAt: this.endAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  static toFormattedObject(doc) {
    const data = doc.data();
    const room = new Room(
      data.name,
      data.description,
      data.status,
      data.code,
      data.roomMasterId
    );
    room.id = doc.id;
    room.typeOfHandPoseId = data.typeOfHandPoseId;
    room.startAt = data.startAt;
    room.endAt = data.endAt;
    room.createdAt = formatDate(data.createdAt);
    room.updatedAt = formatDate(data.updatedAt);
    return room;
  }
}

export default Room;
