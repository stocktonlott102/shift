'use client';

import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="text-center space-y-8 max-w-md w-full">
        {/* App Name */}
        <h1 className="text-6xl md:text-7xl font-bold text-gray-900 dark:text-white tracking-tight">
          Shift
        </h1>

        {/* Subtitle or tagline (optional) */}
        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300">
          Welcome to your journey
        </p>

        {/* Buttons Container */}
        <div className="flex flex-col gap-4 w-full pt-4">
          {/* Sign Up Button */}
          <button
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
            onClick={() => router.push('/signup')}
          >
            Sign Up
          </button>

          {/* Log In Button */}
          <button
            className="w-full bg-white hover:bg-gray-50 text-indigo-600 font-semibold py-4 px-8 rounded-lg border-2 border-indigo-600 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg dark:bg-gray-800 dark:text-indigo-400 dark:border-indigo-400 dark:hover:bg-gray-700"
            onClick={() => router.push('/login')}
          >
            Log In
          </button>
        </div>
      </div>
    </div>
  );
}
