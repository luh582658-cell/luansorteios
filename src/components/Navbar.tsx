import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Trophy, User, LogOut, LayoutDashboard, ShieldAlert, ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { auth, logOut } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Logo from './Logo';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isHome = location.pathname === '/';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists() && userDoc.data().role === 'admin') {
          setIsAdmin(true);
        } else if (currentUser.email === 'luh5826@gmail.com') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <nav className="glass-card sticky top-0 z-[100] rounded-none border-t-0 border-l-0 border-r-0 border-b border-[#333]/50 bg-[#0a0a0a]/90 backdrop-blur-2xl">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        {/* Left Section: Back Button (if needed) */}
        <div className="flex items-center w-1/4">
          {!isHome && (
            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all border border-white/5"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
        </div>
        
        {/* Center Section: Logo and Rifas Link */}
        <div className="flex items-center justify-center gap-8 w-2/4">
          <Link to="/" className="flex items-center gap-3 group">
            <Logo className="h-10 w-auto" />
          </Link>
          <Link to="/" className="hidden md:flex items-center gap-2 text-sm font-black text-primary hover:text-white transition-all uppercase tracking-widest">
            <Trophy className="w-4 h-4" />
            Rifas
          </Link>
        </div>
        
        {/* Right Section: User Actions */}
        <div className="flex items-center justify-end gap-2 sm:gap-4 w-1/4">
          {user ? (
            <>
              {isAdmin && (
                <Link to="/admin" className="flex items-center gap-2 text-sm font-bold text-purple-400 hover:text-purple-300 transition-colors px-3 py-2 rounded-lg hover:bg-purple-500/10">
                  <ShieldAlert className="w-4 h-4" />
                  <span className="hidden lg:inline">Admin</span>
                </Link>
              )}
              <Link to="/profile" className="flex items-center gap-2 text-sm font-bold text-gray-300 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/5 group">
                <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 group-hover:border-primary/50 transition-all">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-white/5 flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
                <span className="hidden lg:inline">Perfil</span>
              </Link>
              <button onClick={logOut} className="flex items-center gap-2 text-sm font-bold text-red-400 hover:text-red-300 transition-colors px-3 py-2 rounded-lg hover:bg-red-500/10">
                <LogOut className="w-4 h-4" />
                <span className="hidden lg:inline">Sair</span>
              </button>
            </>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
