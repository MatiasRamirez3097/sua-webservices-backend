import { Router } from "express";
import usersController from "../controllers/usersController.js";
const { createOne, softDeleteOne, getAll, getOne, updateOne } = usersController;

const usersRouter = Router();

usersRouter.get("/", getAll);
usersRouter.get("/search/:search", getAll);
usersRouter.post("/create", createOne);
usersRouter.get("/getone/:id", getOne);
usersRouter.put("/update/:id", updateOne);
usersRouter.put("/softdelete/:id", softDeleteOne);

export default usersRouter;
