import multer from "multer";
import path from "path";
import fs from "fs";
import { apiError } from "../utlis/apiError.js";

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), "uploads", "excel");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log("Saving uploaded file to:", uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `users-${Date.now()}${path.extname(file.originalname)}`;
    console.log("Uploading file as:", uniqueName);
    cb(null, uniqueName);
  },
});

// File filter (Excel only)
const fileFilter = (req, file, cb) => {
  console.log("Received file:", file.originalname, "Type:", file.mimetype);
  
  const allowedTypes = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
  ];

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(
      new apiError(400, "Only Excel files (.xls, .xlsx) are allowed"),
      false
    );
  }

  cb(null, true);
};

// Multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// 🔥 Wrap multer with error handler
const uploadExcel = (req, res, next) => {
  const multerSingle = upload.single("file");
  
  multerSingle(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // Multer-specific errors
      if (err.code === "LIMIT_FILE_SIZE") {
        return next(new apiError(400, "File too large. Max size is 5MB"));
      }
      if (err.code === "LIMIT_UNEXPECTED_FILE") {
        return next(new apiError(400, "Unexpected field. Use 'file' as field name"));
      }
      return next(new apiError(400, `Upload error: ${err.message}`));
    } else if (err) {
      // Custom errors (from fileFilter)
      return next(err);
    }
    
    // Success - proceed to next middleware
    next();
  });
};

export { uploadExcel };