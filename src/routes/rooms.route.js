import express from "express";
import { body } from "express-validator";
import requsetHandler from "../handlers/request.handler.js";
import tokenMiddleware from "../middlewares/token.middleware.js";
import * as roomsController from "../controllers/rooms.controller.js";

const router = express.Router();

router.post(
  "/join",
  [body("code").notEmpty().withMessage("Kode pertandingan harus diisi")],
  requsetHandler.validate,
  tokenMiddleware.auth,
  roomsController.joinRoom
);

router.get("/user-rooms", tokenMiddleware.auth, roomsController.getUserRooms);

router.put("/start/:roomId", tokenMiddleware.auth, roomsController.startRoom);

router.put(
  "/increase-score/:roomId",
  tokenMiddleware.auth,
  roomsController.increaseScore
);

router.post(
  "/",
  [
    body("name").notEmpty().withMessage("Judul pertandingan harus diisi"),
    body("description")
      .notEmpty()
      .withMessage("Deskripsi pertandingan harus diisi"),
  ],
  requsetHandler.validate,
  tokenMiddleware.auth,
  roomsController.createRoom
);

router.get("/:roomId", tokenMiddleware.auth, roomsController.getRoomById);

router.put(
  "/:roomId",
  [
    body("name").notEmpty().withMessage("Judul pertandingan harus diisi"),
    body("description")
      .notEmpty()
      .withMessage("Deskripsi pertandingan harus diisi"),
    body("status")
      .notEmpty()
      .withMessage("Status harus diisi")
      .isIn(["pending", "finished"])
      .withMessage("Status tidak valid"),
  ],
  requsetHandler.validate,
  tokenMiddleware.auth,
  roomsController.updateRoom
);

export default router;
