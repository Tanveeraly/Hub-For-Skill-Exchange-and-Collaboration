import fs from "fs/promises";
import path from "path";

async function moveUploadedFile({ file, email, subFolder }) {
  if (!file?.path) return null;

  // Absolute folders
  const baseFolder = path.join(process.cwd(), "certificate", email);
  const finalFolder = path.join(baseFolder, subFolder);

  await fs.mkdir(finalFolder, { recursive: true });

  // Unique filename
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}-${file.originalname}`;
  const absolutePath = path.join(finalFolder, uniqueName);

  // Move file
  await fs.rename(file.path, absolutePath);

  // Return relative path for DB
  const relativePath = path.relative(process.cwd(), absolutePath);
  return relativePath;
}

export { moveUploadedFile };