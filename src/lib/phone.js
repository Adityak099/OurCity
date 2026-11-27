const STAFF_PHONE_EMAIL_PREFIX = "staff-phone-";

export function normalizePhoneNumber(value) {
  if (typeof value !== "string") return null;

  const compact = value.trim().replace(/[\s().-]/g, "");
  if (!/^\+?[1-9]\d{7,14}$/.test(compact)) return null;

  return compact.replace(/^\+/, "");
}

export function staffPhoneInternalEmail(phone) {
  return `${STAFF_PHONE_EMAIL_PREFIX}${phone}`;
}

export function phoneFromStaffInternalEmail(email) {
  if (typeof email !== "string" || !email.startsWith(STAFF_PHONE_EMAIL_PREFIX)) {
    return null;
  }

  return normalizePhoneNumber(email.slice(STAFF_PHONE_EMAIL_PREFIX.length));
}
