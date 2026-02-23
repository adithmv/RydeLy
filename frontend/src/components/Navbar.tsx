import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { isLoggedIn, isAdmin, isDriver, name, logout } = useApp();
  const navigate  = useNavigate();
  const location  = useLocation();
  const isLanding = location.pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setMenuOpen(false), 0);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  const navBg = scrolled || !isLanding
    ? 'bg-[rgba(253,250,244,0.88)] backdrop-blur-[20px] border-b border-[#E8DDD0] shadow-sm'
    : 'bg-transparent';

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navBg} ${scrolled ? 'py-3' : 'py-5'}`}>
        <div className="max-w-[1100px] mx-auto px-5 flex items-center justify-between">

          <Link to="/" className="flex items-center gap-2">
  <img 
    src="/src/assets/logo.png" 
    alt="RydeLy" 
    className="h-9 w-9 object-contain"
  />
  
</Link>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-8">
            {isLanding && !isLoggedIn && (
              <>
                <a href="#how-it-works" className="font-body text-sm font-medium text-black/70 hover:text-orange transition-colors">How it Works</a>
                <a href="#safety"       className="font-body text-sm font-medium text-black/70 hover:text-orange transition-colors">Safety</a>
                <a href="#for-drivers"  className="font-body text-sm font-medium text-black/70 hover:text-orange transition-colors">For Drivers</a>
              </>
            )}
            {isLoggedIn && !isDriver && !isAdmin && (
              <>
                <Link to="/home"    className="font-body text-sm font-medium text-black/70 hover:text-orange transition-colors">Find Auto</Link>
                <Link to="/history" className="font-body text-sm font-medium text-black/70 hover:text-orange transition-colors">Call History</Link>
              </>
            )}
            {isDriver && (
              <Link to="/driver/portal" className="font-body text-sm font-medium text-black/70 hover:text-orange transition-colors">My Portal</Link>
            )}
            {isAdmin && (
              <Link to="/admin" className="font-body text-sm font-medium text-black/70 hover:text-orange transition-colors">Admin</Link>
            )}
            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                {name && <span className="font-body text-sm text-muted">Hi, {name.split(' ')[0]}</span>}
                <button onClick={handleLogout} className="btn-pill bg-[#0F0E0C] text-[#FDFAF4] text-sm">Logout</button>
              </div>
            ) : (
              <button onClick={() => navigate('/login')} className="btn-pill bg-[#0F0E0C] text-[#FDFAF4] text-sm">Login →</button>
            )}
          </div>

          <button className="md:hidden p-2" onClick={() => setMenuOpen(true)}>
            <Menu size={22} />
          </button>
        </div>
      </nav>

      {/* Full-screen mobile overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-[200] bg-[#FDFAF4] flex flex-col items-center justify-center gap-8">
          <button className="absolute top-5 right-5 p-2" onClick={() => setMenuOpen(false)}>
            <X size={26} />
          </button>
          {isLanding && !isLoggedIn && (
            <>
              <a href="#how-it-works" onClick={() => setMenuOpen(false)} className="font-heading text-3xl font-bold hover:text-orange transition-colors">How it Works</a>
              <a href="#safety"       onClick={() => setMenuOpen(false)} className="font-heading text-3xl font-bold hover:text-orange transition-colors">Safety</a>
              <a href="#for-drivers"  onClick={() => setMenuOpen(false)} className="font-heading text-3xl font-bold hover:text-orange transition-colors">For Drivers</a>
            </>
          )}
          {isLoggedIn && !isDriver && !isAdmin && (
            <>
              <Link to="/home"    className="font-heading text-3xl font-bold hover:text-orange transition-colors">Find Auto</Link>
              <Link to="/history" className="font-heading text-3xl font-bold hover:text-orange transition-colors">Call History</Link>
            </>
          )}
          {isDriver && <Link to="/driver/portal" className="font-heading text-3xl font-bold hover:text-orange transition-colors">My Portal</Link>}
          {isAdmin   && <Link to="/admin"         className="font-heading text-3xl font-bold hover:text-orange transition-colors">Admin</Link>}
          {isLoggedIn ? (
            <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="btn-pill bg-[#0F0E0C] text-[#FDFAF4] text-lg mt-4">Logout</button>
          ) : (
            <button onClick={() => { navigate('/login'); setMenuOpen(false); }} className="btn-pill bg-orange text-white text-lg mt-4">Login →</button>
          )}
        </div>
      )}
    </>
  );
}