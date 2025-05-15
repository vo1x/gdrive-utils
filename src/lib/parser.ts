import { isGDriveId } from "./validate";

export const extractId: (url: string) => string | null = (url) => {
  if (isGDriveId(url)) {
    return url;
  }

  if (url.includes("folders") || url.includes("file")) {
    const re =
      /https:\/\/drive\.google\.com\/(?:drive(.*?)\/folders\/|file(.*?)?\/d\/)([-\w]+)/;
    const match = url.match(re);
    if (match) return match[3];
  }

  try {
    const driveUrl = new URL(url);
    return driveUrl.searchParams.get("id");
  } catch (error) {
    return null;
  }
};

export const getHumanReadableFileSize = (bytes: number) => {
  try {
    const pBytes = bytes;
    const fileSizeUnits = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

    if (pBytes === 0) return "0 B";
    if (isNaN(pBytes) || pBytes < 0) throw new Error("Invalid bytes value");
    const i = Math.floor(Math.log(pBytes) / Math.log(1024));
    const size = (pBytes / Math.pow(1024, i)).toFixed(2);
    return `${size} ${fileSizeUnits[i]}`;
  } catch (error) {
    return `${bytes} B`;
  }
};

export const getEpisodeNumber = (episodeName: string): number | null => {
  if (!episodeName) return null;

  const episodeReg = /S\d{2}E(\d{2})/;
  const match = episodeReg.exec(episodeName);
  const epNum = match ? parseInt(match[1], 10) : null;
  return epNum;
};

export const getSearchTerm = (fileName: string) => {
  const originalSeriesMatch = fileName.match(
    /^(.*?)\s*\((\d{4})\).*?S(\d+)E\d+/i
  );
  if (originalSeriesMatch) {
    const [, title, year, season] = originalSeriesMatch;
    const formattedTitle = title.replace(/\./g, " ").trim();

    return encodeURIComponent(formattedTitle);
  }

  const originalMovieMatch = fileName.match(/^(.*?)\s*\((\d{4})\)/);
  if (originalMovieMatch) {
    const [, title, year] = originalMovieMatch;
    return encodeURIComponent(`${title.trim()}-${year}`);
  }

  const dotSeparatedSeriesMatch = fileName.match(/^(.*?)\.S(\d+)E\d+/i);
  if (dotSeparatedSeriesMatch) {
    const [, title, season] = dotSeparatedSeriesMatch;
    const formattedTitle = title.replace(/\./g, " ").trim();
    return encodeURIComponent(`${formattedTitle}`);
  }

  return encodeURIComponent(fileName.replace(/\./g, "-"));
};
