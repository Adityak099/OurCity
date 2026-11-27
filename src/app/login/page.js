"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Leaf,
  LockKeyhole,
} from "lucide-react";

import { useAuth } from "@/components/auth/AuthProvider";

export default function LoginPage() {
  const router = useRouter();
  const { login, register, user, ready } = useAuth();

  const [mode, setMode] = useState(() => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("mode") === "register" ? "register" : "login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect already authenticated users
  useEffect(() => {
    if (!ready || !user) return;

    const routes = {
      citizen: "/citizen/dashboard",
      admin: "/admin/dashboard",
      driver: "/driver/dashboard",
    };

    router.replace(routes[user.role] || "/login");
  }, [ready, user, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    const result = mode === "register" ? await register(name, email, password) : await login(loginIdentifier, password);

    if (!result.success) {
      setError(result.error);
      setLoading(false);
      return;
    }

    const requestedNext = new URLSearchParams(window.location.search).get("next");
    const allowedPaths = ["/citizen/dashboard", "/admin/dashboard", "/driver/dashboard"];
    router.push(allowedPaths.includes(requestedNext) && (requestedNext === result.redirect || result.user.role === "citizen") ? requestedNext : result.redirect);
  };

  if (!ready || user) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner" />
        <p>Preparing your account...</p>
      </div>
    );
  }

  return (
    <main id="main-content" className="login-page">
      <div className="login-container">
        <section className="login-visual" aria-label="OurCity community">
          <div className="login-visual-content">
            <Link href="/" className="login-visual-brand">
              <span className="login-visual-logo">
                <Leaf size={22} aria-hidden="true" />
              </span>
              <span>OurCity</span>
            </Link>
            <div className="login-illustration-wrap">
              <svg
                className="login-illustration"
                viewBox="0 0 560 390"
                role="img"
                aria-labelledby="login-illustration-title"
              >
                <title id="login-illustration-title">
                  A neighbourhood map showing a reported spot and a cleaner
                  community
                </title>
                <rect className="illustration-card" x="30" y="24" width="500" height="340" rx="28" />
                <circle className="illustration-halo" cx="411" cy="111" r="67" />
                <path className="illustration-road" d="M56 272c70-13 100 19 157 6s92-68 153-43 92 12 147-25" />
                <path className="illustration-route" d="M56 272c70-13 100 19 157 6s92-68 153-43 92 12 147-25" />

                <path className="illustration-building" d="M80 137h90v120H80z" />
                <path className="illustration-building-roof" d="m70 139 55-43 55 43z" />
                <path className="illustration-window" d="M97 158h20v24H97zm37 0h20v24h-20zm-37 43h20v24H97zm37 0h20v24h-20z" />

                <path className="illustration-building illustration-building-alt" d="M192 171h74v87h-74z" />
                <path className="illustration-building-roof illustration-building-roof-alt" d="m182 173 47-37 47 37z" />
                <path className="illustration-window" d="M208 188h16v20h-16zm30 0h16v20h-16z" />

                <path className="illustration-tree-trunk" d="M340 197h10v45h-10z" />
                <circle className="illustration-tree" cx="345" cy="181" r="30" />
                <circle className="illustration-tree-highlight" cx="325" cy="190" r="18" />
                <circle className="illustration-tree-highlight" cx="362" cy="190" r="18" />

                <path className="illustration-tree-trunk" d="M454 230h9v35h-9z" />
                <circle className="illustration-tree" cx="458" cy="217" r="24" />
                <circle className="illustration-tree-highlight" cx="443" cy="223" r="14" />

                <circle className="illustration-map-dot" cx="116" cy="270" r="9" />
                <circle className="illustration-map-dot" cx="267" cy="278" r="9" />
                <circle className="illustration-map-dot" cx="366" cy="235" r="9" />
                <g className="illustration-pin" transform="translate(397 108)">
                  <path d="M37 0C16.6 0 0 16.6 0 37c0 29 37 66 37 66s37-37 37-66C74 16.6 57.4 0 37 0Z" />
                  <circle className="illustration-pin-center" cx="37" cy="37" r="21" />
                  <path className="illustration-pin-check" d="m27 37 7 7 14-16" />
                </g>

                <g className="illustration-label" transform="translate(56 54)">
                  <rect width="151" height="48" rx="14" />
                  <circle className="illustration-label-icon" cx="24" cy="24" r="12" />
                  <path className="illustration-label-check" d="m19 24 4 4 7-8" />
                  <text x="46" y="29">Spot reported</text>
                </g>

                <g className="illustration-status" transform="translate(343 292)">
                  <rect width="148" height="43" rx="13" />
                  <circle className="illustration-status-dot" cx="21" cy="21.5" r="6" />
                  <text x="37" y="26">Ready for action</text>
                </g>
              </svg>
            </div>
            <div className="login-visual-message">
              <span className="login-visual-kicker">
                <Leaf size={16} aria-hidden="true" />
                Cleaner streets start together
              </span>
              <h2>Small actions. A brighter, cleaner tomorrow.</h2>
              <p>
                Connect with your community, report what needs attention, and
                follow every cleanup along the way.
              </p>
              <div className="login-visual-proof">
                <CheckCircle2 size={18} aria-hidden="true" />
                <span>Local action, visible progress</span>
              </div>
            </div>
          </div>
        </section>

        <section className="login-form-panel" aria-label="Account access">
          <Link href="/" className="login-back">
            <ArrowLeft size={17} aria-hidden="true" />
            Back to OurCity
          </Link>

          <div className="login-card">
            <div className="login-brand">
              <span className="login-brand-mark">
                <Leaf size={20} aria-hidden="true" />
              </span>
              <span className="login-brand-name">
                Our<span>City</span>
              </span>
            </div>

            <div className="login-heading">
              <span className="eyebrow">
                <LockKeyhole size={13} aria-hidden="true" />
                {mode === "register" ? "Join the community" : "Welcome back"}
              </span>

              <h1>{mode === "register" ? "Create your account" : "Sign in to OurCity"}</h1>

              <p>
                {mode === "register"
                  ? "Create a citizen account to track your reports and stay connected."
                  : "Access your account and help build a cleaner neighbourhood."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              {mode === "register" && (
                <div className="form-group">
                  <label htmlFor="name">Full name</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    minLength={2}
                    maxLength={100}
                    required
                  />
                </div>
              )}
              <div className="form-group">
                <label htmlFor={mode === "register" ? "email" : "identifier"}>
                  {mode === "register" ? "Email address" : "Email or phone number"}
                </label>
                <input
                  id={mode === "register" ? "email" : "identifier"}
                  name={mode === "register" ? "email" : "identifier"}
                  type={mode === "register" ? "email" : "text"}
                  autoComplete={mode === "register" ? "email" : "username"}
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder={mode === "register" ? "you@example.com" : "Email or phone number"}
                  value={mode === "register" ? email : loginIdentifier}
                  onChange={(event) =>
                    mode === "register"
                      ? setEmail(event.target.value)
                      : setLoginIdentifier(event.target.value)
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="password-wrapper">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={mode === "register" ? "new-password" : "current-password"}
                    minLength={mode === "register" ? 10 : undefined}
                    maxLength={128}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword((isVisible) => !isVisible)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff size={18} aria-hidden="true" />
                    ) : (
                      <Eye size={18} aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="login-error" role="alert" aria-live="polite">
                  {error}
                </div>
              )}

              <button type="submit" className="login-submit" disabled={loading}>
                {loading
                  ? mode === "register"
                    ? "Creating account…"
                    : "Signing in…"
                  : mode === "register"
                    ? "Create account"
                    : "Sign in"}
                <ArrowRight size={18} aria-hidden="true" />
              </button>
            </form>

            <p className="auth-mode-switch">
              {mode === "register" ? "Already have an account?" : "New to OurCity?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "register" ? "login" : "register");
                  setError("");
                }}
              >
                {mode === "register" ? "Sign in" : "Create a citizen account"}
              </button>
            </p>
            {mode === "login" && (
              <p className="auth-role-note">
                Admin and driver accounts are created by your OurCity administrator.
                New staff accounts sign in with their registered phone number.
              </p>
            )}

            <p className="login-footer">
              Smarter waste. Cleaner streets. Greener cities.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
