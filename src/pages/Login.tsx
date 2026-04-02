import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithGoogle, db } from '../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { ShieldCheck, Chrome, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const user = await signInWithGoogle();
      
      // Check if user exists in Firestore
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          name: user.displayName,
          email: user.email,
          avatar: user.photoURL,
          role: user.email === 'luh5826@gmail.com' ? 'admin' : 'user',
          createdAt: new Date().toISOString()
        });
      }
      
      toast.success('Login realizado com sucesso!');
      navigate('/');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-end sm:items-center justify-center p-0 sm:p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
      </div>

      <AnimatePresence appear>
        <motion.div 
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-full max-w-[450px] relative z-10"
        >
          <div className="glass-card p-8 border-t-4 border-t-primary shadow-[0_-20px_50px_rgba(0,0,0,0.5)] sm:shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-t-[32px] sm:rounded-[32px]">
            <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8 sm:hidden" />
            
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20 shadow-inner">
                <ShieldCheck className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-black text-white uppercase tracking-tighter mb-2 leading-none">Acesse sua Conta</h1>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Escolha uma opção segura para entrar</p>
            </div>

            <div className="space-y-4">
              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white text-black hover:bg-gray-100 py-4 px-6 rounded-2xl font-black text-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group shadow-xl"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    <Chrome className="w-5 h-5" />
                    <span className="uppercase tracking-widest">Entrar com Google</span>
                  </>
                )}
              </button>

              <button
                onClick={() => navigate('/')}
                className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-white py-2 transition-colors text-[10px] font-black uppercase tracking-[0.2em]"
              >
                <ArrowLeft className="w-3 h-3" /> Voltar para o Início
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 text-center">
              <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest leading-relaxed">
                Ao entrar, você concorda com nossos <br />
                <span className="text-primary/60">Termos de Uso</span> e <span className="text-primary/60">Privacidade</span>
              </p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
