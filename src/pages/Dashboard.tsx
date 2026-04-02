import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy, onSnapshot, updateDoc, doc, limit } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Ticket, Clock, CheckCircle, User, Mail, Calendar, Download, Trophy, ShoppingBag, ArrowRight, Bell, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const [myTickets, setMyTickets] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [raffles, setRaffles] = useState<Record<string, any>>({});
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        const [ticketsSnap, rafflesSnap, paymentsSnap] = await Promise.all([
          getDocs(query(collection(db, 'tickets'), where('userId', '==', user.uid))),
          getDocs(collection(db, 'raffles')),
          getDocs(query(collection(db, 'payments'), where('userId', '==', user.uid), orderBy('createdAt', 'desc')))
        ]);

        const ticketsData: any[] = ticketsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const paymentsData: any[] = paymentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const rafflesData: Record<string, any> = {};
        rafflesSnap.docs.forEach(doc => {
          rafflesData[doc.id] = { id: doc.id, ...doc.data() };
        });
        
        setMyTickets(ticketsData);
        setPayments(paymentsData);
        setRaffles(rafflesData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        const q = query(
          collection(db, 'notifications'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(10)
        );

        const unsubscribeNotifications = onSnapshot(q, (snapshot) => {
          setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => unsubscribeNotifications();
      }
    });

    return () => unsubscribe();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const generatePDF = async (payment: any) => {
    const raffle = raffles[payment.raffleId];
    const doc = new jsPDF();
    
    // Branding Colors
    const primaryColor = [163, 230, 53]; // #A3E635
    const darkColor = [10, 10, 10];
    
    // Generate Logo Image
    const svgString = `<svg viewBox="0 0 240 80" fill="none" xmlns="http://www.w3.org/2000/svg" width="240" height="80">
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A3E635" />
          <stop offset="100%" stopColor="#22C55E" />
        </linearGradient>
      </defs>
      <path d="M10 25C10 22.2386 12.2386 20 15 20H55C57.7614 20 60 22.2386 60 25V35C57 35 55 37 55 40C55 43 57 45 60 45V55C60 57.7614 57.7614 60 55 60H15C12.2386 60 10 57.7614 10 55V45C13 45 15 43 15 40C15 37 13 35 10 35V25Z" fill="url(#logoGradient)" />
      <circle cx="35" cy="40" r="8" fill="black" fill-opacity="0.2" />
      <path d="M30 40H40M35 35V45" stroke="black" stroke-width="2" stroke-linecap="round" />
      <text x="75" y="42" fill="white" style="font: 900 38px Arial, sans-serif; letter-spacing: -0.06em;">LUAN</text>
      <text x="75" y="62" fill="#A3E635" style="font: 900 14px Arial, sans-serif; letter-spacing: 0.4em;">SORTEIOS</text>
    </svg>`;
    
    const svgBlob = new Blob([svgString], {type: 'image/svg+xml;charset=utf-8'});
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.src = url;
    await new Promise((resolve) => { img.onload = resolve; });
    
    const canvas = document.createElement('canvas');
    canvas.width = 240 * 2;
    canvas.height = 80 * 2;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(2, 2);
      ctx.drawImage(img, 0, 0);
    }
    const pngDataUrl = canvas.toDataURL('image/png');
    URL.revokeObjectURL(url);

    // Header Background
    doc.setFillColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.rect(0, 0, 210, 45, 'F');
    
    // Add Logo
    doc.addImage(pngDataUrl, 'PNG', 105 - 30, 10, 60, 20);
    
    // Title
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('COMPROVANTE DE PARTICIPAÇÃO', 105, 65, { align: 'center' });
    
    // Info Box (Buyer)
    doc.setFillColor(250, 250, 250);
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.roundedRect(15, 75, 180, 45, 3, 3, 'FD');
    
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text('DADOS DO COMPRADOR', 20, 85);
    
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nome: ${auth.currentUser?.displayName || 'Usuário'}`, 20, 95);
    doc.text(`E-mail: ${auth.currentUser?.email}`, 20, 103);
    doc.text(`Data da Compra: ${new Date(payment.createdAt).toLocaleString('pt-BR')}`, 20, 111);
    
    // Raffle Details
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.setFont('helvetica', 'bold');
    doc.text('DETALHES DO SORTEIO', 20, 140);
    
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(14);
    doc.text(`${raffle?.title || 'Sorteio'}`, 20, 150);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Valor Pago: R$ ${payment.amount.toFixed(2).replace('.', ',')}`, 20, 160);
    doc.text(`Status: `, 20, 168);
    doc.setTextColor(primaryColor[0] - 50, primaryColor[1] - 50, primaryColor[2] - 50); // darker green for text
    doc.setFont('helvetica', 'bold');
    doc.text(`PAGAMENTO APROVADO`, 35, 168);
    
    // Numbers Section
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.5);
    doc.roundedRect(15, 185, 180, 60, 3, 3, 'FD');
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('SEUS NÚMEROS DA SORTE', 105, 198, { align: 'center' });
    
    doc.setTextColor(primaryColor[0] - 20, primaryColor[1] - 20, primaryColor[2] - 20);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    const numbers = payment.ticketNumbers?.map((n: number) => n.toString().padStart(4, '0')).join('   ') || 'N/A';
    const splitNumbers = doc.splitTextToSize(numbers, 160);
    doc.text(splitNumbers, 105, 215, { align: 'center' });
    
    // Footer
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Este documento é um comprovante oficial de participação.', 105, 275, { align: 'center' });
    doc.text('O sorteio será realizado com base na Loteria Federal.', 105, 280, { align: 'center' });
    doc.text(`ID Transação: ${payment.id}`, 105, 285, { align: 'center' });
    
    doc.setTextColor(primaryColor[0] - 20, primaryColor[1] - 20, primaryColor[2] - 20);
    doc.setFont('helvetica', 'bold');
    doc.text('www.luansorteios.com.br', 105, 292, { align: 'center' });
    
    doc.save(`comprovante-${raffle?.title || 'sorteio'}.pdf`);
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;

  const groupedTickets = myTickets.reduce((acc: Record<string, any[]>, ticket: any) => {
    if (!acc[ticket.raffleId]) acc[ticket.raffleId] = [];
    acc[ticket.raffleId].push(ticket);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      
      {/* User Home Header */}
      <div className="glass-card p-8 relative overflow-hidden border-primary/20 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full -mr-48 -mt-48 blur-[120px] animate-pulse"></div>
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
          <div className="w-28 h-28 rounded-3xl bg-primary/10 flex items-center justify-center border-2 border-primary/30 rotate-3 hover:rotate-0 transition-transform duration-500 shadow-[0_0_30px_rgba(163,230,53,0.1)]">
            <Ticket className="w-14 h-14 text-primary" />
          </div>
          <div className="text-center md:text-left flex-1">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
              <span className="px-2 py-0.5 bg-primary/20 text-primary text-[9px] font-black uppercase tracking-widest rounded border border-primary/30">Membro VIP</span>
              <span className="px-2 py-0.5 bg-white/10 text-white text-[9px] font-black uppercase tracking-widest rounded border border-white/20">Verificado</span>
            </div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">Minhas <span className="text-primary">Cotas</span></h1>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mt-2 flex items-center justify-center md:justify-start gap-2">
              <Mail className="w-3.5 h-3.5 text-primary" /> {auth.currentUser?.email}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
            <div className="glass-card p-4 text-center border-white/5 bg-white/5">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Total Cotas</p>
              <p className="text-2xl font-black text-primary">{myTickets.length}</p>
            </div>
            <div className="glass-card p-4 text-center border-white/5 bg-white/5">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Participações</p>
              <p className="text-2xl font-black text-white">{Object.keys(groupedTickets).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications Section */}
      {notifications.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary" /> Notificações
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {notifications.map((notif) => (
              <div 
                key={notif.id} 
                className={`glass-card p-5 flex items-start gap-4 transition-all border-white/5 shadow-lg ${notif.read ? 'opacity-60' : 'border-primary/30 bg-primary/5'}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${notif.type === 'winner' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-primary/20 text-primary'}`}>
                  {notif.type === 'winner' ? <Trophy className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="text-sm font-black text-white uppercase tracking-tight truncate">{notif.title}</h4>
                    {!notif.read && (
                      <button 
                        onClick={() => markAsRead(notif.id)}
                        className="p-1 hover:bg-white/10 rounded-lg transition-colors text-primary"
                        title="Marcar como lida"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{notif.message}</p>
                  <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mt-2">
                    {new Date(notif.createdAt).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: My Tickets */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
              <Ticket className="w-6 h-6 text-primary" /> Minhas Cotas
            </h2>
            <button onClick={() => navigate('/')} className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">
              Comprar Mais
            </button>
          </div>
          
          {Object.keys(groupedTickets).length === 0 ? (
            <div className="glass-card p-12 text-center border-dashed border-white/10">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <Ticket className="w-8 h-8 text-gray-600" />
              </div>
              <p className="text-gray-500 font-bold uppercase tracking-widest text-sm mb-6">Você ainda não possui cotas.</p>
              <button onClick={() => navigate('/')} className="btn-primary py-3 px-8 text-xs">
                VER RIFAS DISPONÍVEIS
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedTickets).map(([raffleId, tickets]: [string, any[]]) => {
                const raffle = raffles[raffleId];
                if (!raffle) return null;

                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={raffleId} 
                    className="glass-card overflow-hidden group hover:border-primary/30 transition-all border-white/5 shadow-xl"
                  >
                    <div className="flex flex-col sm:flex-row">
                      <div className="w-full sm:w-48 h-36 relative overflow-hidden shrink-0">
                        <img 
                          src={raffle.image || 'https://picsum.photos/seed/raffle/400/300'} 
                          alt={raffle.title} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                        <div className="absolute bottom-3 left-3">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${
                            raffle.status === 'active' 
                              ? 'bg-primary text-black border-primary' 
                              : 'bg-gray-500 text-white border-gray-500'
                          }`}>
                            {raffle.status === 'active' ? 'Ativo' : 'Finalizado'}
                          </span>
                        </div>
                      </div>
                      <div className="p-6 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="text-xl font-black text-white uppercase tracking-tighter leading-tight">{raffle.title}</h3>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-4 mt-1">
                            <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                              <Ticket className="w-3.5 h-3.5 text-primary" />
                              {tickets.length} {tickets.length === 1 ? 'COTA' : 'COTAS'}
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                              <Calendar className="w-3.5 h-3.5 text-primary" />
                              {new Date(tickets[0].createdAt).toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {tickets.slice(0, 12).map(t => (
                            <div 
                              key={t.id} 
                              className={`px-2 py-1 rounded text-[10px] font-black font-mono border ${
                                t.status === 'paid' 
                                  ? 'bg-primary/10 text-primary border-primary/20' 
                                  : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 animate-pulse'
                              }`}
                            >
                              #{t.number.toString().padStart(4, '0')}
                            </div>
                          ))}
                          {tickets.length > 12 && (
                            <div className="px-2 py-1 rounded text-[10px] font-black text-gray-500 bg-white/5 border border-white/10">
                              +{tickets.length - 12} mais
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: History & Receipts */}
        <div className="space-y-6">
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-primary" /> Histórico
          </h2>
          
          <div className="space-y-4">
            {payments.map((payment) => (
              <div key={payment.id} className="glass-card p-5 space-y-4 hover:bg-white/[0.03] transition-all border-white/5 shadow-lg group">
                <div className="flex justify-between items-start">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">
                      {new Date(payment.createdAt).toLocaleDateString('pt-BR')} às {new Date(payment.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <h4 className="text-sm font-black text-white uppercase tracking-tight truncate group-hover:text-primary transition-colors">
                      {raffles[payment.raffleId]?.title || 'Rifa'}
                    </h4>
                  </div>
                  <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border shrink-0 ml-2 ${
                    payment.status === 'approved' 
                      ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                      : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                  }`}>
                    {payment.status === 'approved' ? 'APROVADO' : 'PENDENTE'}
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Valor Pago</span>
                    <span className="text-lg font-black text-primary leading-none">
                      R$ {payment.amount.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  {payment.status === 'approved' && (
                    <button 
                      onClick={() => generatePDF(payment)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-primary hover:text-black text-[10px] font-black text-white transition-all uppercase tracking-widest border border-white/10 hover:border-primary"
                    >
                      <Download className="w-3.5 h-3.5" /> PDF
                    </button>
                  )}
                </div>
              </div>
            ))}
            {payments.length === 0 && (
              <div className="text-center py-12 glass-card border-dashed border-white/10">
                <ShoppingBag className="w-10 h-10 text-gray-700 mx-auto mb-3 opacity-20" />
                <p className="text-gray-500 text-[10px] uppercase font-black tracking-widest">
                  Nenhuma transação encontrada.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

