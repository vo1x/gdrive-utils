import { auth } from "@/auth";

import { SignInButton, SignOutButton } from "./auth";
import { Header } from "./header";
import { Searchbar } from "./search-bar";

export const Navbar = async () => {
  const session = await auth();
  return (
    <div className="border-b w-screen p-8 px-4 bg-slate-950/50 h-14 flex items-center  border-slate-800 backdrop-blur-sm shadow-sm">
      <nav className="flex items-center justify-between w-full">
        <Header />

        {/* {session?.user && <Searchbar></Searchbar>} */}

        {!session?.user && <SignInButton />}

        {session?.user && (
          <div className="flex items-center gap-2  text-sm font-semibold  rounded-md">
            <img
              src={session?.user.image || ""}
              alt="User avatar"
              className="object-cover w-10 h-10 rounded-md border bg-neutral-900 border-neutral-800 "
            />
            {/* {session?.user.name} */}
            <SignOutButton />
          </div>
        )}
      </nav>
    </div>
  );
};
