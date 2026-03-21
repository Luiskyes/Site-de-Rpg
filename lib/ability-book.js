// lib/ability-book.js

import { CLASS_BOOK } from "./class-book";

export function getAbilitiesByClass(className) {
  return CLASS_BOOK[String(className || "").trim()]?.abilities ?? [];
}

export function isAbilityFromClass(className, ability) {
  return getAbilitiesByClass(className).includes(String(ability || "").trim());
}

export const ABILITY_BOOK_BY_CLASS = Object.fromEntries(
  Object.entries(CLASS_BOOK).map(([className, data]) => [
    className,
    Array.isArray(data?.abilities) ? data.abilities : [],
  ])
);

export const ABILITY_BOOK_OPTIONS = Object.values(ABILITY_BOOK_BY_CLASS)
  .flat()
  .filter((value, index, array) => array.indexOf(value) === index)
  .sort((a, b) => a.localeCompare(b, "pt-BR"));