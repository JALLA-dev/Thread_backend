import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create your Thread account",
};

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 p-4">
      <div className="flex flex-col items-center gap-8">
        {/* Logo / Brand */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg">
            <span className="text-xl font-bold text-white">T</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Thread
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Smart scheduling for modern teams
          </p>
        </div>

        {/* Clerk SignUp Component */}
        <SignUp />
      </div>
    </main>
  );
}
