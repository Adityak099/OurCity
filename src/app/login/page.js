"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

import {
  Leaf,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  UserRound,
  ShieldCheck,
  Truck,
  LockKeyhole,
} from "lucide-react";

import { useAuth } from "../../../components/auth/AuthProvider";

const demoAccounts = [
  {
    role: "Citizen",
    email: "citizen@cleancity.demo",
    password: "citizen123",
    icon: UserRound,
  },
  {
    role: "Admin",
    email: "admin@cleancity.demo",
    password: "admin123",
    icon: ShieldCheck,
  },
  {
    role: "Driver",
    email: "driver@cleancity.demo",
    password: "driver123",
    icon: Truck,
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { login, user, ready } = useAuth();

  const [email, setEmail] = useState("");
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

  const handleSubmit = (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    const result = login(email, password);

    if (!result.success) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push(result.redirect);
  };

  const fillDemoAccount = (account) => {
    setEmail(account.email);
    setPassword(account.password);
    setError("");
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
    <main className="login-page">
      <div className="login-decoration" />

      <div className="login-container">
        <Link href="/" className="login-back">
          <ArrowLeft size={17} />
          Back to CleanCity
        </Link>

        <div className="login-card">
          <div className="login-brand">
            <Image
              src="/hero/OurCity-Mark.png"
              alt="OurCity"
              width={50}
              height={50}
              className="login-logo"
            />

            <h1>
              Clean<span>City</span>
            </h1>
          </div>

          <div className="login-heading">
            <span className="eyebrow">
              <LockKeyhole size={13} />
              Welcome back
            </span>

            <h2>Sign in to CleanCity</h2>

            <p>Access your account and help build a cleaner neighbourhood.</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email address</label>

              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>

              <div className="password-wrapper">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="login-error" role="alert">
                {error}
              </div>
            )}

            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
              <ArrowRight size={18} />
            </button>
          </form>

          <div className="demo-section">
            <div className="demo-divider">
              <span>DEMO ACCOUNTS</span>
            </div>

            <p className="demo-description">
              Select an account to automatically fill its credentials.
            </p>

            <div className="demo-accounts">
              {demoAccounts.map((account) => {
                const Icon = account.icon;

                return (
                  <button
                    type="button"
                    className="demo-account"
                    key={account.role}
                    onClick={() => fillDemoAccount(account)}
                  >
                    <Icon size={19} />
                    <span>{account.role}</span>
                    <ArrowRight size={15} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <p className="login-footer">
          Smarter Waste. Cleaner Streets. Greener Cities.
        </p>
      </div>
    </main>
  );
}
