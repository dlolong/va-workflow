import { DateTime } from "luxon";
export function formatTime(value: string | null | undefined, zone: string) {
  if (!value) return "No deadline";
  const date = DateTime.fromISO(value, { zone: "utc" }).setZone(zone);
  return date.isValid ? date.toFormat("MMM d, yyyy · h:mm a ZZZZ") : "Invalid date";
}
export function localInput(value: string | null | undefined, zone: string) {
  return value ? DateTime.fromISO(value).setZone(zone).toFormat("yyyy-MM-dd'T'HH:mm") : "";
}
export function inputToUtc(value: string, zone: string) {
  if (!value) return null;
  const date = DateTime.fromISO(value, { zone });
  if (!date.isValid || date.toFormat("yyyy-MM-dd'T'HH:mm") !== value.slice(0, 16))
    throw new Error(
      "This local time does not exist in the selected timezone. Choose another time.",
    );
  // An explicit choice is safer than silently choosing a repeated DST hour.
  if (date.getPossibleOffsets().length > 1)
    throw new Error(
      "This local time occurs twice during a clock change. Choose a non-ambiguous time.",
    );
  return date.toUTC().toISO();
}
