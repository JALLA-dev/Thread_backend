import Image from "next/image";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const { userId } = await auth();
  if (userId) {
    redirect("/dashboard");
  }
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <header className="absolute top-0 w-full flex justify-end p-4 gap-4">
        <SignInButton mode="modal">
          <button className="px-4 py-2 font-medium text-sm text-foreground bg-background border border-input rounded-md hover:bg-accent hover:text-accent-foreground">
            Sign In
          </button>
        </SignInButton>
        <SignUpButton mode="modal">
          <button className="px-4 py-2 font-medium text-sm text-primary-foreground bg-primary rounded-md hover:bg-primary/90">
            Sign Up
          </button>
        </SignUpButton>
      </header>
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-center py-32 px-16 bg-white dark:bg-black">
        <h1 className="text-4xl font-bold tracking-tight text-center mb-6">
          Welcome to Thread
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400 text-center max-w-xl">
          The smart scheduling and meeting management application for modern teams.
        </p>
      </main>
    </div>
  );
}
