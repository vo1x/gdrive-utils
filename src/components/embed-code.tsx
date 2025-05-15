"use client";

import { ClipboardCopy } from "lucide-react";
import { ChangeEvent, useState } from "react";

import { getEpisodeNumber, getHumanReadableFileSize } from "@/lib/parser";
import { useMimeStore } from "@/stores/mimeStore";

import { Checkbox } from "./ui/checkbox";

import type { MimeData } from "@/types/mime";

export const EmbedCode: React.FC<{ codeType: "movie" | "series" }> = ({
  codeType,
}) => {
  const mime = useMimeStore((state) => state.mime);
  const [copied, setCopied] = useState(false);

  const [isChecked, setIsChecked] = useState(false);

  const [startEp, setStartEp] = useState<number | null>(null);

  if (!mime.files || !mime) return null;

  const handleToggle = () => {
    setIsChecked((prev) => !prev);
  };

  const videoMimeTypes = [
    "video/mp4",
    "video/x-msvideo",
    "video/quicktime",
    "video/x-ms-wmv",
    "video/x-flv",
    "video/x-matroska",
    "video/webm",
    "video/mpeg",
    "video/mp2t",
    "video/3gpp",
    "video/3gpp2",
    "video/ogg",
    "application/vnd.rn-realmedia",
  ];

  const archiveMimeTypes = [
    "application/zip",
    "application/x-rar-compressed",
    "application/x-7z-compressed",
    "application/gzip",
    "application/x-tar",
    "application/x-bzip2",
    "application/x-xz",
    "application/x-iso9660-image",
    "application/vnd.android.package-archive",
  ];

  const validFiles = mime.files
    .filter((file: MimeData) => videoMimeTypes.includes(file.mimeType))
    .sort((a, b) => a.name.localeCompare(b.name));

  const episodeStrings = validFiles.map(
    (file: MimeData, index: number) =>
      `[maxbutton ${
        archiveMimeTypes.some((ext) => ext === file.mimeType)
          ? `id="3"`
          : `id="2" ${
              startEp
                ? `text="Episode ${index + startEp}"`
                : `text="Episode ${getEpisodeNumber(file.name)}"`
            }`
      } url="${file.webContentLink}" ]`
  );

  const movieStrings = validFiles
    .sort((a, b) => b.size - a.size)
    .map(
      (file, index) =>
        `${
          index === 0
            ? '<p style="text-align: center;">[mks_separator style="solid" height="5"]</p>\n'
            : ""
        }` +
        `<p style="text-align: center;"><strong><span style="color: #000000;">${file.name.replace(
          ".mkv",
          ""
        )}</span>` +
        `\n<span style="color: #000000;">[</span><span style="color: #ff0000;">${getHumanReadableFileSize(
          file.size
        )}</span><span style="color: #000000;">]</span></strong></p>` +
        `\n<p style="text-align: center;">[maxbutton id="1" url="${file.webContentLink}" ]</p>` +
        `\n${
          index === validFiles.length - 1
            ? '<p style="text-align: center;">[mks_separator style="solid" height="5"]</p>'
            : '<p style="text-align: center;">[mks_separator style="solid" height="2"]</p>'
        }`
    );

  const seriesString =
    (isChecked
      ? `<p style="text-align: center;">[mks_separator style="solid" height="5"]</p>` +
        `\n<p style="text-align: center;"><span style="color: #000000;"><strong>${validFiles[0].name
          .slice(0, -4)
          .replace(
            /(S\d+)\s*E\d+/,
            "$1"
          )}\n[<span style="color: #ff0000;">${getHumanReadableFileSize(
          validFiles.reduce((acc, file) => acc + Number(file.size), 0) /
            validFiles.length
        )}/<span style="color: #0000ff;">E</span></span>]</strong></span></p>\n`
      : "") +
    `<p style="text-align: center;">${episodeStrings.join(" ")}</p>` +
    (isChecked
      ? `\n<p style="text-align: center;">[mks_separator style="solid" height="5"]</p>\n`
      : "");

  const EMBED_STRING =
    codeType === "series" ? seriesString : movieStrings.join("");

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(EMBED_STRING);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-4 w-96 h-max rounded-lg bg-neutral-900 p-4 shadow-lg ">
      <span className="text-neutral-400 capitalize">{codeType} Code</span>

      {codeType === "series" && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox checked={isChecked} onCheckedChange={handleToggle} />
            <label
              htmlFor="terms"
              className=" leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Title
            </label>
          </div>

          <div className="flex flex-col gap-1 ">
            <input
              type="number"
              min={1}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setStartEp(
                  parseInt(e.target.value) ? parseInt(e.target.value) : null
                )
              }
              placeholder="Start numbering from"
              className="bg-neutral-800 border outline-none border-neutral-700 rounded-md placeholder:text-neutral-500 p-1"
            />
          </div>
        </div>
      )}
      <pre className="bg-neutral-800 max-h-32 p-4 text-sm text-neutral-300 rounded-md overflow-y-auto whitespace-pre-wrap">
        {EMBED_STRING}
      </pre>
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-neutral-700 hover:bg-neutral-600 text-neutral-200 rounded-md transition-colors duration-200"
        >
          {copied ? (
            <>
              <ClipboardCopy className="h-4 w-4" />
              Copied!
            </>
          ) : (
            <>
              <ClipboardCopy className="h-4 w-4" />
              Copy
            </>
          )}
        </button>
      </div>
    </div>
  );
};
