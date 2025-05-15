import { FaGoogle } from "react-icons/fa";

import { signIn } from "@/auth";

export const SignInButton = () => {
  return (
    <form
      action={async () => {
        "use server";
        await signIn("google");
      }}
    >
      <button
        type="submit"
        className="cursor-pointer text-neutral-300 gap-2 shadow-xs flex items-center bg-neutral-900 hover:bg-neutral-800/50 transition-colors duration-100 backdrop-blur-sm p-2 rounded-md border border-neutral-800"
      >
        <FaGoogle size={24}></FaGoogle>
        <span className="font-semibold">Sign in with Google</span>
      </button>
    </form>
  );
};
