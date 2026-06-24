"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle error responses
        if (response.status === 429) {
          setError(
            `Too many login attempts. Please try again in ${data.retryAfter} seconds.`
          );
        } else if (response.status === 401) {
          setError("Invalid password");
        } else {
          setError(data.error || "Login failed");
        }
        setIsLoading(false);
        return;
      }

      // Success - redirect to admin
      router.push(data.redirectTo || "/admin");
    } catch (err) {
      console.error("Login error:", err);
      setError("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-6 bg-[#0F0F0F]">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-[#bec2ff]">
            StatusBoard
          </h1>
          <p className="text-sm text-[#6A737D] mt-2">Admin Panel</p>
        </div>

        {/* Login Card */}
        <div
          className="rounded-lg p-8 shadow-lg"
          style={{
            backgroundColor: "#171824",
            border: "1px solid #24292E",
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div
                className="rounded px-4 py-3 text-sm"
                style={{
                  backgroundColor: "rgba(225, 29, 72, 0.1)",
                  border: "1px solid rgba(225, 29, 72, 0.2)",
                  color: "#E11D48",
                }}
                role="alert"
              >
                {error}
              </div>
            )}

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block mb-2 text-xs font-semibold uppercase tracking-wider text-[#c6c5d7]"
              >
                Password
              </label>
              <div className="relative">
                <span
                  className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[#c6c5d7]"
                  aria-hidden="true"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                    />
                  </svg>
                </span>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  className="block w-full pl-10 pr-3 py-3 rounded text-[#e5e2e1] bg-[#2a2a2a] border border-[#24292E] focus:border-[#606AF0] focus:outline-none focus:ring-1 focus:ring-[#606AF0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  autoComplete="current-password"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading || !password}
                className="w-full py-3 px-4 font-semibold rounded text-white bg-[#606AF0] hover:bg-[#5059d0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex justify-center items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Logging in...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                      />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer Note (optional) */}
        <p className="text-center text-xs text-[#6A737D] mt-6">
          Single-owner authentication. No registration required.
        </p>
      </div>
    </div>
  );
}
