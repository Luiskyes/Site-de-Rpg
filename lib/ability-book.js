import { CLASS_BOOK } from "./class-book";

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function findClassKey(className) {
  const normalizedInput = normalizeText(className);

  if (!normalizedInput) return null;

  const exactKey = Object.keys(CLASS_BOOK).find(
    (key) => normalizeText(key) === normalizedInput
  );

  return exactKey || null;
}

export function getAbilitiesByClass(className) {
  const classKey = findClassKey(className);

  if (!classKey) return [];

  return Array.isArray(CLASS_BOOK[classKey]?.abilities)
    ? CLASS_BOOK[classKey].abilities
    : [];
}

export function isAbilityFromClass(className, ability) {
  const normalizedAbility = String(ability || "").trim();

  return getAbilitiesByClass(className).includes(normalizedAbility);
}

export const ABILITY_BOOK_BY_CLASS = Object.fromEntries(
  Object.keys(CLASS_BOOK).map((className) => [
    className,
    getAbilitiesByClass(className),
  ])
);

export const ABILITY_BOOK_OPTIONS = Object.values(ABILITY_BOOK_BY_CLASS)
  .flat()
  .filter((value, index, array) => array.indexOf(value) === index)
  .sort((a, b) => a.localeCompare(b, "pt-BR"));