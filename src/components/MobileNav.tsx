import { Link, useLocation } from 'react-router-dom';
import { Home, Trophy, User, LayoutDashboard, Bell } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';

export default function MobileNav() {
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      where('read', '==', false)
    );

    const unsubscribeNotifications = onSnapshot(q, (snapshot) => {
      setUnreadCount(snapshot.size);
    });

    return () => unsubscribeNotifications();
  }, [user]);

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-[#0a0a0a]/90 backdrop-blur-2xl border-t border-white/5 px-6 py-3">
      <div className="flex items-center justify-between">
        <Link to="/" className={`flex flex-col items-center gap-1 transition-all ${isActive('/') ? 'text-primary' : 'text-gray-500'}`}>
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-black uppercase tracking-widest">Início</span>
        </Link>

        <Link to="/winners" className={`flex flex-col items-center gap-1 transition-all ${isActive('/winners') ? 'text-primary' : 'text-gray-500'}`}>
          <Trophy className="w-5 h-5" />
          <span className="text-[10px] font-black uppercase tracking-widest">Ganhadores</span>
        </Link>

        <Link to="/dashboard" className={`flex flex-col items-center gap-1 transition-all ${isActive('/dashboard') ? 'text-primary' : 'text-gray-500'} relative`}>
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-black uppercase tracking-widest">Minhas Cotas</span>
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[8px] font-black text-white animate-bounce">
              {unreadCount}
            </div>
          )}
        </Link>

        <Link to={user ? "/profile" : "/login"} className={`flex flex-col items-center gap-1 transition-all ${isActive('/profile') || isActive('/login') ? 'text-primary' : 'text-gray-500'}`}>
          <User className="w-5 h-5" />
          <span className="text-[10px] font-black uppercase tracking-widest">{user ? 'Perfil' : 'Entrar'}</span>
        </Link>
      </div>
    </div>
  );
}
