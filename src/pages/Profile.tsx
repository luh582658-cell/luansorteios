import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db, logOut } from '../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { User, Phone, Mail, FileText, Shield, Info, LogOut, Ticket, ChevronRight, Edit2, Save, X, Camera } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    photoURL: '',
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        navigate('/login');
        return;
      }
      setUser(currentUser);
      
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
          setFormData({
            name: data.name || currentUser.displayName || '',
            phone: data.phone || '',
            photoURL: data.photoURL || currentUser.photoURL || '',
          });
        } else {
          setFormData({
            name: currentUser.displayName || '',
            phone: '',
            photoURL: currentUser.photoURL || '',
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 400;
          const MAX_HEIGHT = 400;
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
          
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          
          await updateDoc(doc(db, 'users', user.uid), {
            photoURL: dataUrl
          });
          
          setFormData(prev => ({ ...prev, photoURL: dataUrl }));
          setUserData(prev => ({ ...prev, photoURL: dataUrl }));
          setUploadingImage(false);
          toast.success('Foto de perfil atualizada!');
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erro ao atualizar foto.');
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        name: formData.name,
        phone: formData.phone,
      });
      setUserData({ ...userData, name: formData.name, phone: formData.phone });
      setIsEditing(false);
      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Erro ao atualizar perfil.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logOut();
      navigate('/');
    } catch (error) {
      toast.error('Erro ao sair da conta.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      
      {/* Header / User Info */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 sm:p-8 relative overflow-hidden border-primary/20"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full -mr-32 -mt-32 blur-[80px] pointer-events-none"></div>
        
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary/30 shadow-[0_0_20px_rgba(163,230,53,0.15)] shrink-0 bg-white/5 relative">
              {formData.photoURL ? (
                <img src={formData.photoURL} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-10 h-10 text-gray-400" />
                </div>
              )}
              {uploadingImage && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              )}
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-2 bg-primary text-black rounded-full shadow-lg hover:scale-110 transition-transform"
              disabled={uploadingImage}
            >
              <Camera className="w-4 h-4" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleImageUpload}
            />
          </div>
          
          <div className="flex-1 w-full text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl font-black text-white uppercase tracking-tighter">{userData?.name || 'Usuário'}</h1>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-1 flex items-center justify-center sm:justify-start gap-1.5">
                  <Mail className="w-3 h-3 text-primary" /> {user?.email}
                </p>
              </div>
              
              {!isEditing && (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="btn-outline py-2 px-4 text-[10px] flex items-center justify-center gap-2 mx-auto sm:mx-0"
                >
                  <Edit2 className="w-3 h-3" /> EDITAR PERFIL
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-4 mt-4 bg-white/5 p-4 rounded-xl border border-white/10">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Nome Completo</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="glass-input w-full text-sm"
                    placeholder="Seu nome"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Telefone / WhatsApp</label>
                  <input 
                    type="text" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="glass-input w-full text-sm"
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="btn-primary flex-1 py-2.5 text-[10px]"
                  >
                    {saving ? 'SALVANDO...' : <><Save className="w-3 h-3" /> SALVAR</>}
                  </button>
                  <button 
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({ name: userData?.name || '', phone: userData?.phone || '' });
                    }}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 transition-colors border border-white/10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex flex-col gap-2">
                {userData?.phone && (
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-sm text-gray-300">
                    <Phone className="w-4 h-4 text-primary" />
                    <span className="font-mono">{userData.phone}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 gap-3">
        <Link to="/dashboard" className="glass-card p-4 flex items-center justify-between hover:bg-white/[0.03] transition-colors border-white/5 group">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Minhas Cotas</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Veja seus bilhetes e histórico</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-primary transition-colors" />
        </Link>

        <Link to="/guidelines" className="glass-card p-4 flex items-center justify-between hover:bg-white/[0.03] transition-colors border-white/5 group">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-white group-hover:scale-110 transition-all">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Termos e Condições</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Regras de uso da plataforma</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" />
        </Link>

        <Link to="/privacy" className="glass-card p-4 flex items-center justify-between hover:bg-white/[0.03] transition-colors border-white/5 group">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-white group-hover:scale-110 transition-all">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Política de Privacidade</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Como tratamos seus dados</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" />
        </Link>

        <Link to="/about" className="glass-card p-4 flex items-center justify-between hover:bg-white/[0.03] transition-colors border-white/5 group">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-white group-hover:scale-110 transition-all">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Sobre o App</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Informações da plataforma</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" />
        </Link>
      </div>

      {/* Logout Button */}
      <button 
        onClick={handleLogout}
        className="w-full glass-card p-4 flex items-center justify-center gap-2 hover:bg-red-500/10 border-white/5 hover:border-red-500/30 text-red-400 transition-all group mt-8"
      >
        <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-xs font-black uppercase tracking-widest">Sair da Conta</span>
      </button>

    </div>
  );
}
