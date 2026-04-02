import { useEffect, useState } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion } from 'framer-motion';
import { Trophy, User, Calendar, Ticket } from 'lucide-react';

export default function Winners() {
  const [winners, setWinners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'winners'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setWinners(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="text-center py-8">
        <h1 className="text-3xl md:text-5xl font-black mb-4 text-white tracking-tighter">
          GALERIA DE <span className="text-primary">GANHADORES</span>
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto text-sm md:text-base">
          Conheça os sortudos que já levaram prêmios incríveis no Luan Sorteios.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {winners.map((winner, index) => (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            key={winner.id}
            className="glass-card p-6 flex flex-col items-center text-center relative overflow-hidden"
          >
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl"></div>
            
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-2 border-primary/20 mb-4 relative z-10">
              {winner.userPhoto ? (
                <img src={winner.userPhoto} className="w-full h-full object-cover" alt={winner.userName} />
              ) : (
                <User className="w-12 h-12 text-primary" />
              )}
            </div>

            <div className="space-y-2 relative z-10">
              <h3 className="text-xl font-black text-white uppercase tracking-tighter">{winner.userName}</h3>
              <div className="inline-block px-3 py-1 bg-primary/20 text-primary rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/30">
                Cota Premiada: #{winner.ticketNumber}
              </div>
              
              <div className="pt-4 mt-4 border-t border-white/5 w-full">
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Prêmio</p>
                <p className="text-white font-black text-lg leading-tight">{winner.raffleTitle}</p>
              </div>

              {winner.testimonial && (
                <p className="text-gray-500 text-xs italic mt-4 leading-relaxed">
                  "{winner.testimonial}"
                </p>
              )}

              <div className="flex items-center justify-center gap-4 mt-6 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(winner.createdAt).toLocaleDateString('pt-BR')}
                </div>
                <div className="flex items-center gap-1">
                  <Trophy className="w-3 h-3 text-primary" />
                  Sorteio Oficial
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {winners.length === 0 && (
        <div className="text-center py-20 glass-card">
          <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-400">Ainda não temos ganhadores registrados.</h3>
          <p className="text-gray-500 mt-2">Seja o primeiro a aparecer aqui!</p>
        </div>
      )}
    </div>
  );
}
