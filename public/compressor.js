import fs from "fs";
import zlib from "zlib";
import { pipeline } from "stream/promises";
import { toUpperCaseTransform } from "./file-transform.js";

export async function runPipeline({
  sourcePath,
  destPath,
  compress = true,
  useTransform = false
}) {
  const readStream = fs.createReadStream(sourcePath);
  const writeStream = fs.createWriteStream(destPath);
  const transform = useTransform ? toUpperCaseTransform : null;
  const gzipOrGunzip = compress ? zlib.createGzip() : zlib.createGunzip();

  let totalBytes = 0;

  readStream.on("data", (chunk) => {
   totalBytes += chunk.length;
   process.stdout.write(`📦 Processed: ${(totalBytes / 1024).toFixed(2)} MB\r`);
 });

  try {
    const streams = [readStream];
    if (useTransform) streams.push(transform);
    streams.push(gzipOrGunzip);
    streams.push(writeStream);

    await pipeline(...streams);

    console.log(`\n✅ File ${compress ? "compressed" : "decompressed"} successfully.`);
  } catch (error) {
    console.error("\n❌ Error during pipeline:", error.message);

    // Cleanup
    try {
      if (fs.existsSync(destPath)) {
        fs.unlinkSync(destPath);
        console.log("🧹 Removed corrupted output file.");
      }
    } catch (err) {
      console.error("⚠️ Cleanup failed:", err.message);
    }
  }
}

