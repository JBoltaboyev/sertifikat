"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Login yoki parol xato!");
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(/file/12.jpg) center/cover no-repeat',
    }}>
      <div className="card glass" style={{
        width: '100%',
        maxWidth: '400px',
        padding: '2.5rem',
        margin: '1rem'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)' }}>Xush kelibsiz</h2>
          <p style={{ color: 'var(--text-muted)' }}>Tizimga kirish uchun ma'lumotlarni kiriting</p>
        </div>
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && <div style={{ color: 'var(--danger)', textAlign: 'center', fontSize: '0.875rem' }}>{error}</div>}
          
          <div className="input-group">
            <label className="label">Login</label>
            <input 
              type="text" 
              className="input" 
              placeholder="admin yoki dekan1" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required 
            />
          </div>
          <div className="input-group">
            <label className="label">Parol</label>
            <input 
              type="password" 
              className="input" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem', width: '100%' }} disabled={loading}>
            {loading ? "Kirilmoqda..." : "Tizimga Kirish"}
          </button>
        </form>
      </div>
    </div>
  );
}
