import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminLoginPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Directly redirect to admin dashboard without any authentication
    navigate("/admin/dashboard", { replace: true });
  }, [navigate]);

  return (
    <main className="live-login">
      <section className="login-story">
        <span className="login-wordmark">
          Ryde<span>Ly.</span>
        </span>
        <div>
          <p className="live-eyebrow">ADMINISTRATION</p>
          <h1>
            Redirecting to Admin Panel...
          </h1>
        </div>
      </section>
      <section className="login-form-panel">
        <div className="login-form-wrap">
          <p className="live-muted">Please wait while we redirect you...</p>
        </div>
      </section>
    </main>
  );
}