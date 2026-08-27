import express from "express";
import { verifyjwt } from "../middlewares/authmiddleware.js";
import { sentMessage, getMessages, getConversations } from "../controllers/message.controller.js";
const router = express.Router();

router.post("/send",verifyjwt,sentMessage);
router.get("/conversations", verifyjwt, getConversations);
router.get("/between/:user1/:user2",verifyjwt,getMessages);


export {
    router as MessageRoutes
}




