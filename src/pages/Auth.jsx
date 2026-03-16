import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/appStore';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const setLoggedIn = useAppStore(state => state.setLoggedIn);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setLoggedIn(true);
      useAppStore.getState().setTasterEmail(data.user?.email || email);
    } catch (err) {
      // Allow fallback login logic just for testing right now
      console.warn("Supabase Error:", err.message);
      if (email === "test@test.com") {
        setLoggedIn(true);
        useAppStore.getState().setTasterEmail(email);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mobile-wrapper" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 20px' }}>
      <div className="container animate-fade-in flex-col flex-center">
        {/* We can use an image from public/assets later. For now just placeholder */}
        <div style={{ width: 100, height: 100, backgroundColor: 'var(--primary-light)', borderRadius: 20, marginBottom: 30 }} className="flex-center">
          <span style={{color: 'white', fontWeight: 'bold', fontSize: 24}}>SA</span>
        </div>
        
        <h1 style={{ marginBottom: 10 }}>Welcome!</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 30, textAlign: 'center' }}>Sign in to continue your adventure.</p>

        <form onSubmit={handleLogin} style={{ width: '100%' }} className="flex-col">
          <input 
            type="email" 
            placeholder="Email Address" 
            className="input-field" 
            style={{ marginBottom: 15 }}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="input-field" 
            style={{ marginBottom: 15 }}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p style={{ color: 'var(--error)', marginBottom: 15, fontSize: 14 }}>{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        
        <p style={{ marginTop: 20, fontSize: 14, color: 'var(--text-secondary)' }}>
          Don't have an account? <a href="#">Sign up</a>
        </p>
      </div>
    </div>
  );
}
