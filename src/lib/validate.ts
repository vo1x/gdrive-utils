export const isGDriveId: (id: string) => boolean = (id: string) => {
  return /^(tp:|sa:|mtp:)?(?:[a-zA-Z0-9-_]{33}|[a-zA-Z0-9_-]{19})$|^gdl$|^(tp:|mtp:)?root$/.test(
    id
  );
};

export const isGdriveUrl: (url: string) => boolean = (url: string) => {
  return (
    url.includes("drive.google.com") ||
    url.includes("drive.usercontent.google.com")
  );
};

