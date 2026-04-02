import { useEffect, useState } from 'react';
import { collection, query, getDocs, addDoc, updateDoc, setDoc, doc, deleteDoc, where, onSnapshot, orderBy, limit, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import React from 'react';
import { db, auth, storage } from '../../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Users, DollarSign, Ticket, LayoutDashboard, Settings, Gift, User, Upload, Sparkles, Trophy, X, Menu, ChevronRight, ShieldAlert, Download } from 'lucide-react';
import { toast } from 'sonner';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from 'motion/react';
import { uploadBytesResumable } from 'firebase/storage';

const SidebarContent = ({ activeTab, activeDrawer, setActiveTab, setActiveDrawer, setShowMobileMenu }: any) => (
  <>
    <div className="flex items-center gap-3 mb-8 px-2 hidden md:flex">
      <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30">
        <Settings className="w-6 h-6 text-primary animate-pulse" />
      </div>
      <div>
        <h2 className="text-lg font-black text-white uppercase tracking-tighter leading-none">Painel Adm</h2>
        <p className="text-[10px] text-primary font-bold uppercase tracking-widest mt-1">Godmode Ativo</p>
      </div>
    </div>
    
    <nav className="space-y-1">
      <button 
        onClick={() => { setActiveTab('dashboard'); setActiveDrawer(null); setShowMobileMenu(false); }}
        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 ${activeTab === 'dashboard' && !activeDrawer ? 'bg-primary text-black font-black shadow-[0_0_20px_rgba(163,230,53,0.2)]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
      >
        <LayoutDashboard className={`w-5 h-5 ${activeTab === 'dashboard' && !activeDrawer ? 'text-black' : 'text-primary'}`} /> 
        <span className="text-sm uppercase tracking-wider">Visão Geral</span>
      </button>
      
      <button 
        onClick={() => { setActiveDrawer('raffles'); setShowMobileMenu(false); }}
        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 ${activeDrawer === 'raffles' ? 'bg-primary text-black font-black shadow-[0_0_20px_rgba(163,230,53,0.2)]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
      >
        <Ticket className={`w-5 h-5 ${activeDrawer === 'raffles' ? 'text-black' : 'text-primary'}`} /> 
        <span className="text-sm uppercase tracking-wider">Gerenciar Rifas</span>
      </button>
      
      <button 
        onClick={() => { setActiveDrawer('users'); setShowMobileMenu(false); }}
        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 ${activeDrawer === 'users' ? 'bg-primary text-black font-black shadow-[0_0_20px_rgba(163,230,53,0.2)]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
      >
        <Users className={`w-5 h-5 ${activeDrawer === 'users' ? 'text-black' : 'text-primary'}`} /> 
        <span className="text-sm uppercase tracking-wider">Usuários</span>
      </button>

      <button 
        onClick={() => { setActiveDrawer('winners'); setShowMobileMenu(false); }}
        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 ${activeDrawer === 'winners' ? 'bg-primary text-black font-black shadow-[0_0_20px_rgba(163,230,53,0.2)]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
      >
        <Trophy className={`w-5 h-5 ${activeDrawer === 'winners' ? 'text-black' : 'text-primary'}`} /> 
        <span className="text-sm uppercase tracking-wider">Ganhadores</span>
      </button>

      <button 
        onClick={() => { setActiveDrawer('settings'); setShowMobileMenu(false); }}
        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 ${activeDrawer === 'settings' ? 'bg-primary text-black font-black shadow-[0_0_20px_rgba(163,230,53,0.2)]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
      >
        <Settings className={`w-5 h-5 ${activeDrawer === 'settings' ? 'text-black' : 'text-primary'}`} /> 
        <span className="text-sm uppercase tracking-wider">Configurações</span>
      </button>
    </nav>

    <div className="mt-8 pt-8 border-t border-white/5">
      <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
        <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Suporte Técnico</p>
        <p className="text-xs text-gray-400 leading-tight">Precisa de ajuda com o painel? Entre em contato.</p>
        <button className="mt-3 text-[10px] font-black text-white bg-primary/20 px-3 py-2 rounded-lg hover:bg-primary/30 transition-colors uppercase tracking-widest">
          Abrir Chamado
        </button>
      </div>
    </div>
  </>
);

const initialFormData = {
  title: '',
  description: '',
  price: '',
  totalTickets: '',
  cost: '',
  targetRevenue: '',
  autoExpand: false,
  extraTicketsPerExpansion: '',
  extraWinningTicketsPerExpansion: '',
  image: '',
  category: 'Eletrônicos',
  status: 'active',
  drawDate: '',
  isFeatured: false,
  winningTickets: []
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeDrawer, setActiveDrawer] = useState<string | null>(null);
  const [raffles, setRaffles] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, 'notifications'),
      where('isAdmin', '==', true),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const notification = snapshot.docs[0].data();
        const now = new Date().getTime();
        const createdAt = new Date(notification.createdAt).getTime();
        
        // Only notify if it's a new notification (within last 30 seconds)
        if (now - createdAt < 30000) {
          toast.success(notification.title + ": " + notification.message, {
            duration: 10000,
            icon: '🚨'
          });
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'payments'), orderBy('createdAt', 'desc'), limit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newPayments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      
      // Notify on new purchase
      if (payments.length > 0 && newPayments.length > 0 && newPayments[0].id !== payments[0].id) {
        toast.success(`Nova compra realizada: R$ ${newPayments[0].amount?.toFixed(2)}`);
      }
      
      setPayments(newPayments);
    });
    return () => unsubscribe();
  }, [payments]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [raffleToDelete, setRaffleToDelete] = useState<string | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetType, setResetType] = useState<'all' | 'data' | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

  const generateAIContent = async () => {
    if (!formData.title) {
      toast.error('Digite um título básico primeiro');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Você é um copywriter de elite, mestre em persuasão e hipnose conversacional focado em vendas de alto impacto.
        O prêmio da nossa campanha é: ${formData.title}.
        
        Sua missão é criar um título irresistível e uma descrição altamente persuasiva, magnética e que faça o usuário sentir que PRECISA comprar uma cota agora mesmo.
        
        Diretrizes para a Descrição:
        - Use muitos EMOJIS chamativos e estratégicos (🔥, 🚀, 💰, 🚨, 🎯, 🍀, etc).
        - Aplique gatilhos mentais fortes: Escassez ("poucas cotas"), Urgência ("acabando rápido"), Prova Social e Ganância.
        - Crie uma narrativa que faça a pessoa se imaginar ganhando o prêmio.
        - Destaque que existem COTAS PREMIADAS (dinheiro instantâneo na conta ao achar o número premiado).
        - Mencione que o sorteio é 100% seguro e baseado na Loteria Federal.
        - Formate o texto usando HTML básico para ficar bonito na tela (use <b>, <i>, <br>, <ul>, <li>).
        - Termine com uma Chamada para Ação (CTA) agressiva e hipnótica.
        
        Responda APENAS em formato JSON com as chaves "title" (o título curto e explosivo) e "description" (a descrição em HTML).`,
        config: { responseMimeType: "application/json" }
      });

      const result = JSON.parse(response.text || '{}');
      if (result.title && result.description) {
        setFormData(prev => ({
          ...prev,
          title: result.title,
          description: result.description
        }));
        toast.success('Conteúdo premium gerado com sucesso!');
      }
    } catch (error) {
      console.error('AI Error:', error);
      toast.error('Erro ao gerar conteúdo com IA');
    } finally {
      setIsGenerating(false);
    }
  };
  const [formData, setFormData] = useState(initialFormData);
  const [showDrawModal, setShowDrawModal] = useState(false);
  const [selectedRaffleForDraw, setSelectedRaffleForDraw] = useState<any>(null);
  const [drawNumber, setDrawNumber] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [winners, setWinners] = useState<any[]>([]);
  const [globalSettings, setGlobalSettings] = useState({
    siteName: 'Luan Sorteios',
    whatsapp: '',
    instagram: '',
    mercadoPagoToken: '',
    mercadoPagoPublicKey: '',
    mercadoPagoImage: '',
    heroBadgeImage: '',
    showCategories: true,
    showTestimonials: true,
    howItWorksText: 'Participe de nossos sorteios exclusivos e concorra a prêmios incríveis! O processo é 100% seguro e transparente.'
  });
  const [savingSettings, setSavingSettings] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        navigate('/login');
        return;
      }

      // Check admin role
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists() || (userDoc.data().role !== 'admin' && user.email !== 'luh5826@gmail.com')) {
        toast.error('Acesso negado');
        navigate('/');
        return;
      }

      // Fetch all data for Godmode
      const [rafflesSnap, winnersSnap, usersSnap, settingsSnap] = await Promise.all([
        getDocs(collection(db, 'raffles')),
        getDocs(collection(db, 'winners')),
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'settings'))
      ]);
      
      setRaffles(rafflesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setWinners(winnersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setUsers(usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      
      if (!settingsSnap.empty) {
        setGlobalSettings(settingsSnap.docs[0].data() as any);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setFormData(prev => ({ ...prev, image: dataUrl }));
          setUploadingImage(false);
          toast.success('Imagem carregada com sucesso!');
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erro ao processar imagem.');
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const raffleData = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        totalTickets: parseInt(formData.totalTickets),
        cost: parseFloat(formData.cost || '0'),
        targetRevenue: parseFloat(formData.targetRevenue || '0'),
        autoExpand: formData.autoExpand,
        extraTicketsPerExpansion: parseInt(formData.extraTicketsPerExpansion || '0'),
        extraWinningTicketsPerExpansion: parseInt(formData.extraWinningTicketsPerExpansion || '0'),
        image: formData.image,
        category: formData.category,
        status: formData.status,
        drawDate: formData.drawDate,
        isFeatured: formData.isFeatured,
        winningTickets: formData.winningTickets,
        autoScale: true, // Enable auto-scaling
        updatedAt: new Date().toISOString()
      };

      if (editingId) {
        await setDoc(doc(db, 'raffles', editingId), raffleData, { merge: true });
        setRaffles(raffles.map(r => r.id === editingId ? { ...r, ...raffleData } : r));
        toast.success('Rifa atualizada!');
      } else {
        const newRaffle = { ...raffleData, soldTickets: 0, totalRevenue: 0, createdAt: new Date().toISOString() };
        const docRef = await addDoc(collection(db, 'raffles'), newRaffle);
        setRaffles([...raffles, { id: docRef.id, ...newRaffle }]);
        toast.success('Rifa criada com sucesso!');
      }
      
      setShowModal(false);
      setEditingId(null);
      setFormData(initialFormData);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar rifa');
    }
  };

  const handleEdit = (raffle: any) => {
    setFormData({
      title: raffle.title,
      description: raffle.description,
      price: raffle.price.toString(),
      totalTickets: raffle.totalTickets.toString(),
      cost: (raffle.cost || 0).toString(),
      targetRevenue: (raffle.targetRevenue || 0).toString(),
      autoExpand: raffle.autoExpand || false,
      extraTicketsPerExpansion: (raffle.extraTicketsPerExpansion || '').toString(),
      extraWinningTicketsPerExpansion: (raffle.extraWinningTicketsPerExpansion || '').toString(),
      image: raffle.image || '',
      category: raffle.category || 'Eletrônicos',
      status: raffle.status,
      drawDate: raffle.drawDate || '',
      isFeatured: raffle.isFeatured || false,
      winningTickets: raffle.winningTickets || []
    });
    setEditingId(raffle.id);
    setShowModal(true);
  };

  const handleDraw = async () => {
    if (!drawNumber || !selectedRaffleForDraw) return;
    
    setIsDrawing(true);
    try {
      const num = parseInt(drawNumber);
      
      // Find the ticket
      const ticketsSnap = await getDocs(query(
        collection(db, 'tickets'), 
        where('raffleId', '==', selectedRaffleForDraw.id),
        where('number', '==', num),
        where('status', '==', 'paid')
      ));

      if (ticketsSnap.empty) {
        toast.error('Nenhum ganhador encontrado para este número (ou número não pago)');
        setIsDrawing(false);
        return;
      }

      const ticketData = ticketsSnap.docs[0].data();
      const winnerUser = users.find(u => u.id === ticketData.userId);

      // Update Raffle
      await updateDoc(doc(db, 'raffles', selectedRaffleForDraw.id), {
        status: 'finished',
        winnerTicket: num,
        winnerUser: winnerUser?.name || winnerUser?.email || 'Usuário',
        drawDate: new Date().toISOString()
      });

      // Add to Winners Gallery
      const winnerData = {
        raffleId: selectedRaffleForDraw.id,
        raffleTitle: selectedRaffleForDraw.title,
        userName: winnerUser?.name || winnerUser?.email || 'Usuário',
        userPhoto: winnerUser?.avatar || '',
        ticketNumber: num,
        prize: selectedRaffleForDraw.title,
        createdAt: new Date().toISOString()
      };
      
      await addDoc(collection(db, 'winners'), winnerData);

      // Create notification for winner
      if (ticketData.userId) {
        await addDoc(collection(db, 'notifications'), {
          userId: ticketData.userId,
          title: '🎉 VOCÊ GANHOU!',
          message: `Parabéns! Você foi o vencedor da rifa "${selectedRaffleForDraw.title}" com a cota #${num}!`,
          type: 'winner',
          read: false,
          createdAt: new Date().toISOString()
        });
      }
      
      setRaffles(raffles.map(r => r.id === selectedRaffleForDraw.id ? { ...r, status: 'finished', winnerTicket: num, winnerUser: winnerUser?.name || winnerUser?.email || 'Usuário' } : r));
      setWinners([...winners, winnerData]);
      
      toast.success(`Ganhador definido: ${winnerUser?.name || winnerUser?.email || 'Usuário'}!`);
      setShowDrawModal(false);
      setDrawNumber('');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao realizar sorteio');
    } finally {
      setIsDrawing(false);
    }
  };

  const handleDelete = (id: string) => {
    setRaffleToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!raffleToDelete) return;
    try {
      await deleteDoc(doc(db, 'raffles', raffleToDelete));
      setRaffles(raffles.filter(r => r.id !== raffleToDelete));
      toast.success('Rifa excluída!');
      setShowDeleteConfirm(false);
      setRaffleToDelete(null);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao excluir rifa');
    }
  };

  const handleReset = async () => {
    if (!resetType) return;
    setIsResetting(true);
    try {
      const collectionsToClear = resetType === 'all' 
        ? ['raffles', 'users', 'tickets', 'payments', 'winners', 'notifications']
        : ['tickets', 'payments', 'winners', 'notifications'];

      for (const colName of collectionsToClear) {
        const snap = await getDocs(collection(db, colName));
        const deletePromises = snap.docs.map(d => deleteDoc(doc(db, colName, d.id)));
        await Promise.all(deletePromises);
      }

      if (resetType === 'data') {
        // Reset soldTickets in raffles
        const rafflesSnap = await getDocs(collection(db, 'raffles'));
        const updatePromises = rafflesSnap.docs.map(d => updateDoc(doc(db, 'raffles', d.id), { soldTickets: 0 }));
        await Promise.all(updatePromises);
      }

      toast.success(resetType === 'all' ? 'Tudo foi resetado!' : 'Dados limpos com sucesso!');
      window.location.reload();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao resetar dados');
    } finally {
      setIsResetting(false);
      setShowResetConfirm(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const settingsSnap = await getDocs(collection(db, 'settings'));
      if (settingsSnap.empty) {
        await addDoc(collection(db, 'settings'), globalSettings);
      } else {
        await updateDoc(doc(db, 'settings', settingsSnap.docs[0].id), globalSettings);
      }
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSavingSettings(false);
    }
  };

  const downloadLogoAsPNG = () => {
    const svg = document.querySelector('nav svg');
    if (!svg) {
      toast.error('Logo não encontrado na página');
      return;
    }

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    // Set high resolution
    const scale = 4;
    canvas.width = 240 * scale;
    canvas.height = 80 * scale;
    
    img.onload = () => {
      if (ctx) {
        ctx.fillStyle = 'transparent';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const pngUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = 'luan-sorteios-logo.png';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        toast.success('Logo baixado com sucesso!');
      }
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleSettingsImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'mercadoPagoImage' | 'heroBadgeImage') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setUploadProgress(0);
    try {
      const storageRef = ref(storage, `settings/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        }, 
        (error) => {
          console.error('Upload error:', error);
          toast.error('Erro no upload: ' + error.message);
          setUploadingImage(false);
        }, 
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          setGlobalSettings(prev => ({ ...prev, [field]: url }));
          toast.success('Imagem carregada com sucesso!');
          setUploadingImage(false);
          setUploadProgress(0);
        }
      );
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error('Erro ao fazer upload da imagem: ' + error.message);
      setUploadingImage(false);
    }
  };

  useEffect(() => {
    if (showModal || showDrawModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showModal, showDrawModal]);

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    try {
      await updateDoc(doc(db, 'users', editingUser.id), {
        name: editingUser.name,
        email: editingUser.email,
        phone: editingUser.phone || '',
        cpf: editingUser.cpf || '',
        role: editingUser.role,
      });
      
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...editingUser } : u));
      toast.success('Usuário atualizado com sucesso!');
      setShowUserModal(false);
      setEditingUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Erro ao atualizar usuário');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) return;
    
    try {
      await deleteDoc(doc(db, 'users', userId));
      setUsers(users.filter(u => u.id !== userId));
      toast.success('Usuário excluído com sucesso!');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Erro ao excluir usuário');
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;

  return (
    <div className="flex flex-col md:flex-row gap-6 min-h-[80vh] relative">
      {/* Mobile Menu Toggle */}
      <div className="md:hidden flex items-center justify-between glass-card p-4 mb-2 border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30">
            <Settings className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-sm font-black text-white uppercase tracking-tighter">Painel Adm</h2>
        </div>
        <button 
          onClick={() => setShowMobileMenu(true)}
          className="p-2 bg-white/5 rounded-lg text-primary hover:bg-white/10 transition-all"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Sidebar Desktop */}
      <div className="hidden md:flex w-72 glass-card p-6 flex-col gap-2 h-fit sticky top-24 border-white/5 shadow-2xl">
        <SidebarContent 
          activeTab={activeTab} 
          activeDrawer={activeDrawer} 
          setActiveTab={setActiveTab} 
          setActiveDrawer={setActiveDrawer} 
          setShowMobileMenu={setShowMobileMenu}
        />
      </div>

      {/* Sidebar Mobile Drawer */}
      <AnimatePresence>
        {showMobileMenu && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileMenu(false)}
              className="md:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-[110]"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="md:hidden fixed top-0 left-0 h-full w-72 bg-[#0A0A0A] p-6 flex flex-col gap-2 z-[120] border-r border-white/10 shadow-2xl overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-8 px-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center border border-primary/30">
                    <Settings className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-sm font-black text-white uppercase tracking-tighter">Menu</h2>
                </div>
                <button onClick={() => setShowMobileMenu(false)} className="text-gray-500 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <SidebarContent 
                activeTab={activeTab} 
                activeDrawer={activeDrawer} 
                setActiveTab={setActiveTab} 
                setActiveDrawer={setActiveDrawer} 
                setShowMobileMenu={setShowMobileMenu}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 space-y-6">
        {activeTab === 'dashboard' && !activeDrawer && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Visão Geral</h1>
                <p className="text-gray-500 text-sm font-medium">Acompanhe o desempenho real do seu negócio.</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-primary uppercase tracking-widest">Última Atualização</p>
                <p className="text-xs text-white font-bold">{new Date().toLocaleTimeString('pt-BR')}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              <div className="glass-card p-5 border-l-4 border-l-primary relative overflow-hidden group hover:scale-[1.02] transition-transform">
                <div className="absolute top-0 right-0 p-8 bg-primary/5 rounded-bl-full -mr-4 -mt-4 group-hover:bg-primary/10 transition-colors"></div>
                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Arrecadação</p>
                    <h3 className="text-2xl font-black text-white mt-1">
                      R$ {raffles.reduce((acc, r) => acc + ((r.soldTickets || 0) * r.price), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </h3>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-xl text-primary shadow-[0_0_15px_rgba(163,230,53,0.1)]"><DollarSign className="w-5 h-5" /></div>
                </div>
              </div>
              
              <div className="glass-card p-5 border-l-4 border-l-red-500 relative overflow-hidden group hover:scale-[1.02] transition-transform">
                <div className="absolute top-0 right-0 p-8 bg-red-500/5 rounded-bl-full -mr-4 -mt-4 group-hover:bg-red-500/10 transition-colors"></div>
                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Custo Total</p>
                    <h3 className="text-2xl font-black text-white mt-1">
                      R$ {raffles.reduce((acc, r) => acc + (r.cost || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </h3>
                  </div>
                  <div className="p-2 bg-red-500/10 rounded-xl text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.1)]"><Trash2 className="w-5 h-5" /></div>
                </div>
              </div>
 
              <div className="glass-card p-5 border-l-4 border-l-green-500 relative overflow-hidden group hover:scale-[1.02] transition-transform">
                <div className="absolute top-0 right-0 p-8 bg-green-500/5 rounded-bl-full -mr-4 -mt-4 group-hover:bg-green-500/10 transition-colors"></div>
                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Lucro Atual</p>
                    <h3 className="text-2xl font-black text-white mt-1">
                      R$ {(raffles.reduce((acc, r) => acc + ((r.soldTickets || 0) * r.price), 0) - raffles.reduce((acc, r) => acc + (r.cost || 0), 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </h3>
                  </div>
                  <div className="p-2 bg-green-500/10 rounded-xl text-green-500 shadow-[0_0_15px_rgba(34,197,94,0.1)]"><Gift className="w-5 h-5" /></div>
                </div>
              </div>
 
              <div className="glass-card p-5 border-l-4 border-l-blue-500 relative overflow-hidden group hover:scale-[1.02] transition-transform">
                <div className="absolute top-0 right-0 p-8 bg-blue-500/5 rounded-bl-full -mr-4 -mt-4 group-hover:bg-blue-500/10 transition-colors"></div>
                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Rendimento</p>
                    <h3 className="text-2xl font-black text-white mt-1">
                      {(() => {
                        const totalRev = raffles.reduce((acc, r) => acc + ((r.soldTickets || 0) * r.price), 0);
                        const totalCost = raffles.reduce((acc, r) => acc + (r.cost || 0), 0);
                        if (totalCost === 0) return '0%';
                        return (((totalRev - totalCost) / totalCost) * 100).toFixed(1) + '%';
                      })()}
                    </h3>
                  </div>
                  <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.1)]"><LayoutDashboard className="w-5 h-5" /></div>
                </div>
              </div>
 
              <div className="glass-card p-5 border-l-4 border-l-purple-500 relative overflow-hidden group hover:scale-[1.02] transition-transform">
                <div className="absolute top-0 right-0 p-8 bg-purple-500/5 rounded-bl-full -mr-4 -mt-4 group-hover:bg-purple-500/10 transition-colors"></div>
                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Rotatividade</p>
                    <h3 className="text-2xl font-black text-white mt-1">
                      {(() => {
                        const activeRaffles = raffles.filter(r => r.status === 'active');
                        if (activeRaffles.length === 0) return '0 vds';
                        const totalSold = activeRaffles.reduce((acc, r) => acc + (r.soldTickets || 0), 0);
                        return (totalSold / activeRaffles.length).toFixed(0) + ' vds';
                      })()}
                    </h3>
                  </div>
                  <div className="p-2 bg-purple-500/10 rounded-xl text-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.1)]"><Users className="w-5 h-5" /></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <div className="glass-card p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-primary" /> Desempenho por Rifa
                </h3>
                <div className="space-y-4">
                  {raffles.map(r => {
                    const rev = (r.soldTickets || 0) * r.price;
                    const profit = rev - (r.cost || 0);
                    const progress = ((r.soldTickets || 0) / r.totalTickets) * 100;
                    return (
                      <div key={r.id} className="p-4 bg-white/5 rounded-xl border border-white/10">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold text-white">{r.title}</span>
                          <span className={`text-xs font-bold px-2 py-1 rounded ${profit >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {profit >= 0 ? '+' : ''} R$ {profit.toFixed(2)}
                          </span>
                        </div>
                        <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden">
                          <div className="bg-primary h-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                        </div>
                        <div className="flex justify-between mt-2 text-[10px] text-gray-500 uppercase font-bold tracking-widest">
                          <span>{r.soldTickets || 0} vendidos</span>
                          <span>{Math.round(progress)}% concluído</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="glass-card p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-500" /> Atividade Recente
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div>
                      <p className="text-sm font-bold text-white">Total de Usuários</p>
                      <p className="text-xs text-gray-500">Base de clientes cadastrados</p>
                    </div>
                    <span className="text-xl font-black text-blue-500">{users.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div>
                      <p className="text-sm font-bold text-white">Rifas em Andamento</p>
                      <p className="text-xs text-gray-500">Aguardando sorteio</p>
                    </div>
                    <span className="text-xl font-black text-primary">{raffles.filter(r => r.status === 'active').length}</span>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg">
                    <p className="text-sm font-bold text-white mb-3">Top Compradores</p>
                    <div className="space-y-2">
                      {users.sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0)).slice(0, 3).map((u, i) => (
                        <div key={u.id} className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">{i + 1}. {u.name || u.email || 'Usuário'}</span>
                          <span className="text-primary font-bold">R$ {(u.totalSpent || 0).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-card p-6 md:col-span-2">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-500" /> Últimas Transações
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-gray-500 uppercase tracking-widest border-b border-white/5">
                        <th className="pb-3">Usuário</th>
                        <th className="pb-3">Valor</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3">Data</th>
                      </tr>
                    </thead>
                    <tbody className="text-white font-bold">
                      {payments.slice(0, 10).map(p => (
                        <tr key={p.id} className="border-b border-white/5">
                          <td className="py-3">{p.payerName || p.userName || 'Anônimo'}</td>
                          <td className="py-3">R$ {p.amount?.toFixed(2)}</td>
                          <td className="py-3">
                            <span className={`px-2 py-1 rounded ${p.status === 'approved' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="py-3">{p.createdAt ? new Date(p.createdAt).toLocaleDateString('pt-BR') : 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'raffles' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Gerenciar Rifas</h1>
                <p className="text-gray-500 text-sm font-medium">Crie, edite e finalize seus sorteios.</p>
              </div>
              <button 
                onClick={() => { setEditingId(null); setFormData(initialFormData); setShowModal(true); }} 
                className="btn-primary py-3 px-6 text-sm shadow-[0_0_20px_rgba(163,230,53,0.2)]"
              >
                <Plus className="w-5 h-5" /> NOVA RIFA
              </button>
            </div>
 
            <div className="grid grid-cols-1 gap-4">
              {raffles.map(raffle => (
                <div key={raffle.id} className="glass-card p-5 flex flex-col md:flex-row items-center gap-6 group hover:border-primary/30 transition-all">
                  <div className="w-full md:w-32 h-24 rounded-xl overflow-hidden border border-white/10 shrink-0">
                    <img src={raffle.image || 'https://picsum.photos/seed/raffle/200/200'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                  </div>
                  
                  <div className="flex-1 space-y-2 text-center md:text-left">
                    <div className="flex flex-col md:flex-row md:items-center gap-2">
                      <h3 className="text-lg font-black text-white uppercase tracking-tighter">{raffle.title}</h3>
                      <span className={`w-fit mx-auto md:mx-0 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                        raffle.status === 'active' ? 'bg-primary/20 text-primary' : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {raffle.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap justify-center md:justify-start gap-4 text-xs font-bold uppercase tracking-widest text-gray-500">
                      <span className="flex items-center gap-1.5"><DollarSign className="w-3 h-3 text-primary" /> R$ {raffle.price.toFixed(2).replace('.', ',')}</span>
                      <span className="flex items-center gap-1.5"><Ticket className="w-3 h-3 text-primary" /> {raffle.soldTickets || 0} / {raffle.totalTickets}</span>
                      <span className="flex items-center gap-1.5"><LayoutDashboard className="w-3 h-3 text-primary" /> {raffle.category}</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-primary h-full rounded-full" style={{ width: `${((raffle.soldTickets || 0) / raffle.totalTickets) * 100}%` }}></div>
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    {raffle.status === 'active' && (
                      <button 
                        onClick={() => { setSelectedRaffleForDraw(raffle); setShowDrawModal(true); }}
                        className="p-3 bg-primary/10 hover:bg-primary text-primary hover:text-black rounded-xl transition-all shadow-lg"
                        title="Realizar Sorteio"
                      >
                        <Trophy className="w-5 h-5" />
                      </button>
                    )}
                    <button onClick={() => handleEdit(raffle)} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-blue-400 transition-all border border-white/5">
                      <Edit className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDelete(raffle.id)} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-red-400 transition-all border border-white/5">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Usuários</h1>
                <p className="text-gray-500 text-sm font-medium">Gerencie sua base de clientes.</p>
              </div>
              <div className="bg-primary/10 px-4 py-2 rounded-xl border border-primary/20">
                <p className="text-[10px] font-black text-primary uppercase tracking-widest">Total de Clientes</p>
                <p className="text-xl font-black text-white">{users.length}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {users.map(user => (
                <div key={user.id} className="glass-card p-5 flex items-center gap-4 group hover:border-primary/30 transition-all">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/10 shrink-0 group-hover:rotate-3 transition-transform">
                    {user.avatar ? (
                      <img src={user.avatar} className="w-full h-full object-cover" alt="avatar" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-transparent">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-white uppercase tracking-tighter truncate">{user.name || 'Usuário Sem Nome'}</h4>
                    <p className="text-xs text-gray-500 truncate mb-2">{user.email}</p>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                        user.role === 'admin' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}>
                        {user.role}
                      </span>
                      <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'winners' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Ganhadores</h1>
                <p className="text-gray-500 text-sm font-medium">Histórico de sorteios realizados.</p>
              </div>
              <div className="bg-yellow-500/10 px-4 py-2 rounded-xl border border-yellow-500/20">
                <p className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">Total de Ganhadores</p>
                <p className="text-xl font-black text-white">{winners.length}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {winners.map((winner, idx) => (
                <div key={idx} className="glass-card p-6 relative overflow-hidden group hover:border-primary/30 transition-all">
                  <div className="absolute top-0 right-0 p-8 bg-primary/5 rounded-bl-full -mr-4 -mt-4 group-hover:bg-primary/10 transition-colors"></div>
                  <div className="flex items-center gap-5 relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center overflow-hidden border-2 border-primary/20 shadow-lg group-hover:scale-110 transition-transform">
                      {winner.userPhoto ? (
                        <img src={winner.userPhoto} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <User className="w-8 h-8 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-white uppercase tracking-tighter text-lg truncate">{winner.userName}</h4>
                      <p className="text-[10px] text-primary font-black uppercase tracking-widest mb-1 truncate">{winner.raffleTitle}</p>
                      <div className="flex items-center gap-2">
                        <span className="bg-primary text-black px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest shadow-sm">
                          COTA #{winner.ticketNumber}
                        </span>
                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                          {winner.createdAt ? new Date(winner.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {winners.length === 0 && (
                <div className="col-span-full py-24 text-center glass-card border-dashed border-white/10">
                  <Trophy className="w-16 h-16 text-gray-700 mx-auto mb-4 opacity-20" />
                  <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">Nenhum ganhador registrado ainda.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8">
              <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Configurações Globais</h1>
              <p className="text-gray-500 text-sm font-medium">Personalize imagens e textos do site.</p>
            </div>

            <form onSubmit={handleSaveSettings} className="glass-card p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Mercado Pago Image */}
                <div className="space-y-4">
                  <label className="block text-sm font-black text-white uppercase tracking-widest">Selo Mercado Pago (Rodapé)</label>
                  <div className="flex flex-col gap-4">
                    {globalSettings.mercadoPagoImage ? (
                      <img src={globalSettings.mercadoPagoImage} alt="Mercado Pago" className="h-12 object-contain bg-white/5 p-2 rounded-lg border border-white/10" />
                    ) : (
                      <div className="h-12 bg-white/5 rounded-lg border border-dashed border-white/10 flex items-center justify-center text-[10px] text-gray-500 font-bold uppercase tracking-widest">Sem Imagem</div>
                    )}
                    <div className="relative">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => handleSettingsImageUpload(e, 'mercadoPagoImage')}
                        disabled={uploadingImage}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className={`glass-input w-full flex flex-col items-center justify-center gap-2 py-4 ${uploadingImage ? 'opacity-50' : ''}`}>
                        <div className="flex items-center gap-2">
                          <Upload className="w-4 h-4" />
                          {uploadingImage ? 'Enviando...' : 'Trocar Imagem Mercado Pago'}
                        </div>
                        {uploadingImage && (
                          <div className="w-full max-w-[150px] bg-white/5 h-1 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${uploadProgress}%` }}
                              className="bg-primary h-full"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hero Badge Image */}
                <div className="space-y-4">
                  <label className="block text-sm font-black text-white uppercase tracking-widest">Imagem de Destaque (Prêmios Incríveis)</label>
                  <div className="flex flex-col gap-4">
                    {globalSettings.heroBadgeImage ? (
                      <img src={globalSettings.heroBadgeImage} alt="Hero Badge" className="h-20 object-contain bg-white/5 p-2 rounded-lg border border-white/10" />
                    ) : (
                      <div className="h-20 bg-white/5 rounded-lg border border-dashed border-white/10 flex items-center justify-center text-[10px] text-gray-500 font-bold uppercase tracking-widest">Sem Imagem</div>
                    )}
                    <div className="relative">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => handleSettingsImageUpload(e, 'heroBadgeImage')}
                        disabled={uploadingImage}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className={`glass-input w-full flex flex-col items-center justify-center gap-2 py-4 ${uploadingImage ? 'opacity-50' : ''}`}>
                        <div className="flex items-center gap-2">
                          <Upload className="w-4 h-4" />
                          {uploadingImage ? 'Enviando...' : 'Trocar Imagem de Destaque'}
                        </div>
                        {uploadingImage && (
                          <div className="w-full max-w-[150px] bg-white/5 h-1 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${uploadProgress}%` }}
                              className="bg-primary h-full"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-black text-white uppercase tracking-widest">Texto "Como Funciona"</label>
                <textarea 
                  value={globalSettings.howItWorksText}
                  onChange={(e) => setGlobalSettings({...globalSettings, howItWorksText: e.target.value})}
                  className="glass-input w-full h-32 resize-none"
                  placeholder="Explique como funciona o sistema..."
                />
              </div>

              <div className="flex justify-end">
                <button type="submit" disabled={savingSettings} className="btn-primary px-8 py-3">
                  {savingSettings ? 'Salvando...' : 'Salvar Todas as Configurações'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
      
      {/* Admin Sections Drawers */}
      <AnimatePresence>
        {activeDrawer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveDrawer(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full max-w-4xl bg-[#0A0A0A] border-l border-white/10 z-[90] shadow-2xl overflow-y-auto"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
                      {activeDrawer === 'raffles' && 'Gerenciar Rifas'}
                      {activeDrawer === 'users' && 'Usuários'}
                      {activeDrawer === 'winners' && 'Ganhadores'}
                      {activeDrawer === 'settings' && 'Configurações'}
                    </h2>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">
                      {activeDrawer === 'raffles' && 'Crie, edite e finalize seus sorteios'}
                      {activeDrawer === 'users' && 'Gerencie sua base de clientes'}
                      {activeDrawer === 'winners' && 'Galeria de vencedores'}
                      {activeDrawer === 'settings' && 'Personalize sua plataforma'}
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveDrawer(null)}
                    className="p-2 hover:bg-white/5 rounded-xl transition-colors text-gray-400 hover:text-white"
                  >
                    <X className="w-8 h-8" />
                  </button>
                </div>

                {activeDrawer === 'raffles' && (
                  <div className="space-y-8">
                    <div className="flex justify-end">
                      <button 
                        onClick={() => { setEditingId(null); setFormData(initialFormData); setShowModal(true); }} 
                        className="btn-primary py-3 px-6 text-sm shadow-[0_0_20px_rgba(163,230,53,0.2)]"
                      >
                        <Plus className="w-5 h-5" /> NOVA RIFA
                      </button>
                    </div>
        
                    <div className="grid grid-cols-1 gap-4">
                      {raffles.map(raffle => (
                        <div key={raffle.id} className="glass-card p-5 flex flex-col md:flex-row items-center gap-6 group hover:border-primary/30 transition-all">
                          <div className="w-full md:w-32 h-24 rounded-xl overflow-hidden border border-white/10 shrink-0">
                            <img src={raffle.image || 'https://picsum.photos/seed/raffle/200/200'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                          </div>
                          
                          <div className="flex-1 space-y-2 text-center md:text-left">
                            <div className="flex flex-col md:flex-row md:items-center gap-2">
                              <h3 className="text-lg font-black text-white uppercase tracking-tighter">{raffle.title}</h3>
                              <span className={`w-fit mx-auto md:mx-0 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                                raffle.status === 'active' ? 'bg-primary/20 text-primary' : 'bg-gray-500/20 text-gray-400'
                              }`}>
                                {raffle.status}
                              </span>
                            </div>
                            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-xs font-bold uppercase tracking-widest text-gray-500">
                              <span className="flex items-center gap-1.5"><DollarSign className="w-3 h-3 text-primary" /> R$ {raffle.price.toFixed(2).replace('.', ',')}</span>
                              <span className="flex items-center gap-1.5"><Ticket className="w-3 h-3 text-primary" /> {raffle.soldTickets || 0} / {raffle.totalTickets}</span>
                              <span className="flex items-center gap-1.5"><LayoutDashboard className="w-3 h-3 text-primary" /> {raffle.category}</span>
                            </div>
                            <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-primary h-full rounded-full" style={{ width: `${((raffle.soldTickets || 0) / raffle.totalTickets) * 100}%` }}></div>
                            </div>
                          </div>

                          <div className="flex gap-2 shrink-0">
                            {raffle.status === 'active' && (
                              <button 
                                onClick={() => { setSelectedRaffleForDraw(raffle); setShowDrawModal(true); }}
                                className="p-3 bg-primary/10 hover:bg-primary text-primary hover:text-black rounded-xl transition-all shadow-lg"
                                title="Realizar Sorteio"
                              >
                                <Trophy className="w-5 h-5" />
                              </button>
                            )}
                            <button onClick={() => handleEdit(raffle)} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-blue-400 transition-all border border-white/5">
                              <Edit className="w-5 h-5" />
                            </button>
                            <button onClick={() => handleDelete(raffle.id)} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-red-400 transition-all border border-white/5">
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeDrawer === 'users' && (
                  <div className="space-y-4">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Buscar usuário por nome, email, telefone ou CPF..."
                        value={userSearchTerm}
                        onChange={(e) => setUserSearchTerm(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {users.filter(u => 
                        u.name?.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
                        u.email?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                        u.phone?.includes(userSearchTerm) ||
                        u.cpf?.includes(userSearchTerm)
                      ).map(user => (
                        <div key={user.id} className="glass-card p-4 flex items-center justify-between group hover:border-primary/30 transition-all">
                          <div className="flex items-center gap-4">
                            <img src={user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.id} className="w-12 h-12 rounded-full border-2 border-white/10" alt="" />
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-black text-white uppercase tracking-tighter">{user.name}</p>
                                {user.role === 'admin' && (
                                  <span className="px-2 py-0.5 bg-primary/20 text-primary text-[10px] font-bold rounded-full uppercase tracking-widest">Admin</span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 font-bold">{user.email}</p>
                              {user.phone && <p className="text-xs text-gray-400 mt-1">{user.phone}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => {
                                setEditingUser(user);
                                setShowUserModal(true);
                              }}
                              className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeDrawer === 'winners' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      {winners.map((winner, idx) => (
                        <div key={idx} className="glass-card p-4 flex items-center justify-between group hover:border-primary/30 transition-all">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                              <Trophy className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                              <p className="font-black text-white uppercase tracking-tighter">{winner.userName}</p>
                              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Ganhou: {winner.raffleTitle}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-black text-primary tracking-tighter">#{winner.ticketNumber}</p>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{new Date(winner.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeDrawer === 'settings' && (
                  <form onSubmit={handleSaveSettings} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <h3 className="text-lg font-black text-white uppercase tracking-tighter border-b border-white/5 pb-2">Informações Gerais</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Nome do Site</label>
                            <input 
                              type="text" 
                              value={globalSettings.siteName}
                              onChange={(e) => setGlobalSettings({...globalSettings, siteName: e.target.value})}
                              className="glass-input w-full"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">WhatsApp de Suporte</label>
                            <input 
                              type="text" 
                              value={globalSettings.whatsapp}
                              onChange={(e) => setGlobalSettings({...globalSettings, whatsapp: e.target.value})}
                              className="glass-input w-full"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Instagram</label>
                            <input 
                              type="text" 
                              value={globalSettings.instagram}
                              onChange={(e) => setGlobalSettings({...globalSettings, instagram: e.target.value})}
                              className="glass-input w-full"
                            />
                          </div>
                          <div className="pt-4">
                            <button 
                              type="button"
                              onClick={downloadLogoAsPNG}
                              className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-[10px] font-black text-white uppercase tracking-widest transition-all"
                            >
                              <Download className="w-4 h-4 text-primary" /> Baixar Logo (PNG)
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <h3 className="text-lg font-black text-white uppercase tracking-tighter border-b border-white/5 pb-2">Pagamentos (Mercado Pago)</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Access Token</label>
                            <input 
                              type="password" 
                              value={globalSettings.mercadoPagoToken}
                              onChange={(e) => setGlobalSettings({...globalSettings, mercadoPagoToken: e.target.value})}
                              className="glass-input w-full"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Public Key</label>
                            <input 
                              type="text" 
                              value={globalSettings.mercadoPagoPublicKey}
                              onChange={(e) => setGlobalSettings({...globalSettings, mercadoPagoPublicKey: e.target.value})}
                              className="glass-input w-full"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Texto "Como Funciona"</label>
                      <textarea 
                        value={globalSettings.howItWorksText}
                        onChange={(e) => setGlobalSettings({...globalSettings, howItWorksText: e.target.value})}
                        className="glass-input w-full h-32 resize-none"
                      />
                    </div>

                    <div className="space-y-6 pt-6 border-t border-white/5">
                      <h3 className="text-lg font-black text-white uppercase tracking-tighter">Exibição na Home</h3>
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                          <button 
                            type="button"
                            onClick={() => setGlobalSettings({...globalSettings, showCategories: !globalSettings.showCategories})}
                            className={`w-12 h-6 rounded-full transition-all relative ${globalSettings.showCategories ? 'bg-primary' : 'bg-white/10'}`}
                          >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${globalSettings.showCategories ? 'left-7' : 'left-1'}`}></div>
                          </button>
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Mostrar Categorias na Home</span>
                        </div>

                        <div className="flex items-center gap-3">
                          <button 
                            type="button"
                            onClick={() => setGlobalSettings({...globalSettings, showTestimonials: !globalSettings.showTestimonials})}
                            className={`w-12 h-6 rounded-full transition-all relative ${globalSettings.showTestimonials ? 'bg-primary' : 'bg-white/10'}`}
                          >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${globalSettings.showTestimonials ? 'left-7' : 'left-1'}`}></div>
                          </button>
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Mostrar Depoimentos na Home</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6 pt-6 border-t border-white/5">
                      <h3 className="text-lg font-black text-red-500 uppercase tracking-tighter">Zona de Perigo</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button 
                          type="button"
                          onClick={() => { setResetType('data'); setShowResetConfirm(true); }}
                          className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-left hover:bg-red-500/20 transition-all group"
                        >
                          <Trash2 className="w-6 h-6 text-red-500 mb-2 group-hover:scale-110 transition-transform" />
                          <p className="text-xs font-black text-white uppercase tracking-tight">Limpar Dados de Vendas</p>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Apaga tickets, pagamentos e ganhadores. Mantém usuários e rifas.</p>
                        </button>
                        <button 
                          type="button"
                          onClick={() => { setResetType('all'); setShowResetConfirm(true); }}
                          className="p-4 bg-red-500/20 border border-red-500/40 rounded-2xl text-left hover:bg-red-500/30 transition-all group"
                        >
                          <ShieldAlert className="w-6 h-6 text-red-500 mb-2 group-hover:scale-110 transition-transform" />
                          <p className="text-xs font-black text-white uppercase tracking-tight">Resetar Tudo (0)</p>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Apaga ABSOLUTAMENTE TUDO do banco de dados.</p>
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-end pt-6 border-t border-white/5">
                      <button type="submit" disabled={savingSettings} className="btn-primary px-12 py-4 text-sm font-black uppercase tracking-widest shadow-xl shadow-primary/20">
                        {savingSettings ? 'SALVANDO...' : 'SALVAR CONFIGURAÇÕES'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Drawer CRUD (Raffle Create/Edit) */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[150]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-2xl bg-[#0a0a0a] border-l border-white/10 z-[160] shadow-2xl overflow-y-auto"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-10">
                  <div>
                    <h2 className="text-3xl font-black text-primary uppercase tracking-tighter">
                      {editingId ? 'Editar Rifa' : 'Criar Nova Rifa'}
                    </h2>
                    <p className="text-gray-500 text-xs font-black uppercase tracking-widest mt-1">Configurações Detalhadas do Sorteio</p>
                  </div>
                  <button 
                    onClick={() => setShowModal(false)}
                    className="p-3 hover:bg-white/5 rounded-xl transition-colors text-gray-500 hover:text-white border border-white/5"
                  >
                    <X className="w-8 h-8" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="md:col-span-2">
                      <div className="flex justify-between items-end mb-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Título da Rifa</label>
                        <button 
                          type="button" 
                          onClick={generateAIContent}
                          disabled={isGenerating}
                          className="text-[10px] font-black text-primary flex items-center gap-1.5 hover:opacity-80 transition disabled:opacity-50 bg-primary/5 px-3 py-1.5 rounded-full border border-primary/10"
                        >
                          <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                          {isGenerating ? 'GERANDO...' : 'GERAR COM IA PREMIUM'}
                        </button>
                      </div>
                      <input 
                        type="text" required value={formData.title}
                        onChange={e => setFormData({...formData, title: e.target.value})}
                        className="glass-input w-full py-4 text-lg" placeholder="Ex: iPhone 15 Pro Max"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Descrição / Regulamento</label>
                      <textarea 
                        required value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                        className="glass-input w-full h-40 resize-none py-4" 
                        placeholder="Detalhes do prêmio, regras do sorteio..."
                      ></textarea>
                    </div>

                    <div className="md:col-span-2 p-6 bg-white/5 rounded-2xl border border-white/10 space-y-4">
                      <h3 className="text-sm font-black text-white uppercase tracking-tighter">Configurações de Expansão Automática</h3>
                      <div className="flex items-center gap-2">
                        <input 
                          type="checkbox" checked={formData.autoExpand}
                          onChange={e => setFormData({...formData, autoExpand: e.target.checked})}
                          className="w-5 h-5"
                        />
                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Ativar Expansão Automática</label>
                      </div>
                      {formData.autoExpand && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Novas Cotas por Expansão</label>
                            <input 
                              type="number" required value={formData.extraTicketsPerExpansion || ''}
                              onChange={e => setFormData({...formData, extraTicketsPerExpansion: e.target.value})}
                              className="glass-input w-full py-4" placeholder="Ex: 1000"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Novas Cotas Premiadas por Expansão</label>
                            <input 
                              type="number" required value={formData.extraWinningTicketsPerExpansion || ''}
                              onChange={e => setFormData({...formData, extraWinningTicketsPerExpansion: e.target.value})}
                              className="glass-input w-full py-4" placeholder="Ex: 5"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Meta de Arrecadação (R$)</label>
                      <input 
                        type="number" step="0.01" required value={formData.targetRevenue || ''}
                        onChange={e => setFormData({...formData, targetRevenue: e.target.value})}
                        className="glass-input w-full py-4" placeholder="Ex: 1000.00"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Custo da Rifa (R$)</label>
                      <input 
                        type="number" step="0.01" required value={formData.cost || ''}
                        onChange={e => setFormData({...formData, cost: e.target.value})}
                        className="glass-input w-full py-4" placeholder="Ex: 1500.00"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Preço por Número (R$)</label>
                      <input 
                        type="number" step="0.01" required value={formData.price || ''}
                        onChange={e => setFormData({...formData, price: e.target.value})}
                        className="glass-input w-full py-4" placeholder="0.50"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Total de Números</label>
                      <input 
                        type="number" required value={formData.totalTickets || ''}
                        onChange={e => setFormData({...formData, totalTickets: e.target.value})}
                        className="glass-input w-full py-4" placeholder="10000"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Data do Sorteio (Opcional)</label>
                      <input 
                        type="datetime-local" value={formData.drawDate}
                        onChange={e => setFormData({...formData, drawDate: e.target.value})}
                        className="glass-input w-full py-4"
                      />
                    </div>

                    <div className="flex items-center gap-3 pt-4">
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, isFeatured: !formData.isFeatured})}
                        className={`w-12 h-6 rounded-full transition-all relative ${formData.isFeatured ? 'bg-primary' : 'bg-white/10'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.isFeatured ? 'left-7' : 'left-1'}`}></div>
                      </button>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Destaque (Mais Escolhido)</span>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Categoria</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={formData.category}
                          onChange={e => setFormData({...formData, category: e.target.value})}
                          className="glass-input flex-1 py-4"
                          placeholder="Ex: Eletrônicos"
                          list="categories"
                        />
                        <datalist id="categories">
                          <option value="Eletrônicos" />
                          <option value="Veículos" />
                          <option value="Dinheiro" />
                          <option value="Outros" />
                        </datalist>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Imagem de Capa</label>
                      <div className="flex flex-col sm:flex-row gap-6 items-start">
                        {formData.image && (
                          <div className="w-full sm:w-32 h-32 rounded-2xl overflow-hidden border-2 border-primary/20 shadow-xl shadow-primary/5 shrink-0 bg-black/20">
                            <img src={formData.image} alt="Preview" className="w-full h-full object-contain" />
                          </div>
                        )}
                        <div className="flex-1 w-full space-y-4">
                          <div className="relative">
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={handleImageUpload}
                              disabled={uploadingImage}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                            />
                            <div className={`glass-input w-full flex flex-col items-center justify-center gap-3 py-6 border-dashed border-2 border-white/10 hover:border-primary/50 transition-all ${uploadingImage ? 'opacity-50' : ''}`}>
                              <div className="flex items-center gap-3">
                                <Upload className="w-6 h-6 text-primary" />
                                <span className="text-sm font-black uppercase tracking-widest">
                                  {uploadingImage ? 'Enviando...' : 'Carregar Imagem'}
                                </span>
                              </div>
                              {uploadingImage && (
                                <div className="w-full max-w-[200px] bg-white/5 h-1.5 rounded-full overflow-hidden">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${uploadProgress}%` }}
                                    className="bg-primary h-full"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest whitespace-nowrap">ou URL:</span>
                            <input 
                              type="url" value={formData.image}
                              onChange={e => setFormData({...formData, image: e.target.value})}
                              className="glass-input flex-1 text-xs py-2 px-3" placeholder="https://..."
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Status da Rifa</label>
                      <select 
                        value={formData.status}
                        onChange={e => setFormData({...formData, status: e.target.value})}
                        className="glass-input w-full py-4 appearance-none"
                      >
                        <option value="active">Ativa (Visível e vendendo)</option>
                        <option value="draft">Rascunho (Oculta)</option>
                        <option value="finished">Finalizada (Sorteio realizado)</option>
                      </select>
                    </div>

                    <div className="md:col-span-2 space-y-4">
                      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">Cotas Premiadas</label>
                      <div className="space-y-2">
                        {formData.winningTickets.map((wt: any, index: number) => (
                          <div key={index} className="flex items-center gap-2 bg-white/5 p-2 rounded-lg">
                            <span className="text-sm text-white font-bold">#{wt.number}</span>
                            <span className="text-sm text-primary font-bold">R$ {wt.prize}</span>
                            <button 
                              type="button" 
                              onClick={() => setFormData({...formData, winningTickets: formData.winningTickets.filter((_: any, i: number) => i !== index)})}
                              className="ml-auto text-red-400 hover:text-red-300"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input 
                          type="number" placeholder="Número"
                          className="glass-input flex-1 py-2"
                          id="new-wt-number"
                        />
                        <input 
                          type="number" placeholder="Prêmio (R$)"
                          className="glass-input flex-1 py-2"
                          id="new-wt-prize"
                        />
                        <button 
                          type="button"
                          onClick={async () => {
                            const numberInput = document.getElementById('new-wt-number') as HTMLInputElement;
                            const prizeInput = document.getElementById('new-wt-prize') as HTMLInputElement;
                            const number = parseInt(numberInput.value);
                            const prize = parseFloat(prizeInput.value);
                            
                            if (number && prize) {
                              const totalTickets = parseInt(formData.totalTickets || '1000');
                              if (number < 1 || number > totalTickets) {
                                toast.error(`O número deve estar entre 1 e ${totalTickets}`);
                                return;
                              }

                              if (formData.winningTickets.some((wt: any) => wt.number === number)) {
                                toast.error('Este número já é uma cota premiada!');
                                return;
                              }

                              if (editingId) {
                                const q = query(collection(db, 'tickets'), where('raffleId', '==', editingId), where('number', '==', number));
                                const snapshot = await getDocs(q);
                                if (!snapshot.empty) {
                                  toast.error('Este número já foi comprado!');
                                  return;
                                }
                              }

                              setFormData({...formData, winningTickets: [...formData.winningTickets, { number, prize }]});
                              numberInput.value = '';
                              prizeInput.value = '';
                            }
                          }}
                          className="btn-primary py-2 px-4"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          <input 
                            type="number" 
                            id="ai-wt-qty"
                            placeholder="Qtd de Cotas" 
                            className="glass-input flex-1 text-sm"
                          />
                          <input 
                            type="number" 
                            id="ai-wt-prize"
                            placeholder="Valor do Prêmio (R$)" 
                            className="glass-input flex-1 text-sm"
                          />
                        </div>
                        <button 
                          type="button"
                          onClick={async () => {
                            const qtyInput = document.getElementById('ai-wt-qty') as HTMLInputElement;
                            const prizeInput = document.getElementById('ai-wt-prize') as HTMLInputElement;
                            const qty = parseInt(qtyInput.value);
                            const prize = parseFloat(prizeInput.value);
                            
                            if (!qty || !prize || qty <= 0 || prize <= 0) {
                              toast.error('Preencha a quantidade e o valor corretamente.');
                              return;
                            }

                            const totalTickets = parseInt(formData.totalTickets || '1000');
                            let soldNumbers: number[] = [];
                            
                            if (editingId) {
                              const q = query(collection(db, 'tickets'), where('raffleId', '==', editingId));
                              const snapshot = await getDocs(q);
                              soldNumbers = snapshot.docs.map(doc => doc.data().number);
                            }

                            const existingWinningNumbers = formData.winningTickets.map((wt: any) => wt.number);
                            const unavailableNumbers = new Set([...soldNumbers, ...existingWinningNumbers]);

                            const newTickets = [];
                            let attempts = 0;
                            
                            while(newTickets.length < qty && attempts < 100000) {
                              const randomNum = Math.floor(Math.random() * totalTickets) + 1;
                              if (!unavailableNumbers.has(randomNum)) {
                                newTickets.push({ number: randomNum, prize });
                                unavailableNumbers.add(randomNum);
                              }
                              attempts++;
                            }

                            if (newTickets.length < qty) {
                              toast.error('Não foi possível gerar todas as cotas (falta de números disponíveis).');
                            }

                            setFormData({...formData, winningTickets: [...formData.winningTickets, ...newTickets]});
                            qtyInput.value = '';
                            prizeInput.value = '';
                            toast.success(`${newTickets.length} cotas premiadas geradas!`);
                          }}
                          className="w-full py-2 bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-primary/20 transition"
                        >
                          <Sparkles className="w-4 h-4 inline mr-2" /> Gerar Cotas Premiadas Aleatórias
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 mt-12 pt-8 border-t border-white/5">
                    <button type="submit" className="btn-primary w-full py-5 text-base font-black uppercase tracking-widest shadow-2xl shadow-primary/20">
                      {editingId ? 'SALVAR ALTERAÇÕES' : 'PUBLICAR RIFA'}
                    </button>
                    <button type="button" onClick={() => setShowModal(false)} className="btn-outline w-full py-5 text-base font-black uppercase tracking-widest">
                      CANCELAR
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Drawer Draw (Raffle Draw) */}
      <AnimatePresence>
        {showDrawModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDrawModal(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[150]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-[#0a0a0a] border-l border-white/10 z-[160] shadow-2xl overflow-y-auto"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-10">
                  <h2 className="text-3xl font-black text-primary uppercase tracking-tighter flex items-center gap-3">
                    <Trophy className="w-8 h-8" /> Sorteio
                  </h2>
                  <button 
                    onClick={() => setShowDrawModal(false)}
                    className="p-3 hover:bg-white/5 rounded-xl transition-colors text-gray-500 hover:text-white border border-white/5"
                  >
                    <X className="w-8 h-8" />
                  </button>
                </div>

                <div className="glass-card p-6 mb-8 border-primary/20 bg-primary/5">
                  <p className="text-gray-300 text-sm font-medium leading-relaxed">
                    Insira o número sorteado (ex: da Loteria Federal) para identificar o ganhador da rifa:
                  </p>
                  <p className="text-white text-xl font-black uppercase tracking-tighter mt-2">{selectedRaffleForDraw?.title}</p>
                </div>
                
                <div className="space-y-8">
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Número Sorteado</label>
                    <input 
                      type="number" 
                      value={drawNumber}
                      onChange={e => setDrawNumber(e.target.value)}
                      className="glass-input w-full text-center text-6xl font-black text-primary py-10 shadow-inner"
                      placeholder="00000"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-4 pt-6">
                    <button 
                      onClick={handleDraw} 
                      disabled={isDrawing || !drawNumber}
                      className="btn-primary w-full py-5 text-base font-black uppercase tracking-widest shadow-2xl shadow-primary/20"
                    >
                      {isDrawing ? 'SORTEANDO...' : 'CONFIRMAR GANHADOR'}
                    </button>
                    <button onClick={() => setShowDrawModal(false)} className="btn-outline w-full py-5 text-base font-black uppercase tracking-widest">CANCELAR</button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* Modal de Confirmação de Exclusão */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setShowDeleteConfirm(false); setRaffleToDelete(null); }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 m-auto w-full max-w-sm h-fit bg-[#0a0a0a] border border-white/10 p-8 rounded-3xl z-[210] shadow-2xl"
            >
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto border border-red-500/20">
                  <Trash2 className="w-8 h-8 text-red-500" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter">Excluir Rifa?</h3>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-2">Esta ação é irreversível e apagará todos os dados vinculados.</p>
                </div>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={confirmDelete}
                    className="w-full py-4 bg-red-500 hover:bg-red-600 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-red-500/20"
                  >
                    SIM, EXCLUIR AGORA
                  </button>
                  <button
                    onClick={() => { setShowDeleteConfirm(false); setRaffleToDelete(null); }}
                    className="w-full py-4 bg-white/5 hover:bg-white/10 text-gray-400 font-black uppercase tracking-widest rounded-xl transition-all"
                  >
                    CANCELAR
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* User Modal */}
      <AnimatePresence>
        {showUserModal && editingUser && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setShowUserModal(false); setEditingUser(null); }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 m-auto w-full max-w-md h-fit bg-[#0a0a0a] border border-white/10 p-6 rounded-3xl z-[210] shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-white uppercase tracking-tighter">Editar Usuário</h3>
                <button onClick={() => { setShowUserModal(false); setEditingUser(null); }} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Nome</label>
                  <input
                    type="text"
                    value={editingUser.name}
                    onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Email</label>
                  <input
                    type="email"
                    value={editingUser.email}
                    onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Telefone</label>
                  <input
                    type="text"
                    value={editingUser.phone || ''}
                    onChange={e => setEditingUser({ ...editingUser, phone: e.target.value })}
                    placeholder="(00) 00000-0000"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">CPF</label>
                  <input
                    type="text"
                    value={editingUser.cpf || ''}
                    onChange={e => setEditingUser({ ...editingUser, cpf: e.target.value })}
                    placeholder="000.000.000-00"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Permissão</label>
                  <select
                    value={editingUser.role}
                    onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors appearance-none"
                  >
                    <option value="user" className="bg-[#0a0a0a]">Usuário Comum</option>
                    <option value="admin" className="bg-[#0a0a0a]">Administrador</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-primary text-black font-black uppercase tracking-widest rounded-xl hover:bg-primary/90 transition-all active:scale-[0.98] mt-6"
                >
                  Salvar Alterações
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal de Confirmação de Reset */}
      <AnimatePresence>
        {showResetConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { if (!isResetting) setShowResetConfirm(false); }}
              className="fixed inset-0 bg-black/90 backdrop-blur-md z-[300]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 m-auto w-full max-w-sm h-fit bg-[#0a0a0a] border border-red-500/30 p-8 rounded-3xl z-[310] shadow-2xl"
            >
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto border border-red-500/40 animate-pulse">
                  <ShieldAlert className="w-8 h-8 text-red-500" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter">Confirmar Reset?</h3>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-2">
                    {resetType === 'all' 
                      ? 'Você está prestes a apagar TODOS os dados da plataforma. Esta ação não pode ser desfeita.' 
                      : 'Você vai apagar todos os registros de vendas, tickets e ganhadores. As rifas e usuários serão mantidos.'}
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleReset}
                    disabled={isResetting}
                    className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-red-600/20 disabled:opacity-50"
                  >
                    {isResetting ? 'RESETANDO...' : 'SIM, TENHO CERTEZA'}
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    disabled={isResetting}
                    className="w-full py-4 bg-white/5 hover:bg-white/10 text-gray-400 font-black uppercase tracking-widest rounded-xl transition-all disabled:opacity-50"
                  >
                    CANCELAR
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
