import { Router } from "express";
import { verifyjwt } from "../middlewares/authmiddleware.js";
import { upload } from "../middlewares/multermiddleware.js";
import { uploadOncloudinary } from "../utlis/cloudinary.js";
import { ApiResponse } from "../utlis/apiRespone.js";
import { apiError } from "../utlis/apiError.js";

const router = Router();

router.use(verifyjwt);

router.post("/upload", upload.single("file"), async (req, res, next) => {
    try {
        if (!req.file) {
            return next(new apiError(400, "No file uploaded"));
        }

        const response = await uploadOncloudinary(req.file.path);
        if (!response) {
            return next(new apiError(500, "Failed to upload to Cloudinary"));
        }

        return res.status(200).json(new ApiResponse(200, {
            url: response.url,
            name: req.file.originalname,
            type: req.file.mimetype,
            size: req.file.size
        }, "File uploaded successfully"));
    } catch (error) {
        return next(new apiError(500, error.message));
    }
});

export default router;
