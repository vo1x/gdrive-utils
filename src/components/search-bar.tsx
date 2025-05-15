"use client";

import { Loader2, Search, X } from "lucide-react";
import { ChangeEvent, KeyboardEvent, useState } from "react";
import { toast } from "sonner";

import { extractId } from "@/lib/parser";
import { isGdriveUrl } from "@/lib/validate";
import { useMimeStore } from "@/stores/mimeStore";

export const Searchbar = () => {
  const updateMimeData = useMimeStore((state) => state.updateMimeStore);
  const resetMimeStore = useMimeStore((state) => state.resetMimeStore);

  const [inputValue, setInputValue] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState<boolean | null>(null);

  const handleOnSearch = async () => {
    if (!inputValue || inputValue === "")
      return toast.warning("Please provide a drive url");

    if (!isGdriveUrl(inputValue)) return toast.error("Invalid Drive URL or ID");

    const mimeId = extractId(inputValue);

    if (!mimeId) return toast.error("Unable to extract ID");

    try {
      setIsExtracting(true);
      const res = await fetch(`/api/drive/list?mimeId=${mimeId}`);
      const data = await res.json();

      if (!data) {
        setIsExtracting(false);
        return toast.error("DRIVE API ERROR");
      }

      updateMimeData({
        id: mimeId,
        type: inputValue.includes("/folders/") ? "folder" : "file",
        ...data,
      });

      setIsExtracting(false);
    } catch (error: any) {
      setIsExtracting(false);
      console.error(error.message);
    }
  };

  return (
    <div className="flex flex-col gap-2 border w-max border-slate-800 rounded-md">
      <div
        className={`flex items-center text-neutral-400 px-2 gap-1 h-max rounded-lg bg-slate-900 w-[32rem]`}
      >
        <button onClick={handleOnSearch}>
          {isExtracting ? <Loader2 className="animate-spin" /> : <Search />}
        </button>
        <input
          value={inputValue ?? ""}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setInputValue(event.target.value)
          }
          type="text"
          className={`bg-inherit p-2 rounded-lg w-full border-none outline-none placeholder:text-neutral-400 text-neutral-100`}
          placeholder="Enter a Drive URL"
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") {
              handleOnSearch();
            }
          }}
        />

        {inputValue && (
          <button className="border border-neutral-800 rounded-md bg-neutral-800 hover:text-red-500">
            <X
              onClick={() => {
                setInputValue(null);
                resetMimeStore();
              }}
            />
          </button>
        )}
      </div>
    </div>
  );
};
