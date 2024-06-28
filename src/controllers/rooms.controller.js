import {
  addDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  RoomContestantsTable,
  RoomsTable,
  UsersTable,
} from "../config/config.js";
import responseHandler from "../handlers/response.handler.js";
import Room from "../models/Room.js";
import RoomContestant from "../models/RoomContestant.js";
import User from "../models/User.js";
import { toZonedTime } from "date-fns-tz";
import { addSeconds } from "date-fns";

export const createRoom = async (req, res) => {
  try {
    const { id } = req.user;
    const { name, description } = req.body;

    const room = await Room.create(name, description, "pending", id);
    const newRoom = await addDoc(RoomsTable, room.toObject());

    responseHandler.created(res, { id: newRoom.id, ...room });
  } catch (error) {
    responseHandler.error(res);
  }
};

export const joinRoom = async (req, res) => {
  try {
    const { id } = req.user;
    const { code } = req.body;

    const roomDocs = await getDocs(
      query(RoomsTable, where("code", "==", code))
    );
    if (roomDocs.empty)
      return responseHandler.notFound(res, "Pertandingan tidak ditemukan");

    const room = Room.toFormattedObject(roomDocs.docs[0]);

    const userRef = doc(UsersTable, id);
    const userDoc = await getDoc(userRef);
    const user = User.getProfile(userDoc);
    if (user.isOnRoom)
      return responseHandler.badRequest(
        res,
        "Tidak dapat bergabung ke pertandingan selama masih berada di pertandingan bermain lain"
      );

    if (room.roomMasterId === id)
      return responseHandler.badRequest(
        res,
        "Pemilik pertandingan tidak bisa bergabung ke pertandingan sendiri"
      );
    if (room.status !== "pending")
      return responseHandler.badRequest(res, "Room is not pending");

    const roomContestant = new RoomContestant(room.id, id, 0);
    await addDoc(RoomContestantsTable, roomContestant.toObject());

    await updateDoc(userRef, { isOnRoom: room.id });

    responseHandler.ok(res, { id: room.id });
  } catch (error) {
    responseHandler.error(res);
  }
};

export const getRoomById = async (req, res) => {
  try {
    const { id } = req.user;
    const { roomId } = req.params;

    const roomDoc = await getDoc(doc(RoomsTable, roomId));
    if (!roomDoc.exists())
      return responseHandler.notFound(res, "Pertandingan tidak ditemukan");

    const room = Room.toFormattedObject(roomDoc);

    const isRoomContestantCheck = await getDocs(
      query(
        RoomContestantsTable,
        where("roomId", "==", roomDoc.id),
        where("userId", "==", req.user.id)
      )
    );
    if (isRoomContestantCheck.empty && room.roomMasterId !== id)
      return responseHandler.badRequest(
        res,
        "Kamu tidak terdaftar dalam pertandingan ini"
      );

    const roomContestants = [];
    const roomContestantDocs = await getDocs(
      query(RoomContestantsTable, where("roomId", "==", roomDoc.id))
    );
    for (const roomContestantDoc of roomContestantDocs.docs) {
      const roomContestant =
        RoomContestant.toFormattedObject(roomContestantDoc);
      const userDoc = await getDoc(doc(UsersTable, roomContestant.userId));
      const user = User.getProfile(userDoc);
      roomContestants.push({ ...roomContestant, ...user });
    }

    room.roomContestants = roomContestants;

    responseHandler.ok(res, room);
  } catch (error) {
    responseHandler.error(res);
  }
};

export const updateRoom = async (req, res) => {
  try {
    const { id } = req.user;
    const { roomId } = req.params;
    const { name, description, status } = req.body;

    const roomRef = doc(RoomsTable, roomId);
    const roomDoc = await getDoc(roomRef);
    if (!roomDoc.exists())
      return responseHandler.notFound(res, "Pertandingan tidak ditemukan");

    const room = Room.toFormattedObject(roomDoc);
    if (room.roomMasterId !== id) return responseHandler.forbidden(res);

    if (
      status === "pending" &&
      (room.status === "ongoing" || room.status === "finished")
    ) {
      return responseHandler.badRequest(
        res,
        "Pertandingan tidak sedang dalam masa tunggu"
      );
    }

    if (status === "finished" && room.status !== "ongoing") {
      return responseHandler.badRequest(
        res,
        "Pertandingan tidak sedang berlangsung"
      );
    }
    if (status === "finished" && room.status === "finished") {
      return responseHandler.badRequest(res, "Pertandingan sudah selesai");
    }

    await updateDoc(roomRef, {
      name,
      description,
      status,
      updatedAt: new Date(),
    });

    responseHandler.ok(res);
  } catch (error) {
    responseHandler.error(res);
  }
};

export const getUserRooms = async (req, res) => {
  try {
    const { id } = req.user;

    const rooms = [];
    const roomDocs = await getDocs(
      query(RoomsTable, where("roomMasterId", "==", id))
    );

    for (const roomDoc of roomDocs.docs) {
      const room = Room.toFormattedObject(roomDoc);
      rooms.push(room);
    }

    responseHandler.ok(res, rooms);
  } catch (error) {
    responseHandler.error(res);
  }
};

export const startRoom = async (req, res) => {
  try {
    const { id } = req.user;
    const { roomId } = req.params;

    const roomRef = doc(RoomsTable, roomId);
    const roomDoc = await getDoc(roomRef);
    if (!roomDoc.exists())
      return responseHandler.notFound(res, "Pertandingan tidak ditemukan");

    const room = Room.toFormattedObject(roomDoc);
    if (room.roomMasterId !== id) return responseHandler.forbidden(res);
    if (room.status !== "pending")
      return responseHandler.badRequest(
        res,
        "Pertandingan tidak sedang dalam masa tunggu"
      );
    if (room.typeOfHandPoseId.length < 2)
      return responseHandler.badRequest(
        res,
        "Tambahkan minimal 2 ronde pertandingan!"
      );

    const roomContestantDocs = await getDocs(
      query(RoomContestantsTable, where("roomId", "==", roomDoc.id))
    );
    if (roomContestantDocs.size < 2)
      return responseHandler.badRequest(
        res,
        "Minimal 2 peserta untuk memulai pertandingan!"
      );

    const totalDuration = room.typeOfHandPoseId.reduce(
      (acc, curr) => acc + curr.duration,
      0
    );

    const timeZone = "Asia/Makassar";
    const now = new Date();
    const zonedDate = toZonedTime(now, timeZone);

    await updateDoc(roomRef, {
      status: "ongoing",
      startAt: addSeconds(zonedDate, 30),
      endAt: addSeconds(zonedDate, totalDuration + 30),
      updatedAt: new Date(),
    });

    responseHandler.ok(res);
  } catch (error) {
    responseHandler.error(res);
  }
};

export const increaseScore = async (req, res) => {
  try {
    const { id } = req.user;
    const { roomId } = req.params;

    const contestantDoc = await getDocs(
      query(
        RoomContestantsTable,
        where("roomId", "==", roomId),
        where("userId", "==", id)
      )
    );

    const contestant = RoomContestant.toFormattedObject(contestantDoc.docs[0]);

    await updateDoc(doc(RoomContestantsTable, contestantDoc.docs[0].id), {
      score: contestant.score + 1,
    });

    responseHandler.ok(res);
  } catch (error) {
    responseHandler.error(res);
  }
};
