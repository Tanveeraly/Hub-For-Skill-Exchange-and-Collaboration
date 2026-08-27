import { Router } from "express";
import { verifyjwt } from "../middlewares/authmiddleware.js";
import { checkTermsAcceptance, acceptTerms } from "../controllers/terms.controller.js";

const router = Router();

router.use(verifyjwt);

router.route("/check").get(checkTermsAcceptance);
router.route("/accept").post(acceptTerms);

export default router;
