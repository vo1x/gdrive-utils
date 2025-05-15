"use client";

import { useMimeStore } from "@/stores/mimeStore";

export const MimeMeta = () => {
  const mime = useMimeStore((state) => state.mime);

  return (
    <div className="bg-neutral-900 w-full max-w-96 max-h-96 h-max overflow-y-auto flex flex-col justify-between gap-4 rounded-lg p-4">
      {Object.keys(mime)
        .filter((key) => key !== "files")
        .map((label: string, index: number) => (
          <MetaField
            key={index}
            label={label}
            value={mime[label as keyof typeof mime]?.toString() || null}
          />
        ))}
    </div>
  );
};

const MetaField = ({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) => {
  if (!value) return;
  return (
    <div className="uppercase text-neutral-400 flex flex-col gap-1">
      <label>{label}</label>
      <div className="p-2 bg-neutral-800 justify-between rounded-lg h-10 flex text-neutral-300 items-center gap-2">
        <input
          value={value}
          disabled={true}
          type="text"
          className="bg-inherit w-full"
        ></input>
        {/* <span>
          <ClipboardCopy className="text-neutral-500 hover:text-neutral-300 cursor-pointer transition-colors duration-200 ease-in-out" />
        </span> */}
      </div>
    </div>
  );
};
