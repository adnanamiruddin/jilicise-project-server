import express from "express";
import { body } from "express-validator";
import requsetHandler from "../handlers/request.handler.js";
import tokenMiddleware from "../middlewares/token.middleware.js";
import * as handPosesController from "../controllers/handPoses.controller.js";

const router = express.Router();

router.get(
  "/",
  tokenMiddleware.auth,
  handPosesController.getAllHandPosesGroupByType
);

router.put(
  "/:roomId",
  [
    body("typeOfHandPoseId")
      .notEmpty()
      .withMessage("Tipe pose tangan harus diisi"),
    body("duration")
      .notEmpty()
      .withMessage("Durasi untuk pose tangan harus diisi"),
  ],
  requsetHandler.validate,
  tokenMiddleware.auth,
  handPosesController.setHandPose
);

router.delete(
  "/:roomId",
  [
    body("typeOfHandPoseId")
      .notEmpty()
      .withMessage("Tipe pose tangan harus diisi"),
  ],
  requsetHandler.validate,
  tokenMiddleware.auth,
  handPosesController.deleteHandPoseFromRoom
);

router.get(
  "/:roomId",
  tokenMiddleware.auth,
  handPosesController.getHandPosesByRoomId
);

export default router;
