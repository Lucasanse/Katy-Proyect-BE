import { useState } from 'react';
import Home from './Components/home/Home.jsx';
import Wizard from './Components/wizard/Wizard.jsx';
import Header from './Components/layout/Header.jsx';
import Footer from './Components/layout/Footer.jsx';
import AdminApp from './Components/admin/AdminApp.jsx';

function App() {
  const [view, setView] = useState('home');

  // Acceso al panel de administración vía /admin, sin link público
  if (window.location.pathname.startsWith('/admin')) {
    return <AdminApp />;
  }

  return (
    // Agregamos flex y flex-col para manejar el alto de la pantalla y empujar el footer abajo
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      
      {/* Pasamos la función para volver al inicio ('home') */}
      <Header onHomeClick={() => setView('home')} />

      {/* main con flex-grow hace que ocupe todo el espacio sobrante disponible */}
      <main className="flex-grow">
        {view === 'home' ? (
          <Home onStart={() => setView('wizard')} />
        ) : (
          <Wizard onCancel={() => setView('home')} />
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;