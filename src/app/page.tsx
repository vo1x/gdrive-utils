import { Navbar } from "@/components/navbar";
import { FileList } from "@/components/file-list";
import { EmbedCode } from "@/components/embed-code";
import Link from "next/link";

import { auth } from "@/auth";

export default async function GamesFiler() {
  const session = await auth();

  return (
    <div className="h-screen flex flex-col items-center gap-6">
      <Navbar />
      {!session?.user && (
        <div className="text-white flex h-full text-3xl items-center justify-center">
          Log In to use the site.
        </div>
      )}

      <div className="text-white flex h-full text-3xl items-center justify-center">
        <Link href="/renamer" className="no-underline">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-colors duration-300 flex items-center gap-2">
            Google Drive File Renamer
          </button>
        </Link>
      </div>
    </div>
  );
}
