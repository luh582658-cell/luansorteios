/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import { useEffect } from 'react';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Trophy } from 'lucide-react';
import Navbar from './components/Navbar';
import MobileNav from './components/MobileNav';
import Home from './pages/Home';
import RaffleDetails from './pages/RaffleDetails';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import Login from './pages/Login';
import About from './pages/About';
import Winners from './pages/Winners';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Guidelines from './pages/Guidelines';
import Profile from './pages/Profile';

export default function App() {
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const q = query(
          collection(db, 'notifications'),
          where('userId', '==', user.uid),
          where('read', '==', false)
        );

        const unsubscribeNotifications = onSnapshot(q, (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const notification = change.doc.data();
              toast.success(notification.title, {
                description: notification.message,
                icon: <Trophy className="w-5 h-5 text-primary" />,
                duration: 10000,
              });
            }
          });
        });

        return () => unsubscribeNotifications();
      }
    });

    return () => unsubscribeAuth();
  }, []);

  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8 pb-24 md:pb-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/guidelines" element={<Guidelines />} />
            <Route path="/raffle/:id" element={<RaffleDetails />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/winners" element={<Winners />} />
          </Routes>
        </main>
        <MobileNav />
        <Toaster theme="dark" position="top-center" />
      </div>
    </Router>
  );
}
