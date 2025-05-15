"use client";

import { LucideIcon } from 'lucide-react';
import { useState } from 'react';

export const CopyButton: React.FC<{
  icon?: LucideIcon;
  item: string;
  content: string;
}> = ({ item, content, icon: Icon }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };

  return (
    <button
      className={`flex items-center gap-1 ${
        !copied &&
        "hover:text-blue-400 hover:border-blue-400 border-neutral-700"
      } cursor-pointer w-max border   bg-neutral-800 p-2 rounded-md ${
        copied && "text-green-400 border-green-400"
      } transition-colors duration-150`}
      onClick={() => copyToClipboard(content || "")}
    >
      {Icon && <Icon size={20} />}
      <span title={content || ""}>{item}</span>
    </button>
  );
};
