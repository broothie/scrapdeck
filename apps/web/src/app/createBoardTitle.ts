import { adjectives, animals, colors, uniqueNamesGenerator } from "unique-names-generator";

export function createRandomBoardTitle() {
  return uniqueNamesGenerator({
    dictionaries: [adjectives, colors, animals],
    separator: " ",
    style: "capital",
  });
}
