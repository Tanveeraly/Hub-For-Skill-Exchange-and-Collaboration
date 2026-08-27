// src/middlewares/certificate/certupload.middleware.js
import multer from "multer";
import fs from "fs";
import path from "path";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const email = req.body.Email;
    if (!email) return cb(new Error("Email is required"));

    // Temp folder in project root
    const tempFolder = path.join(process.cwd(), "certificate", email, "temp");
    fs.mkdirSync(tempFolder, { recursive: true });

    cb(null, tempFolder);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, uniqueName);
  },
});

const certupload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

export default certupload;
