const WCA_PERSON_ID_REGEX = /^\d{4}[A-Z]{4}\d{2}$/;
const CUBEDEV_ID_REGEX = /^CD\d{2}[A-Z]{3}\d{2}$/;

export const normalizeIdentifier = (identifier: string) =>
  identifier.trim().toUpperCase();

export const isWcaIdentifier = (identifier?: string): identifier is string =>
  !!identifier && WCA_PERSON_ID_REGEX.test(normalizeIdentifier(identifier));

export const isCubeDevIdentifier = (
  identifier?: string,
): identifier is string =>
  !!identifier && CUBEDEV_ID_REGEX.test(normalizeIdentifier(identifier));

export const canOpenWcaProfile = (identifier?: string): identifier is string =>
  isWcaIdentifier(identifier);