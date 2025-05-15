"use client";

import { LucideIcon } from 'lucide-react';
import { useState } from 'react';

export const Tag: React.FC<{ icon?: LucideIcon; tag: string | null }> = ({
  icon: Icon,
  tag,
}) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };

  if (!tag) return null;

  return (
    <span
      className={`bg-neutral-800 gap-2 border  p-1 px-2 rounded-2xl text-xs flex items-center w-max ${
        copied && "text-green-400 border-green-400"
      } ${
        !copied &&
        "hover:text-blue-400 hover:border-blue-400 border-neutral-700 text-neutral-300"
      } cursor-pointer transition-colors duration-150`}
      onClick={() => copyToClipboard(tag)}
    >
      {Icon && <Icon size={18}></Icon>}
      <span>{tag}</span>
    </span>
  );
};
