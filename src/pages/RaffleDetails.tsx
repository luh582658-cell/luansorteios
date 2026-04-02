import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, getDocs, collection, query, where, onSnapshot, addDoc, updateDoc, increment, writeBatch, limit } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { toast } from 'sonner';
import { Trophy, CheckCircle, Clock, Copy, QrCode, ShoppingCart, Target, Info, DollarSign, Zap, Users, Plus, Share2, MessageCircle, ShieldAlert, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

export default function RaffleDetails() {
  const { id } = useParams();
  const [showImageModal, setShowImageModal] = useState(false);
  const navigate = useNavigate();
  const [raffle, setRaffle] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(10);
  const [selectedPackage, setSelectedPackage] = useState<number | null>(10);
  const [payment, setPayment] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [wonPrizes, setWonPrizes] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [viewers, setViewers] = useState(Math.floor(Math.random() * 50) + 20);
  const [globalSettings, setGlobalSettings] = useState<any>(null);
  const [winner, setWinner] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    const q = query(collection(db, 'winners'), where('raffleId', '==', id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setWinner(snapshot.docs[0].data());
      }
    });
    return () => unsubscribe();
  }, [id]);

  useEffect(() => {
    const q = query(collection(db, 'settings'), limit(1));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setGlobalSettings(snapshot.docs[0].data());
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (payment) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [payment]);

  useEffect(() => {
    const interval = setInterval(() => {
      setViewers(prev => Math.max(10, prev + (Math.random() > 0.5 ? 2 : -2)));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Mock instant prizes for the UI
  const instantPrizes = [
    { cota: '000001', prize: 'R$ 500,00', winner: 'Luiz F***', date: '01/04/2026' },
    { cota: '000042', prize: 'R$ 500,00', winner: 'Maria S***', date: '01/04/2026' },
    { cota: '000123', prize: 'R$ 500,00', winner: 'João P***', date: '01/04/2026' },
    { cota: '000555', prize: 'R$ 500,00', winner: 'Aguardando...', date: '-' },
    { cota: '000999', prize: 'R$ 500,00', winner: 'Aguardando...', date: '-' },
  ];

  const faqs = [
    { q: "Como participo?", a: "Escolha sua rifa, selecione a quantidade de números e finalize o pagamento via PIX. Seus números são gerados automaticamente." },
    { q: "Como é feito o sorteio?", a: "Todos os nossos sorteios são baseados no resultado da Loteria Federal, garantindo total transparência." },
    { q: "Como recebo o prêmio?", a: "Entramos em contato via WhatsApp ou telefone cadastrado imediatamente após o sorteio." },
    { q: "O site é seguro?", a: "Sim, utilizamos criptografia SSL e processamento de pagamentos via Mercado Pago." }
  ];

  useEffect(() => {
    if (!payment || payment.status === 'approved') {
      setTimeLeft(null);
      return;
    }

    // Set initial time (2 minutes)
    setTimeLeft(120);

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [payment]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!id) return;

    const unsubscribeRaffle = onSnapshot(doc(db, 'raffles', id), (doc) => {
      if (doc.exists()) {
        setRaffle({ id: doc.id, ...doc.data() });
      } else {
        toast.error('Rifa não encontrada');
        navigate('/');
      }
      setLoading(false);
    });

    const q = query(collection(db, 'tickets'), where('raffleId', '==', id));
    const unsubscribeTickets = onSnapshot(q, (snapshot) => {
      const data: any[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTickets(data);
    });

    return () => {
      unsubscribeRaffle();
      unsubscribeTickets();
    };
  }, [id, navigate]);

  useEffect(() => {
    if (!payment || payment.status === 'approved') return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/${payment.id}/status`);
        const data = await res.json();
        
        if (data.status === 'approved') {
          setPayment(prev => ({ ...prev, status: 'approved' }));
          toast.success('Pagamento aprovado! Boa sorte!');
          
          // Confetti effect
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#a3e635', '#ffffff', '#22c55e']
          });
          
          const batch = writeBatch(db);
          const paymentRef = doc(db, 'payments', payment.docId);
          batch.update(paymentRef, { status: 'approved' });
          
          const q = query(collection(db, 'tickets'), where('paymentId', '==', payment.id.toString()));
          const snapshot = await getDocs(q);
          snapshot.forEach(docSnap => {
            batch.update(docSnap.ref, { status: 'paid' });
          });
          
          const raffleRef = doc(db, 'raffles', raffle.id);
          batch.update(raffleRef, { soldTickets: increment(snapshot.size) });
          
          await batch.commit();
          clearInterval(interval);

          // Check for winning tickets
          if (raffle.winningTickets && Array.isArray(raffle.winningTickets)) {
            const newWonPrizes: any[] = [];
            snapshot.forEach(docSnap => {
              const ticketNumber = docSnap.data().number;
              const winningTicket = raffle.winningTickets.find((wt: any) => wt.number === ticketNumber);
              if (winningTicket) {
                newWonPrizes.push(winningTicket);
              }
            });
            if (newWonPrizes.length > 0) {
              setWonPrizes(newWonPrizes);
              
              // Notify User and Admin
              newWonPrizes.forEach(async (prize) => {
                // User Notification
                await addDoc(collection(db, 'notifications'), {
                  userId: auth.currentUser?.uid,
                  title: '🎉 COTA PREMIADA!',
                  message: `Parabéns! Você achou a cota #${prize.number.toString().padStart(4, '0')} e ganhou R$ ${prize.prize.toFixed(2).replace('.', ',')}!`,
                  type: 'winner',
                  read: false,
                  createdAt: new Date().toISOString()
                });

                // Admin Notification
                await addDoc(collection(db, 'notifications'), {
                  isAdmin: true,
                  title: '🚨 COTA PREMIADA ENCONTRADA!',
                  message: `O usuário ${auth.currentUser?.displayName || auth.currentUser?.email} achou a cota #${prize.number.toString().padStart(4, '0')} na rifa "${raffle.title}"! Prêmio: R$ ${prize.prize.toFixed(2).replace('.', ',')}`,
                  type: 'admin_alert',
                  read: false,
                  createdAt: new Date().toISOString()
                });
              });
            }
          }

          // Send confirmation email
          try {
            const ticketNumbers = [];
            snapshot.forEach(docSnap => ticketNumbers.push(docSnap.data().number));
            
            await fetch('/api/send-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: auth.currentUser?.email,
                subject: `Seus números para: ${raffle.title}`,
                raffleName: raffle.title,
                tickets: ticketNumbers
              })
            });
          } catch (e) {
            console.error('Error triggering email:', e);
          }
        }
      } catch (error) {
        console.error('Error polling payment:', error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [payment]);

  const handleCheckout = async () => {
    if (!auth.currentUser) {
      toast.error('Faça login para participar');
      navigate('/login');
      return;
    }

    if (quantity < 1 || quantity > (raffle.totalTickets - raffle.soldTickets)) {
      toast.error('Quantidade inválida');
      return;
    }

    setIsProcessing(true);
    try {
      let amount = quantity * raffle.price;
      
      // Apply discounts based on quantity
      if (quantity === 5) amount = (5 * raffle.price) * 0.8;
      else if (quantity === 10) amount = (10 * raffle.price) * 0.7;
      else if (quantity === 20) amount = (20 * raffle.price) * 0.6;
      else if (quantity >= 50) amount = (quantity * raffle.price) * 0.5; // Extra discount for large quantities

      const paymentId = crypto.randomUUID();

      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          email: auth.currentUser.email,
          description: `Rifa: ${raffle.title} - ${quantity} números`,
          paymentId
        })
      });

      if (!res.ok) throw new Error('Falha ao gerar pagamento');
      const mpData = await res.json();

      const availableNumbers = Array.from({ length: raffle.totalTickets }, (_, i) => i + 1)
        .filter(n => !tickets.some(t => t.number === n));
        
      const selectedNumbers = availableNumbers.sort(() => 0.5 - Math.random()).slice(0, quantity);

      const batch = writeBatch(db);
      
      const paymentRef = doc(collection(db, 'payments'));
      batch.set(paymentRef, {
        userId: auth.currentUser.uid,
        payerName: auth.currentUser.displayName || 'Usuário',
        userName: auth.currentUser.displayName || 'Usuário',
        userEmail: auth.currentUser.email,
        payerPhoto: auth.currentUser.photoURL || null,
        raffleId: raffle.id,
        amount,
        status: 'pending',
        mpPaymentId: mpData.id.toString(),
        ticketNumbers: selectedNumbers,
        createdAt: new Date().toISOString()
      });

      selectedNumbers.forEach(num => {
        const ticketRef = doc(collection(db, 'tickets'));
        batch.set(ticketRef, {
          raffleId: raffle.id,
          number: num,
          userId: auth.currentUser.uid,
          status: 'reserved',
          paymentId: mpData.id.toString(),
          createdAt: new Date().toISOString()
        });
      });

      batch.update(doc(db, 'raffles', raffle.id), {
        totalRevenue: increment(amount),
        status: (raffle.autoExpand && (raffle.totalRevenue || 0) + amount >= raffle.targetRevenue) ? raffle.status : (((raffle.totalRevenue || 0) + amount >= raffle.targetRevenue) ? 'finished' : raffle.status),
        totalTickets: (raffle.autoExpand && (raffle.totalRevenue || 0) + amount >= raffle.targetRevenue) ? (raffle.totalTickets + raffle.extraTicketsPerExpansion) : raffle.totalTickets,
        targetRevenue: (raffle.autoExpand && (raffle.totalRevenue || 0) + amount >= raffle.targetRevenue) ? (raffle.targetRevenue + (raffle.extraTicketsPerExpansion * raffle.price)) : raffle.targetRevenue
      });

      await batch.commit();

      // If autoExpand was triggered, we might need to update winning tickets too
      if (raffle.autoExpand && (raffle.totalRevenue || 0) + amount >= raffle.targetRevenue) {
        // This is a simplified approach, adding more winning tickets
        // In a real app, this might need more complex logic to ensure fairness
        // For now, we just add the extra winning tickets to the raffle document
        await updateDoc(doc(db, 'raffles', raffle.id), {
          winningTickets: [...(raffle.winningTickets || []), ...Array.from({ length: raffle.extraWinningTicketsPerExpansion }, () => Math.floor(Math.random() * (raffle.totalTickets + raffle.extraTicketsPerExpansion)) + 1)]
        });
      }

      // Auto-scale logic
      if (raffle.autoScale) {
        const soldTickets = tickets.length + selectedNumbers.length;
        const totalTickets = raffle.totalTickets;
        if (soldTickets / totalTickets > 0.8) {
          await updateDoc(doc(db, 'raffles', raffle.id), {
            totalTickets: totalTickets + 1000 // Add 1000 more tickets
          });
        }
      }

      setPayment({
        id: mpData.id,
        docId: paymentRef.id,
        qr_code: mpData.qr_code,
        qr_code_base64: mpData.qr_code_base64,
        status: 'pending',
        amount
      });

    } catch (error) {
      console.error(error);
      toast.error('Erro ao processar compra');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyPix = () => {
    if (payment?.qr_code) {
      navigator.clipboard.writeText(payment.qr_code);
      toast.success('Código PIX copiado!');
    }
  };

  const shareOnWhatsApp = () => {
    const text = `*${globalSettings?.appName || 'LUAN SORTEIOS'}*\n\n*${raffle.title}*\n\nParticipe agora deste sorteio incrível! Apenas R$ ${raffle.price.toFixed(2).replace('.', ',')} por cota.\n\nCompre aqui: ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const Countdown = ({ date }: { date: string }) => {
    const [timeLeft, setTimeLeft] = useState<any>(null);

    useEffect(() => {
      const timer = setInterval(() => {
        const now = new Date().getTime();
        const distance = new Date(date).getTime() - now;

        if (distance < 0) {
          clearInterval(timer);
          setTimeLeft(null);
        } else {
          const days = Math.floor(distance / (1000 * 60 * 60 * 24));
          const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((distance % (1000 * 60)) / 1000);
          setTimeLeft({ days, hours, minutes, seconds });
        }
      }, 1000);

      return () => clearInterval(timer);
    }, [date]);

    if (!timeLeft) return null;

    return (
      <div className="flex gap-2 text-[10px] font-black text-primary uppercase tracking-tighter">
        <div className="bg-primary/10 px-3 py-2 rounded-xl border border-primary/20 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
        </div>
      </div>
    );
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  if (!raffle) return <div>Rifa não encontrada</div>;

  const progress = ((raffle.soldTickets || 0) / raffle.totalTickets) * 100;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      
      {/* Won Prizes Modal */}
      {wonPrizes.length > 0 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card w-full max-w-md p-8 relative overflow-hidden border-primary/30"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full -mr-32 -mt-32 blur-[80px] animate-pulse"></div>
            
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-6 border border-primary/30">
                <Trophy className="w-10 h-10 text-primary" />
              </div>
              
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">
                Você Achou a Cota Premiada!
              </h2>
              <p className="text-gray-400 mb-8">
                Parabéns! Você comprou números que foram sorteados como cotas premiadas instantâneas.
              </p>
              
              <div className="w-full space-y-3 mb-8">
                {wonPrizes.map((prize, i) => (
                  <div key={i} className="bg-white/5 border border-primary/20 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Número Sorteado</p>
                        <p className="text-lg font-black text-white">#{prize.number.toString().padStart(4, '0')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Prêmio</p>
                      <p className="text-xl font-black text-primary">R$ {prize.prize.toFixed(2).replace('.', ',')}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <button 
                onClick={() => setWonPrizes([])}
                className="btn-primary w-full py-4 text-sm"
              >
                RESGATAR PRÊMIO AGORA
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Image Lightbox Modal */}
      <AnimatePresence>
        {showImageModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowImageModal(false)}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-5xl w-full max-h-[90vh] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowImageModal(false)}
                className="absolute -top-12 right-0 text-white hover:text-primary transition-colors p-2"
              >
                <X className="w-8 h-8" />
              </button>
              <img 
                src={raffle.image || 'https://picsum.photos/seed/raffle/800/600'} 
                alt={raffle.title} 
                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl border border-white/10"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Info */}
      <div className="glass-card overflow-hidden">
        <div 
          className="relative aspect-video cursor-zoom-in group"
          onClick={() => setShowImageModal(true)}
        >
          <img 
            src={raffle.image || 'https://picsum.photos/seed/raffle/800/600'} 
            alt={raffle.title} 
            className="w-full h-full object-contain bg-black/40"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 p-3 rounded-full backdrop-blur-sm border border-white/10">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/30 flex items-center gap-1">
              <Trophy className="w-3 h-3" /> Sorteio Oficial
            </span>
            {raffle.category && (
              <span className="px-3 py-1 bg-white/10 text-white rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20 flex items-center gap-1">
                <Target className="w-3 h-3" /> {raffle.category}
              </span>
            )}
            {progress > 80 && (
              <span className="px-3 py-1 bg-red-500/20 text-red-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-500/30 animate-pulse flex items-center gap-1">
                <Zap className="w-3 h-3" /> ÚLTIMAS COTAS
              </span>
            )}
            <span className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-[9px] font-black uppercase tracking-widest border border-green-500/20 flex items-center gap-1.5">
              <Users className="w-2.5 h-2.5" /> {viewers} PESSOAS VENDO AGORA
            </span>
          </div>

          <h1 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">{raffle.title}</h1>
          
          {raffle.drawDate && (
            <div className="pt-2">
              <Countdown date={raffle.drawDate} />
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              <span>Progresso de Vendas</span>
              <span className="text-primary">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-[#222] rounded-full h-3 overflow-hidden border border-[#333]">
              <div 
                className="bg-primary h-full rounded-full transition-all duration-1000 relative overflow-hidden animate-pulse" 
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Section */}
      <div className="glass-card p-6 space-y-6">
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            {progress > 70 && (
              <div className="flex items-center gap-2 text-red-500 text-[10px] font-black uppercase tracking-widest animate-pulse">
                <Zap className="w-3 h-3" /> 🔥 Mais de {Math.round(progress)}% dos números já vendidos
              </div>
            )}
            <div className="flex items-center gap-2 text-yellow-500 text-[10px] font-black uppercase tracking-widest">
              <Clock className="w-3 h-3" /> ⚡ Oferta por tempo limitado
            </div>
          </div>

          <h3 className="text-sm font-black text-white uppercase tracking-tighter">Selecione seu pacote:</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { qty: 1, label: '1 NÚMERO', discount: 0 },
              { qty: 5, label: '5 NÚMEROS', discount: 20 },
              { qty: 10, label: '10 NÚMEROS', discount: 30, badge: '🔥 MAIS VENDIDO', highlight: 'MAIS ESCOLHIDO' },
              { qty: 20, label: '20 NÚMEROS', discount: 40, badge: '💰 MELHOR OFERTA', highlight: 'MELHOR CUSTO BENEFÍCIO' }
            ].map((pkg) => {
              const basePrice = pkg.qty * raffle.price;
              const discountedPrice = basePrice * (1 - pkg.discount / 100);
              const savings = basePrice - discountedPrice;
              const isSelected = selectedPackage === pkg.qty;

              return (
                <button
                  key={pkg.qty}
                  onClick={() => {
                    setQuantity(pkg.qty);
                    setSelectedPackage(pkg.qty);
                  }}
                  className={`relative p-4 rounded-2xl border-2 transition-all text-left flex flex-col justify-between group ${
                    isSelected 
                      ? 'border-primary bg-primary/10 shadow-[0_0_20px_rgba(163,230,53,0.2)]' 
                      : 'border-white/5 bg-[#0a0a0a] hover:border-white/20'
                  }`}
                >
                  {pkg.badge && (
                    <span className="absolute -top-2 -right-2 bg-primary text-black text-[8px] font-black px-2 py-0.5 rounded-full shadow-lg z-10">
                      {pkg.badge}
                    </span>
                  )}
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-black uppercase tracking-tighter ${isSelected ? 'text-primary' : 'text-white'}`}>
                        {pkg.label}
                      </span>
                      {pkg.discount > 0 && (
                        <span className="text-[9px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                          -{pkg.discount}%
                        </span>
                      )}
                    </div>
                    {pkg.highlight && (
                      <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-2">
                        {pkg.highlight}
                      </p>
                    )}
                  </div>

                  <div className="mt-auto">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl font-black text-white tracking-tighter">
                        R$ {discountedPrice.toFixed(2).replace('.', ',')}
                      </span>
                      {pkg.discount > 0 && (
                        <span className="text-[10px] text-gray-500 line-through font-bold">
                          R$ {basePrice.toFixed(2).replace('.', ',')}
                        </span>
                      )}
                    </div>
                    {pkg.discount > 0 && (
                      <p className="text-[9px] font-black text-primary uppercase tracking-widest mt-1">
                        Economize R$ {savings.toFixed(2).replace('.', ',')}
                      </p>
                    )}
                  </div>

                  {isSelected && (
                    <div className="absolute inset-0 rounded-2xl pointer-events-none border border-primary/50 animate-pulse"></div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-2">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">
              "Quanto mais números, maiores suas chances de ganhar"
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-[#0a0a0a] p-1.5 rounded-xl border border-white/5">
            <button 
              onClick={() => {
                setQuantity(Math.max(1, quantity - 1));
                setSelectedPackage(null);
              }}
              className="w-10 h-10 bg-[#1a1a1a] rounded-lg text-white flex items-center justify-center text-lg font-bold hover:bg-[#222] transition border border-white/5"
            >-</button>
            <input 
              type="number" 
              value={quantity}
              onChange={(e) => {
                setQuantity(Math.max(1, parseInt(e.target.value) || 1));
                setSelectedPackage(null);
              }}
              className="flex-1 bg-transparent text-center text-lg font-black text-white outline-none"
            />
            <button 
              onClick={() => {
                setQuantity(quantity + 1);
                setSelectedPackage(null);
              }}
              className="w-10 h-10 bg-[#1a1a1a] rounded-lg text-white flex items-center justify-center text-lg font-bold hover:bg-[#222] transition border border-white/5"
            >+</button>
          </div>

          <div className="p-4 rounded-xl border border-white/5 bg-[#0a0a0a] space-y-2.5">
            <div className="flex justify-between text-gray-500 text-[11px] font-bold uppercase tracking-wider">
              <span>Quantidade de números:</span>
              <span className="text-white">{quantity}</span>
            </div>
            <div className="flex justify-between text-gray-500 text-[11px] font-bold uppercase tracking-wider">
              <span>Valor por número:</span>
              <span className="text-white">R$ {raffle.price.toFixed(2).replace('.', ',')}</span>
            </div>
            <div className="flex justify-between text-gray-400 font-black text-base pt-2.5 border-t border-white/5">
              <span>Total:</span>
              <span className="text-primary text-xl">
                R$ {(
                  quantity === 1 ? quantity * raffle.price :
                  quantity === 5 ? (5 * raffle.price) * 0.8 :
                  quantity === 10 ? (10 * raffle.price) * 0.7 :
                  quantity === 20 ? (20 * raffle.price) * 0.6 :
                  quantity >= 50 ? (quantity * raffle.price) * 0.5 :
                  quantity * raffle.price
                ).toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>

          <button 
            onClick={handleCheckout} 
            disabled={isProcessing || raffle.status !== 'active'}
            className="btn-primary w-full py-4 text-base shadow-[0_0_20px_rgba(163,230,53,0.15)] active:scale-95 transition-all animate-pulse hover:animate-none"
          >
            <ShoppingCart className="w-4 h-4" />
            {isProcessing ? 'PROCESSANDO...' : 'RESERVAR AGORA'}
          </button>

          <button 
            onClick={shareOnWhatsApp}
            className="w-full py-3 rounded-xl border border-green-500/30 bg-green-500/10 text-green-500 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-green-500/20 transition-all active:scale-95"
          >
            <MessageCircle className="w-4 h-4" />
            COMPARTILHAR NO WHATSAPP
          </button>
        </div>
        
        <div className="flex items-center justify-center">
          {globalSettings?.mercadoPagoImage ? (
            <img 
              src={globalSettings.mercadoPagoImage} 
              alt="Pagamento Seguro Mercado Pago" 
              className="h-8 object-contain brightness-110"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex items-center gap-2 text-gray-500 font-bold uppercase tracking-widest text-[10px]">
              <ShieldAlert className="w-4 h-4" /> Pagamento Seguro Mercado Pago
            </div>
          )}
        </div>
      </div>

      {/* Description Section */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-black mb-4 flex items-center gap-2 text-white uppercase tracking-tighter">
          <Trophy className="w-5 h-5 text-primary" /> DESCRIÇÃO DO PRÊMIO
        </h3>
        <div className="space-y-4 text-gray-300 text-sm leading-relaxed">
          <p className="font-black text-white text-xl uppercase tracking-tight">{raffle.title}</p>
          {raffle.description ? (
            <div 
              className="mt-4 text-gray-300 prose prose-invert prose-p:leading-relaxed prose-a:text-primary max-w-none"
              dangerouslySetInnerHTML={{ __html: raffle.description }}
            />
          ) : (
            <>
              <p>Participe agora e concorra a este prêmio incrível!</p>
              <p>Fiquem ligados nas chamadas no nosso instagram.</p>
            </>
          )}
        </div>
      </div>

      {/* PIX Payment Modal */}
      {payment && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[999] flex items-center justify-center p-4 overflow-y-auto">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="glass-card w-full max-w-[360px] p-8 text-center relative border-primary/40 shadow-[0_0_80px_rgba(163,230,53,0.2)] bg-[#050505] my-auto"
          >
            <button 
              onClick={() => setPayment(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition p-2 bg-white/5 rounded-full"
            >
              <Plus className="w-5 h-5 rotate-45" />
            </button>

            {payment.status === 'approved' ? (
              <div className="py-4 space-y-3">
                <CheckCircle className="w-16 h-16 text-primary mx-auto" />
                <h3 className="text-xl font-black text-primary uppercase tracking-tighter">Aprovado!</h3>
                <p className="text-gray-400 text-xs">Seus números já estão garantidos.</p>
                <button onClick={() => navigate('/dashboard')} className="btn-primary w-full mt-4 py-3 text-sm">
                  VER MEUS NÚMEROS
                </button>
              </div>
            ) : timeLeft === 0 ? (
              <div className="py-4 space-y-3">
                <Clock className="w-16 h-16 text-red-500 mx-auto" />
                <h3 className="text-xl font-black text-red-500 uppercase tracking-tighter">Expirado!</h3>
                <p className="text-gray-400 text-xs">O tempo para pagamento expirou.</p>
                <button onClick={() => setPayment(null)} className="btn-primary w-full mt-4 py-3 text-sm">
                  TENTAR NOVAMENTE
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 text-primary">
                  <QrCode className="w-5 h-5" />
                  <h3 className="text-lg font-black uppercase tracking-tighter">Pagamento PIX</h3>
                </div>
                
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-2 flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4 text-red-500" />
                  <span className="text-red-500 font-black text-sm tracking-tighter">
                    {formatTime(timeLeft || 0)}
                  </span>
                </div>

                <div className="bg-white p-4 rounded-xl inline-block mx-auto">
                  <img src={`data:image/png;base64,${payment.qr_code_base64}`} alt="QR Code PIX" className="w-40 h-40" />
                </div>
                
                <div className="space-y-1">
                  <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">Valor</p>
                  <div className="text-2xl font-black text-primary">
                    R$ {payment.amount.toFixed(2).replace('.', ',')}
                  </div>
                </div>

                <div className="space-y-2">
                  <button onClick={copyPix} className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-xs shadow-lg">
                    <Copy className="w-4 h-4" />
                    COPIAR CÓDIGO
                  </button>
                  
                  <div className="flex items-center justify-center gap-2 text-yellow-500 text-[10px] font-bold bg-yellow-500/10 py-2 rounded-lg border border-yellow-500/20">
                    <Clock className="w-3 h-3 animate-spin" />
                    AGUARDANDO...
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Instant Prizes Section */}
      {winner && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black flex items-center gap-2 text-primary uppercase tracking-tighter">
              <DollarSign className="w-5 h-5" /> Ganhador
            </h3>
          </div>
          
          <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black text-xl">
              #{winner.ticketNumber}
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase">Ganhador</p>
              <p className="text-white font-black">{winner.userName || 'Anônimo'}</p>
              <p className="text-primary font-black text-xs">{winner.prize}</p>
            </div>
          </div>
        </div>
      )}

      {/* FAQ Section */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-black mb-6 flex items-center gap-2 text-white uppercase tracking-tighter">
          <Info className="w-5 h-5 text-primary" /> Dúvidas Frequentes
        </h3>
        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <details key={idx} className="group border-b border-white/5 pb-3">
              <summary className="flex justify-between items-center cursor-pointer list-none text-sm font-bold text-gray-300 group-open:text-primary transition-colors">
                {faq.q}
                <Plus className="w-4 h-4 transition-transform group-open:rotate-45" />
              </summary>
              <p className="mt-3 text-xs text-gray-500 leading-relaxed pl-1">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pt-8 pb-4 space-y-6">
        <div className="flex flex-col md:flex-row justify-center items-center gap-6">
          <div className="flex items-center justify-center">
            {globalSettings?.mercadoPagoImage ? (
              <img 
                src={globalSettings.mercadoPagoImage} 
                alt="Pagamento Seguro Mercado Pago" 
                className="h-8 object-contain brightness-110"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex items-center gap-2 text-gray-500 font-bold uppercase tracking-widest text-[10px]">
                <ShieldAlert className="w-4 h-4" /> Pagamento Seguro Mercado Pago
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-center items-center gap-6">
          <div className="text-red-500 font-bold border-2 border-red-500 rounded-full w-12 h-12 flex items-center justify-center text-xl">18+</div>
          <div className="flex flex-col items-start text-xs text-white font-bold">
            <span>PROIBIDO PARA</span>
            <span>MENORES DE 18 ANOS</span>
          </div>
        </div>
        
        <p className="text-[10px] text-gray-500 max-w-md mx-auto leading-tight">
          LUAN SORTEIOS © 2026 - Projeto com sede na cidade de Reserva/PR. Todos os sorteios realizados no site são regulamentados e fiscalizados. A participação nos sorteios deste site não implica em garantia de ganhos, sendo a premiação condicionada exclusivamente ao resultado do sorteio.
        </p>
        
        <div className="flex items-center justify-center gap-2 text-primary text-sm font-bold">
          <span className="text-gray-500 font-normal">Tecnologia:</span>
          <a href="https://wa.me/5542988599975" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-white transition-colors">
            <Trophy className="w-4 h-4" /> Luan.dev
          </a>
        </div>
      </div>
    </div>
  );
}
