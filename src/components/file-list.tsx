"use client";

import {
  Archive,
  FileVideo,
  Folder,
  HardDrive,
  Hash,
  Link,
  SquareArrowOutUpRight,
  Video,
  Loader2,
} from "lucide-react";

import { ARCHIVE_MIME_TYPES } from "@/constants";
import {
  getEpisodeNumber,
  getHumanReadableFileSize,
  getSearchTerm,
} from "@/lib/parser";
import { useMimeStore } from "@/stores/mimeStore";

import { CopyButton } from "./ui/button";
import { Tag } from "./ui/tag";

import type { MimeData } from "@/types/mime";
import { useState } from "react";
import { toast } from "sonner";

export const FileList: React.FC = () => {
  const mime = useMimeStore((state) => state.mime);

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="rounded-lg p-2 flex flex-col gap-4 overflow-y-auto h-full max-h-[calc(100vh-200px)]">
        {mime.files?.map((file: MimeData) => (
          <File key={file.id} file={file} />
        ))}
        {mime?.subFolders?.map((folder: MimeData) => (
          <File key={folder.id} file={folder} />
        ))}
      </div>
    </div>
  );
};

const File: React.FC<{ file: MimeData }> = ({ file }) => {
  const { name, id, webContentLink, size, mimeType } = file;
  const [isUpdating, setIsUpdating] = useState(false);

  const epNumber = getEpisodeNumber(name) ?? "X";
  const fileSize = getHumanReadableFileSize(size);
  const searchTerm = getSearchTerm(file.name);

  const seriesString = `[maxbutton id="2" text="Episode ${epNumber}" url="${webContentLink}"]`;

  const movieString = `
<p style="text-align: center;">[mks_separator style="solid" height="5"]</p>
<p style="text-align: center;"><strong><span style="color: #000000;">${name.replace(
    ".mkv",
    ""
  )}</span>
<span style="color: #000000;">[</span><span style="color: #ff0000;">${getHumanReadableFileSize(
    size
  )}</span><span style="color: #000000;">]</span></strong></p>
<p style="text-align: center;">[maxbutton id="1" url="${webContentLink}" ]</p>
<p style="text-align: center;">[mks_separator style="solid" height="5"]</p>
`;

  const handleWordPressUpdate = async () => {
    try {
      setIsUpdating(true);
      const response = await fetch("/api/wordpress/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: name,
          webContentLink,
          searchTitle: searchTerm,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update WordPress post");
      }

      toast.success("Successfully updated WordPress post");
    } catch (error) {
      console.error("Error updating WordPress post:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update WordPress post");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-neutral-900 rounded-md border border-neutral-800 p-4 transition-colors duration-200 shadow-md">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex flex-col gap-1 font-semibold text-white w-full">
          <div className="gap-4 flex items-center justify-between">
            <span>{name}</span>
            <div className="flex gap-2">
              <button
                onClick={handleWordPressUpdate}
                disabled={isUpdating}
                className="right-0 pr-4 cursor-pointer text-neutral-400 transition-colors duration-150 hover:text-inherit disabled:opacity-50"
                title="Update WordPress post"
              >
                {isUpdating ? <Loader2 className="animate-spin" /> : <SquareArrowOutUpRight />}
              </button>
              <a
                href={`https://uhdmovies.fyi/search/${searchTerm}`}
                className="right-0 pr-4 cursor-pointer text-neutral-400 transition-colors duration-150 hover:text-inherit"
                target="_blank"
              >
                <SquareArrowOutUpRight />
              </a>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {mimeType === "folder" && <Tag tag={id} icon={HardDrive} />}

            <Tag tag={fileSize} icon={HardDrive} />

            <Tag tag={`Episode ${epNumber}`} icon={Hash} />

            <Tag tag={mimeType} icon={getFileIcon(mimeType)} />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 text-sm text-neutral-400 mt-4 border-t border-neutral-800 pt-2">
        <span className="text-xs">Click corresponding buttons to copy</span>

        <div className="flex gap-4">
          <CopyButton
            item={`Web Link`}
            icon={Link}
            content={webContentLink || ""}
          />

          {mimeType !== "folder" && (
            <>
              <CopyButton
                item={`Episode Code`}
                icon={Hash}
                content={seriesString || ""}
              />

              <CopyButton
                item={`Movie Code`}
                icon={Video}
                content={movieString || ""}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const getFileIcon = (mimeType: string) => {
  if (mimeType === "folder") return Folder;
  if (ARCHIVE_MIME_TYPES.includes(mimeType)) return Archive;
  return FileVideo;
};
