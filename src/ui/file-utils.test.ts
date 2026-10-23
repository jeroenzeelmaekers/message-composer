import { describe, expect, it } from "vitest";
import { MAX_FILES, MAX_FILE_SIZE, getFileKey, mergeFiles } from "./file-utils";

function createFile(name: string, content = "message", lastModified = 1) {
  return new File([content], name, { lastModified });
}

describe("mergeFiles", () => {
  it("adds files and skips duplicates", () => {
    const first = createFile("notes.txt");
    const duplicate = createFile("notes.txt");
    const next = createFile("agenda.txt");

    expect(mergeFiles([first], [duplicate, next])).toEqual({
      files: [first, next],
      rejectedCount: 0,
    });
  });

  it("rejects files larger than the configured size", () => {
    const oversized = new File([new Uint8Array(MAX_FILE_SIZE + 1)], "large.bin");
    const accepted = createFile("small.txt");

    expect(mergeFiles([], [oversized, accepted])).toEqual({
      files: [accepted],
      rejectedCount: 1,
    });
  });

  it("does not exceed the attachment limit", () => {
    const existing = Array.from({ length: MAX_FILES }, (_, index) => createFile(`${index}.txt`));

    expect(mergeFiles(existing, [createFile("extra.txt")])).toEqual({
      files: existing,
      rejectedCount: 1,
    });
  });
});

describe("getFileKey", () => {
  it("distinguishes files with the same name but different metadata", () => {
    expect(getFileKey(createFile("report.txt", "first"))).not.toBe(
      getFileKey(createFile("report.txt", "a different file")),
    );
  });
});
