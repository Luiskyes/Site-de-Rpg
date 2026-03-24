import { skillLabels } from "./constants";

export async function safeJson(response) {
  try {
    const text = await response.text();

    if (!text || !text.trim()) {
      return null;
    }

    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function formatKey(key) {
  return skillLabels[key] || key;
}

export function formatModifier(value) {
  if (!value) return "0";
  return value > 0 ? `+${value}` : String(value);
}

export function getStaminaFillStyle(percent) {
  if (percent > 60) return "linear-gradient(90deg, #16a34a, #4ade80)";
  if (percent > 30) return "linear-gradient(90deg, #ca8a04, #facc15)";
  if (percent > 10) return "linear-gradient(90deg, #ea580c, #fb923c)";
  return "linear-gradient(90deg, #b91c1c, #ef4444)";
}

export function sumValues(obj) {
  return Object.values(obj || {}).reduce(
    (acc, value) => acc + Number(value || 0),
    0
  );
}