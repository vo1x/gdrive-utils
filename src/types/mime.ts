export type MimeData = {
  id: string | null;
  type: "file" | "folder";
  mimeType: string;
  name: string;
  size: number;
  webContentLink: string | null;
  files: MimeData[] | null;
  subFolders: any | null;
};
