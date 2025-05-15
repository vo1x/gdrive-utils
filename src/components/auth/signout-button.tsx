import { LogOut } from "lucide-react";

import { signOut } from "@/auth";

export const SignOutButton = () => {
  return (
    <form
      action={async () => {
        "use server";
        await signOut();
      }}
      className="flex items-center text-neutral-400 hover:text-neutral-100"
    >
      <button type="submit" className=" cursor-pointer">
        <LogOut />
      </button>
    </form>
  );
};
