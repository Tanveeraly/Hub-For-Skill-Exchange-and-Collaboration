import fs from "fs/promises";

export const safeDeleteFile = async (filePath) => {
  if (!filePath) return;

  try {
    await fs.access(filePath);
    await fs.unlink(filePath);
  } catch (err) {
    console.warn("File not found or already deleted:", filePath);
  }
};