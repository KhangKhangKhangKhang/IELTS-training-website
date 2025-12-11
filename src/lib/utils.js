import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function getMaxNumberQuestion(questions = []) {
  if (!Array.isArray(questions) || questions.length === 0) return 0;
  try {
    return Math.max(...questions.map((q) => Number(q.numberQuestion || 0)));
  } catch (err) {
    return 0;
  }
}
