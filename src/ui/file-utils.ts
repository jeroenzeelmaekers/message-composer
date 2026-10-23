export const MAX_FILES = 10;
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

export function getFileKey(file: File) {
  return JSON.stringify([file.name, file.size, file.lastModified]);
}

export function mergeFiles(currentFiles: File[], incomingFiles: readonly File[]) {
  const files = [...currentFiles];
  const existingKeys = new Set(files.map(getFileKey));
  let rejectedCount = 0;

  for (const file of incomingFiles) {
    const key = getFileKey(file);
    if (existingKeys.has(key)) continue;
    if (file.size > MAX_FILE_SIZE || files.length >= MAX_FILES) {
      rejectedCount += 1;
      continue;
    }
    existingKeys.add(key);
    files.push(file);
  }

  return { files, rejectedCount };
}
