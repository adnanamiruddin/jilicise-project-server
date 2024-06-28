import express from "express";
import usersRoute from "./users.route.js";
import roomsRoute from "./rooms.route.js";
import handPosesRoute from "./handPoses.route.js";

const router = express.Router();

router.use("/users", usersRoute);
router.use("/rooms", roomsRoute);
router.use("/hand-poses", handPosesRoute);

export default router;
