import crypto from "node:crypto";

/*
|   Place to create hash functions
*/

export function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}
