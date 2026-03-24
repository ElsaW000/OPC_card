import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  ChevronRight, 
  Star, 
  MoreHorizontal, 
  Edit3, 
  Copy, 
  Share2, 
  Trash2,
  CheckCircle2,
  ExternalLink,
  Smartphone,
  Briefcase,
  Users
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

interface IdentityCard {
  id: string;
  type: 'tech' | 'biz' | 'social' | 'custom';
  title: string;
  name: string;
  role: string;
  company?: string;
  avatar: string;
  isDefault: boolean;
  color: string;
  bgImage: string;
}

const MOCK_CARDS: IdentityCard[] = [
  {
    id: '1',
    type: 'tech',
    title: '技术开发名片',
    name: '陈小独立',
    role: 'Full-stack Developer',
    company: 'CodeFlow AI Studio',
    avatar: 'https://images.unsplash.com/photo-1701463387028-3947648f1337?w=400',
    isDefault: true,
    color: 'from-blue-600 to-indigo-700',
    bgImage: 'https://images.unsplash.com/photo-1647247743538-0137d6a8a268?w=800'
  },
  {
    id: '2',
    type: 'biz',
    title: '商务合作名片',
    name: 'Independent Chen',
    role: 'Founder & CEO',
    company: 'One Person Company Ltd.',
    avatar: 'https://images.unsplash.com/photo-1701463387028-3947648f1337?w=400',
    isDefault: false,
    color: 'from-slate-800 to-slate-900',
    bgImage: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=800'
  },
  {
    id: '3',
    type: 'social',
    title: '个人社交名片',
    name: '阿力',
    role: '摄影爱好者 / 徒步玩家',
    avatar: 'https://images.unsplash.com/photo-1701463387028-3947648f1337?w=400',
    isDefault: false,
    color: 'from-emerald-500 to-teal-600',
    bgImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800'
  }
];

export const MyCardsPage: React.FC = () => {
  const navigate = useNavigate();
  const [cards, setCards] = useState<IdentityCard[]>(MOCK_CARDS);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  const handleSetDefault = (id: string) => {
    setCards(prev => prev.map(card => ({
      ...card,
      isDefault: card.id === id
    })));
    toast.success('已设为默认名片');
  };

  const handleDelete = (id: string) => {
    if (cards.length <= 1) {
      toast.error('至少需要保留一张名片');
      return;
    }
    setCards(prev => prev.filter(card => card.id !== id));
    toast.success('名片已删除');
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'tech': return <Smartphone className="w-4 h-4" />;
      case 'biz': return <Briefcase className="w-4 h-4" />;
      case 'social': return <Users className="w-4 h-4" />;
      default: return <Star className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl px-6 py-6 flex items-center justify-between border-b border-gray-100">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">我的名片</h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Multi-Identity Management</p>
        </div>
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/edit')}
          className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200"
        >
          <Plus className="w-6 h-6" />
        </motion.button>
      </header>

      <div className="p-6 space-y-6">
        {cards.map((card, index) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative group"
          >
            {/* The ID Card */}
            <div 
              className={`relative h-56 rounded-[2.5rem] overflow-hidden shadow-2xl transition-all duration-500 group-hover:scale-[1.02] cursor-pointer`}
              onClick={() => navigate(`/edit?id=${card.id}`)}
            >
              {/* Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-90 z-10`} />
              <img 
                src={card.bgImage} 
                className="absolute inset-0 w-full h-full object-cover blur-[2px]" 
                alt="" 
              />
              
              {/* Content */}
              <div className="relative z-20 h-full p-8 flex flex-col justify-between text-white">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 backdrop-blur-md p-2 rounded-xl border border-white/30">
                      {getIcon(card.type)}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">{card.title}</span>
                  </div>
                  {card.isDefault && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full border border-white/30">
                      <Star className="w-3 h-3 fill-current" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">默认</span>
                    </div>
                  )}
                </div>

                <div className="flex items-end justify-between">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-black tracking-tight">{card.name}</h2>
                    <p className="text-sm font-medium opacity-80">{card.role}</p>
                    {card.company && (
                      <div className="flex items-center gap-1.5 opacity-60 text-[10px] font-bold uppercase tracking-wider">
                        <Briefcase className="w-3 h-3" />
                        {card.company}
                      </div>
                    )}
                  </div>
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/50 shadow-lg">
                    <img src={card.avatar} className="w-full h-full object-cover" alt="" />
                  </div>
                </div>
              </div>

              {/* NFC / Chip decoration */}
              <div className="absolute top-1/2 -right-4 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full border border-white/20" />
            </div>

            {/* Quick Actions overlaying on the right bottom of the card or below */}
            <div className="mt-4 flex items-center justify-between px-2">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => handleSetDefault(card.id)}
                  className={`text-xs font-bold flex items-center gap-1.5 transition-colors ${card.isDefault ? 'text-blue-600' : 'text-gray-400 hover:text-blue-500'}`}
                >
                  <CheckCircle2 className={`w-4 h-4 ${card.isDefault ? 'fill-blue-600 text-white' : ''}`} />
                  {card.isDefault ? '当前默认' : '设为默认'}
                </button>
                <button 
                  onClick={() => navigate(`/edit?id=${card.id}`)}
                  className="text-xs font-bold text-gray-400 hover:text-gray-700 flex items-center gap-1.5 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  编辑
                </button>
              </div>
              
              <div className="flex items-center gap-3">
                <button className="p-2 text-gray-400 hover:text-gray-700 transition-colors">
                  <Share2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(card.id)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Add Card Placeholder */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/edit')}
          className="w-full h-32 rounded-[2.5rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-blue-200 hover:bg-blue-50/30 hover:text-blue-500 transition-all duration-300"
        >
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
            <Plus className="w-5 h-5" />
          </div>
          <span className="text-xs font-black uppercase tracking-widest">创建新身份</span>
        </motion.button>
      </div>

      {/* Info Tips */}
      <div className="px-8 mt-4">
        <div className="bg-white rounded-3xl p-5 border border-gray-100 space-y-3">
          <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
            多重身份建议
          </h3>
          <p className="text-[10px] text-gray-500 leading-relaxed font-medium">
            你可以根据不同的社交场景切换不同的名片。例如：在开发者大会使用“技术名片”，在商务酒会使用“商务名片”，在驴友聚会使用“社交名片”。默认名片将作为你二维码分享时的首选展示页面。
          </p>
        </div>
      </div>
    </div>
  );
};
