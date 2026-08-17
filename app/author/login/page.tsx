"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthorLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true); setError("");
    const response = await fetch("/api/author/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) { setError(body.error || "Unable to sign in."); setLoading(false); return; }
    router.replace("/author"); router.refresh();
  }

  return <main className="author-auth-page"><div className="author-auth-card"><div className="eyebrow">Private workspace</div><h1>Author Studio</h1><p>Sign in to write, validate, preview, and publish to the Gulshan Kumar technical publication.</p><form className="author-form" onSubmit={submit}><label>Username<input autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required /></label><label>Password<input autoComplete="current-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="btn btn-primary" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button></form><p className="author-auth-note">This route is private and is not linked from the public site.</p></div></main>;
}
