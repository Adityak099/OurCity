import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { findUserById } from "./complaints-store";
import { phoneFromStaffInternalEmail } from "../phone";

const scrypt = promisify(scryptCallback);
export const authCookie = { name: "ourcity_session", maxAge: 60 * 60 * 24 * 7 };

function sessionSecret() {
  const value = process.env.AUTH_SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("Configure AUTH_SESSION_SECRET with at least 32 characters.");
  return value;
}

export async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derived = await scrypt(password, salt, 64);
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

export async function verifyPassword(password, storedHash) {
  if (typeof storedHash !== "string") return false;
  const [algorithm, salt, hash] = storedHash.split("$");
  if (algorithm !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = await scrypt(password, salt, expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function createSessionToken(user) {
  const payload = Buffer.from(JSON.stringify({ id: String(user._id || user.id), exp: Date.now() + authCookie.maxAge * 1000 })).toString("base64url");
  const signature = createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function verifySessionToken(token) {
  if (!token || typeof token !== "string") return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  let expected;
  try { expected = createHmac("sha256", sessionSecret()).update(payload).digest(); } catch { return null; }
  let received;
  try { received = Buffer.from(signature, "base64url"); } catch { return null; }
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (typeof parsed.id !== "string" || parsed.exp < Date.now()) return null;
    return parsed.id;
  } catch { return null; }
}

export async function getSession() {
  const jar = await cookies();
  const id = verifySessionToken(jar.get(authCookie.name)?.value);
  if (!id) return null;
  const user = await findUserById(id);
  if (!user || !user.isActive) return null;
  const phone = user.phone || phoneFromStaffInternalEmail(user.email);
  return {
    id: String(user._id),
    name: user.name,
    ...(phone ? { phone } : { email: user.email }),
    role: user.role,
    vehicleNumber: user.vehicleNumber || "",
    assignedWard: user.assignedWard || "",
  };
}

export async function requireRole(role) {
  const user = await getSession();
  return user?.role === role ? user : null;
}
