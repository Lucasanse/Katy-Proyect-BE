import { useEffect, useState } from 'react';
import AdminLogin from './AdminLogin.jsx';
import AdminPanel from './AdminPanel.jsx';
import authService from '../../services/auth.service.js';
import { getToken, setToken } from '../../services/api.js';

export default function AdminApp() {
  const [admin, setAdmin] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    async function checkSession() {
      if (!getToken()) {
        setCheckingSession(false);
        return;
      }
      try {
        const loggedAdmin = await authService.me();
        setAdmin(loggedAdmin);
      } catch {
        setToken(null);
      } finally {
        setCheckingSession(false);
      }
    }
    checkSession();
  }, []);

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500">Cargando...</p>
      </div>
    );
  }

  if (!admin) {
    return <AdminLogin onLoginSuccess={setAdmin} />;
  }

  return <AdminPanel admin={admin} onLogout={() => setAdmin(null)} />;
}
