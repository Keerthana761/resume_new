"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "sonner";

export function SignInForm() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [submitting, setSubmitting] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const validatePassword = (password: string): string => {
    if (password.length < 8) {
      return "Password must be at least 8 characters long";
    }
    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/[a-z]/.test(password)) {
      return "Password must contain at least one lowercase letter";
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return "Password must contain at least one special character";
    }
    return "";
  };

  return (
    <div className="w-full">
      <form
        className="flex flex-col gap-form-field"
        onSubmit={async (e) => {
          e.preventDefault();

          // Validate password only for sign up
          if (flow === "signUp") {
            const error = validatePassword(password);
            if (error) {
              setPasswordError(error);
              toast.error(error);
              return;
            }
          }

          setPasswordError("");
          setSubmitting(true);
          const formData = new FormData(e.target as HTMLFormElement);
          formData.set("flow", flow);

          try {
            await signIn("password", formData);
          } catch (error: any) {
            // Smart fallback: if sign-in fails, attempt sign-up automatically
            if (flow === "signIn") {
              try {
                formData.set("flow", "signUp");
                await signIn("password", formData);
                toast.success("Account created and signed in successfully.");
              } catch (err: any) {
                const msg = err?.message || "Could not sign in";
                toast.error(msg.includes("Invalid password") ? "Invalid password. Please try again." : "Could not sign in or sign up. Please check your details.");
                setSubmitting(false);
                return;
              }
            } else {
              const msg = error?.message || "Could not sign up";
              toast.error(msg.includes("Invalid password") ? "Invalid password. Please try again." : "Could not sign up, did you mean to sign in?");
              setSubmitting(false);
              return;
            }
          }
          setSubmitting(false);
        }}
      >
        <input
          className="auth-input-field"
          type="email"
          name="email"
          placeholder="Email"
          required
        />
        <input
          className="auth-input-field"
          type="password"
          name="password"
          placeholder="Password"
          required
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (flow === "signUp") {
              const error = validatePassword(e.target.value);
              setPasswordError(error);
            }
          }}
        />
        {flow === "signUp" && passwordError && (
          <div className="text-red-500 text-sm mt-1">{passwordError}</div>
        )}
        {flow === "signUp" && password && !passwordError && (
          <div className="text-green-500 text-sm mt-1">✓ Password meets requirements</div>
        )}
        {flow === "signUp" && (
          <div className="text-gray-500 text-xs mt-2">
            Password must be at least 8 characters with uppercase, lowercase, and special character
          </div>
        )}
        <button className="auth-button" type="submit" disabled={submitting}>
          {flow === "signIn" ? "Login" : "Register"}
        </button>
        <div className="text-center text-sm text-secondary">
          <span>
            {flow === "signIn"
              ? "Don't have an account? "
              : "Already have an account? "}
          </span>
          <button
            type="button"
            className="text-primary hover:text-primary-hover hover:underline font-medium cursor-pointer"
            onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
          >
            {flow === "signIn" ? "Register instead" : "Login instead"}
          </button>
        </div>
      </form>
      <div className="flex items-center justify-center my-3">
        <hr className="my-4 grow border-gray-200" />
        <span className="mx-4 text-secondary">or</span>
        <hr className="my-4 grow border-gray-200" />
      </div>
      <button className="auth-button" onClick={() => void signIn("google")}>
        Login with Google
      </button>
    </div>
  );
}
