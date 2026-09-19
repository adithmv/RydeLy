import { lazy, Suspense, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "@/context/app-state";
import { DEMO_MODE } from "@/lib/api";
const RealLogin = lazy(() => import("./RealLoginPage"));
export default function LoginPage() {
  const { login, loginAsAdmin } = useApp();
  const navigate = useNavigate();
  const [role, setRole] = useState("commuter");
  if (!DEMO_MODE)
    return (
      <Suspense fallback={<p className="pt-24">Loading sign in…</p>}>
        <RealLogin />
      </Suspense>
    );
  return (
    <main className="demo-page">
      <section className="demo-card max-w-xl mx-auto">
        <p className="demo-eyebrow">WELCOME TO RYDELY</p>
        <h1>Your town. Your ride.</h1>
        <p>
          Choose your account to get started.
        </p>
        <label className="demo-label">
          Continue as
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="commuter">Commuter</option>
            <option value="driver">Driver</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <button
          className="demo-button"
          onClick={() => {
            if (role === "admin") loginAsAdmin();
            else login(role === "driver");
            navigate(
              role === "admin"
                ? "/admin"
                : role === "driver"
                  ? "/driver/portal"
                  : "/home",
            );
          }}
        >
          Continue →
        </button>
        <p className="text-sm">
          Prototype access · no real bookings or charges.
        </p>
        <Link to="/register" className="text-primary underline">
          Register as a driver
        </Link>
      </section>
    </main>
  );
}
