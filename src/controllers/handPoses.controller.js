import {
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  HandPosesTable,
  RoomsTable,
  TypeOfHandPosesTable,
} from "../config/config.js";
import responseHandler from "../handlers/response.handler.js";
import Room from "../models/Room.js";
import HandPose from "../models/HandPose.js";

export const getAllHandPosesGroupByType = async (req, res) => {
  try {
    const typeOfHandPoses = await getDocs(TypeOfHandPosesTable);

    const handPosesType = [];
    for (const typeOfHandPose of typeOfHandPoses.docs) {
      const handPoseDocs = await getDocs(
        query(
          HandPosesTable,
          where("typeOfHandPoseId", "==", typeOfHandPose.id)
        )
      );
      const handPoses = [];
      for (const handPoseDoc of handPoseDocs.docs) {
        handPoses.push(HandPose.toFormattedObject(handPoseDoc));
      }
      // If handPose.name === "Hand Default" then move it to index 1
      const defaultPoseIndex = handPoses.findIndex(
        (handPose) => handPose.name === "Hand Default"
      );
      if (defaultPoseIndex !== -1 && defaultPoseIndex !== 1) {
        const defaultPose = handPoses.splice(defaultPoseIndex, 1)[0];
        handPoses.splice(1, 0, defaultPose);
      }
      handPosesType.push({
        id: typeOfHandPose.id,
        ...typeOfHandPose.data(),
        handPoses,
      });
    }
    handPosesType.sort((a, b) => a.name.localeCompare(b.name));

    responseHandler.ok(res, handPosesType);
  } catch (error) {
    responseHandler.error(res);
  }
};

export const setHandPose = async (req, res) => {
  try {
    const { id } = req.user;
    const { roomId } = req.params;
    const { typeOfHandPoseId, duration } = req.body;

    const roomRef = doc(RoomsTable, roomId);
    const roomDoc = await getDoc(roomRef);
    if (!roomDoc.exists())
      return responseHandler.notFound(res, "Pertandingan tidak ditemukan");

    const room = Room.toFormattedObject(roomDoc);
    if (room.status !== "pending")
      return responseHandler.badRequest(
        res,
        "Pertandingan tidak sedang dalam masa tunggu"
      );
    if (room.roomMasterId !== id) return responseHandler.forbidden(res);

    // Parse duration to integer
    const durationInt = parseInt(duration);

    const uniqueIdentifier = +new Date();
    const newTypeOfHandPoseId = [
      ...room.typeOfHandPoseId,
      {
        typeOfHandPoseId: `${typeOfHandPoseId}-${uniqueIdentifier}`,
        duration: durationInt,
      },
    ];
    await updateDoc(roomRef, {
      typeOfHandPoseId: newTypeOfHandPoseId,
    });

    responseHandler.ok(res);
  } catch (error) {
    responseHandler.error(res);
  }
};

export const deleteHandPoseFromRoom = async (req, res) => {
  try {
    const { id } = req.user;
    const { roomId } = req.params;
    const { typeOfHandPoseId } = req.body;

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

    const newTypeOfHandPoseId = room.typeOfHandPoseId.filter(
      (handPoseId) => handPoseId.typeOfHandPoseId !== typeOfHandPoseId
    );
    await updateDoc(roomRef, {
      typeOfHandPoseId: newTypeOfHandPoseId,
    });

    responseHandler.ok(res);
  } catch (error) {
    responseHandler.error(res);
  }
};

export const getHandPosesByRoomId = async (req, res) => {
  try {
    const { roomId } = req.params;

    const roomDoc = await getDoc(doc(RoomsTable, roomId));
    if (!roomDoc.exists())
      return responseHandler.notFound(res, "Pertandingan tidak ditemukan");

    const room = Room.toFormattedObject(roomDoc);

    const handPosesType = [];
    for (const handPoseId of room.typeOfHandPoseId) {
      const typeOfHandPoseDoc = await getDoc(
        doc(TypeOfHandPosesTable, handPoseId.typeOfHandPoseId.split("-")[0])
      );
      const handPoseDoc = await getDocs(
        query(
          HandPosesTable,
          where(
            "typeOfHandPoseId",
            "==",
            handPoseId.typeOfHandPoseId.split("-")[0]
          )
        )
      );
      const handPoses = [];
      for (const doc of handPoseDoc.docs) {
        handPoses.push(HandPose.toFormattedObject(doc));
      }
      // If handPose.name === "Hand Default" then move it to index 1
      const defaultPoseIndex = handPoses.findIndex(
        (handPose) => handPose.name === "Hand Default"
      );
      if (defaultPoseIndex !== -1 && defaultPoseIndex !== 1) {
        const defaultPose = handPoses.splice(defaultPoseIndex, 1)[0];
        handPoses.splice(1, 0, defaultPose);
        // Then duplicate the default pose, put it on last index
        handPoses.push(defaultPose);
      }
      handPosesType.push({
        id: handPoseId.typeOfHandPoseId,
        ...typeOfHandPoseDoc.data(),
        duration: handPoseId.duration,
        handPoses,
      });
    }

    responseHandler.ok(res, handPosesType);
  } catch (error) {
    responseHandler.error(res);
  }
};
