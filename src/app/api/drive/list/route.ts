import { auth } from "@/auth";
import { NextResponse, NextRequest } from "next/server";

import { getFileInfo, getFolderContentsWithSubfolders } from "@/lib/drive";

export const GET = async (request: NextRequest) => {
  const session = await auth();

  const { searchParams } = new URL(request.url);

  const mimeId = searchParams.get("mimeId");

  if (!session)
    return NextResponse.json({ message: "Not authorized" }, { status: 403 });
  if (!mimeId)
    return NextResponse.json(
      { message: "File or Folder ID is required" },
      { status: 404 }
    );

  const fileMetadata = await getFileInfo(session?.user, mimeId);

  if (!fileMetadata)
    return NextResponse.json(
      { message: "Unable to fetch info!" },
      { status: 404 }
    );

  if (fileMetadata.mimeType === "application/vnd.google-apps.folder") {
    const { files, subfolders } = await getFolderContentsWithSubfolders(
      session?.user,
      fileMetadata.id
    );

    const folderMetadata = {
      ...fileMetadata,
      files: files,
      subFolders: subfolders.map((subfolder) => ({
        id: subfolder.id,
        name: subfolder.name,
        webContentLink:
          subfolder.webContentLink ||
          `https://drive.google.com/drive/folders/${subfolder.id}`,
        mimeType: "folder",
      })),
      webContentLink: null,
      size: null,
    };

    return NextResponse.json(folderMetadata, { status: 200 });
  }

  return NextResponse.json(
    {
      ...fileMetadata,
      files: [fileMetadata],
    },
    { status: 200 }
  );
};
