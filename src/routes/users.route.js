import express from "express";
import { body } from "express-validator";
import requsetHandler from "../handlers/request.handler.js";
import tokenMiddleware from "../middlewares/token.middleware.js";
import * as usersController from "../controllers/users.controller.js";

const router = express.Router();

router.post(
  "/sign-up",
  [
    body("userUID").notEmpty().withMessage("User UID dibutuhkan"),
    body("firstName").notEmpty().withMessage("Nama depan harus diisi"),
    body("lastName").notEmpty().withMessage("Nama belakang harus diisi"),
  ],
  requsetHandler.validate,
  usersController.signUp
);

router.post(
  "/sign-in",
  [body("userUID").notEmpty().withMessage("User UID dibutuhkan")],
  requsetHandler.validate,
  usersController.signIn
);

router.get("/profile", tokenMiddleware.auth, usersController.getProfile);

router.put(
  "/profile",
  [
    body("firstName").notEmpty().withMessage("Nama depan harus diisi"),
    body("lastName").notEmpty().withMessage("Nama belakang harus diisi"),
    body("age")
      .notEmpty()
      .withMessage("Umur harus diisi")
      .isInt()
      .withMessage("Umur harus berupa angka"),
    body("city").notEmpty().withMessage("Kota harus diisi"),
  ],
  requsetHandler.validate,
  tokenMiddleware.auth,
  usersController.updateProfile
);

export default router;
