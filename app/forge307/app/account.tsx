import { useEffect, useState } from "react";
import { api, setToken, User } from "./api";
import "./App.css";

type Status = { type: "ok" | "err"; msg: string } | null;

export default function App() {
  const [status, setStatus] = useState<Status>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  // Register
  const [rEmail, setREmail] = useState("");
  const [rUsername, setRUsername] = useState("");
  const [rPassword, setRPassword] = useState("");
  const [rBio, setRBio] = useState("");

  // Login
  const [lEmail, setLEmail] = useState("");
  const [lPassword, setLPassword] = useState("");

  // Profile
  const [pUsername, setPUsername] = useState("");
  const [pBio, setPBio] = useState("");

  // Password change
  const [cCurrent, setCCurrent] = useState("");
  const [cNew, setCNew] = useState("");

  async function refreshMe() {
    setLoading(true);
    setStatus(null);
    try {
      const me = await api.me();
      setUser(me);
      setPUsername(me.username ?? "");
      setPBio(me.bio ?? "");
    } catch (e: any) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function doRegister() {
    setLoading(true);
    setStatus(null);
    try {
      const created = await api.register({
        email: rEmail,
        username: rUsername,
        password: rPassword,
        bio: rBio || "",
      });
      setStatus({ type: "ok", msg: `Registered user ${created.username}. Now log in.` });
      setREmail(""); setRUsername(""); setRPassword(""); setRBio("");
    } catch (e: any) {
      setStatus({ type: "err", msg: e.message });
    } finally {
      setLoading(false);
    }
  }

  async function doLogin() {
    setLoading(true);
    setStatus(null);
    try {
      const tok = await api.login({ email: lEmail, password: lPassword });
      setToken(tok.access_token);
      setStatus({ type: "ok", msg: "Logged in." });
      await refreshMe();
    } catch (e: any) {
      setStatus({ type: "err", msg: e.message });
    } finally {
      setLoading(false);
    }
  }

  function doLogout() {
    setToken(null);
    setUser(null);
    setStatus({ type: "ok", msg: "Logged out." });
  }

  async function doUpdateProfile() {
    setLoading(true);
    setStatus(null);
    try {
      const updated = await api.updateMe({
        username: pUsername || undefined,
        bio: pBio ?? "",
      });
      setUser(updated);
      setStatus({ type: "ok", msg: "Profile updated." });
    } catch (e: any) {
      setStatus({ type: "err", msg: e.message });
    } finally {
      setLoading(false);
    }
  }

  async function doChangePassword() {
    setLoading(true);
    setStatus(null);
    try {
      await api.changePassword({ current_password: cCurrent, new_password: cNew });
      setCCurrent(""); setCNew("");
      setStatus({ type: "ok", msg: "Password changed." });
    } catch (e: any) {
      setStatus({ type: "err", msg: e.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <h1>Account UI (TypeScript)</h1>
      <p className="muted">Connects to FastAPI endpoints that call your Python account logic.</p>

      {status && (
        <div className={`status ${status.type}`}>
          {status.msg}
        </div>
      )}

      <div className="grid">
        <section className="card">
          <h2>Register</h2>
          <label>Email</label>
          <input value={rEmail} onChange={(e) => setREmail(e.target.value)} placeholder="you@example.com" />
          <label>Username</label>
          <input value={rUsername} onChange={(e) => setRUsername(e.target.value)} placeholder="username_123" />
          <label>Password</label>
          <input value={rPassword} onChange={(e) => setRPassword(e.target.value)} type="password" placeholder="8+ chars" />
          <label>Bio</label>
          <textarea value={rBio} onChange={(e) => setRBio(e.target.value)} placeholder="optional" />
          <button disabled={loading} onClick={doRegister}>Register</button>
        </section>

        <section className="card">
          <h2>Login</h2>
          <label>Email</label>
          <input value={lEmail} onChange={(e) => setLEmail(e.target.value)} placeholder="you@example.com" />
          <label>Password</label>
          <input value={lPassword} onChange={(e) => setLPassword(e.target.value)} type="password" />
          <button disabled={loading} onClick={doLogin}>Login</button>

          <div style={{ height: 12 }} />
          <h3>Session</h3>
          <div className="row">
            <button disabled={loading} onClick={refreshMe}>Refresh /me</button>
            <button disabled={loading} onClick={doLogout}>Logout</button>
          </div>

          <div className="muted" style={{ marginTop: 10 }}>
            {user ? `Logged in as ${user.username} (${user.email})` : "Not logged in."}
          </div>
        </section>

        <section className="card">
          <h2>Update Profile</h2>
          <label>Username</label>
          <input value={pUsername} onChange={(e) => setPUsername(e.target.value)} placeholder="new username" />
          <label>Bio</label>
          <textarea value={pBio} onChange={(e) => setPBio(e.target.value)} placeholder="bio (<=280 chars)" />
          <button disabled={loading || !user} onClick={doUpdateProfile}>Save</button>
          {!user && <p className="muted">Log in to edit your profile.</p>}
        </section>

        <section className="card">
          <h2>Change Password</h2>
          <label>Current password</label>
          <input value={cCurrent} onChange={(e) => setCCurrent(e.target.value)} type="password" />
          <label>New password</label>
          <input value={cNew} onChange={(e) => setCNew(e.target.value)} type="password" />
          <button disabled={loading || !user} onClick={doChangePassword}>Change</button>
          {!user && <p className="muted">Log in to change your password.</p>}
        </section>
      </div>
    </div>
  );
}
