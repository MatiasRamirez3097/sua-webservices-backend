import { Router } from "express";
import usersController from "../controllers/usersController.js";
const { createOne, deleteOne, getAll, getOne, updateOne } = usersController;

const usersRouter = Router();

usersRouter.get(["/", "/:search"], getAll);
usersRouter.post("/create", createOne);
usersRouter.get("/getone/:id", getOne);
usersRouter.put("/update/:id", updateOne);
usersRouter.delete("delete/:id", deleteOne);

export default usersRouter;
