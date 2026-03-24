import React, { useState } from 'react';
import { Eye, ShieldAlert, Lock, Crown, ChevronRight, Clock, MapPin, Share2, Filter, Settings, Info, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface Visitor {
  id: string;
  name: string;
  role: string;
  company: string;
  location: string;
  avatar: string;
  time: string;
  source: string;
  tags: string[];
  isLocked?: boolean;
}

const visitors: Visitor[] = [
  {
    id: '1',
    name: 'Sarah Zhang',
    role: '高级产品经理',
    company: 'ByteDance',
    location: '北京',
    avatar: 'https://images.unsplash.com/photo-1573164713791-0dfcd2a183a7?w=200',
    time: '10分钟前',
    source: 'GitHub',
    tags: ['AI', 'B端产品']
  },
  {
    id: '2',
    name: 'David Li',
    role: '独立开发者',
    company: 'Solopreneur',
    location: '杭州',
    avatar: 'https://images.unsplash.com/photo-1664101606938-e664f5852fac?w=200',
    time: '2小时前',
    source: 'Twitter',
    tags: ['Flutter', 'Rust']
  },
  {
    id: '3',
    name: 'Emily Wang',
    role: '资深 UX 设计师',
    company: 'Adobe',
    location: '深圳',
    avatar: 'https://images.unsplash.com/photo-1645951252284-4aa663bf59ca?w=200',
    time: '5小时前',
    source: 'WeChat',
    tags: ['Design System']
  },
  {
    id: '4',
    name: '访客 #004',
    role: 'CTO / 创始人',
    company: '保密',
    location: '上海',
    avatar: '',
    time: '昨天',
    source: 'Direct',
    tags: ['Architecture', 'Scale'],
    isLocked: true
  },
  {
    id: '5',
    name: '访客 #005',
    role: '高级工程师',
    company: '保密',
    location: '深圳',
    avatar: '',
    time: '昨天',
    source: 'Twitter',
    tags: ['React', 'Next.js'],
    isLocked: true
  }
];

export const VisitorPage: React.FC = () => {
  const [isPro, setIsPro] = useState(false);

  const handleUpgrade = () => {
    toast.info('升级 Pro 会员以解锁完整访客追踪功能');
  };

  return (
    <div className="bg-gray-50/50 min-h-screen pb-24">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">访客明细</h1>
        <button onClick={handleUpgrade} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-600 rounded-xl text-[10px] font-black uppercase tracking-tight border border-amber-100 hover:bg-amber-100 transition-all">
          <Crown className="w-3 h-3 fill-amber-600" />
          Pro 会员
        </button>
      </header>

      <div className="p-6">
        {/* Visitor Stats Hero */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 mb-8 shadow-sm flex items-center gap-6">
          <div className="flex-1">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">今日新增访客</div>
            <div className="text-3xl font-black text-gray-900">124</div>
          </div>
          <div className="h-10 w-px bg-gray-100" />
          <div className="flex-1">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">活跃来源</div>
            <div className="text-xl font-black text-blue-600">Twitter</div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-tight">访客列表</h2>
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase">
            <Clock className="w-3.5 h-3.5" />
            <span>实时更新</span>
          </div>
        </div>

        <div className="space-y-4">
          {visitors.map((visitor, i) => (
            <motion.div 
              key={visitor.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`bg-white rounded-3xl border border-gray-100 p-5 shadow-sm relative group overflow-hidden ${visitor.isLocked && !isPro ? 'cursor-not-allowed opacity-90' : 'cursor-pointer hover:shadow-xl transition-all'}`}
            >
              <div className="flex items-start gap-4">
                {visitor.isLocked && !isPro ? (
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400">
                    <Lock className="w-6 h-6" />
                  </div>
                ) : (
                  <img src={visitor.avatar || 'https://via.placeholder.com/150'} className="w-14 h-14 rounded-2xl object-cover" alt="" />
                )}
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`text-lg font-bold ${visitor.isLocked && !isPro ? 'text-gray-300 blur-[3px]' : 'text-gray-900'}`}>
                      {visitor.name}
                    </h3>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">{visitor.time}</span>
                  </div>
                  
                  <div className={`flex items-center gap-2 text-xs mb-3 ${visitor.isLocked && !isPro ? 'text-gray-200 blur-[2px]' : 'text-gray-500'}`}>
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>{visitor.role} @ {visitor.company}</span>
                  </div>

                  <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{visitor.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Share2 className="w-3 h-3" />
                      <span>来自 {visitor.source}</span>
                    </div>
                  </div>
                </div>
              </div>

              {visitor.isLocked && !isPro && (
                <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <ShieldAlert className="w-8 h-8 text-blue-600" />
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpgrade();
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-200 hover:scale-105 active:scale-95 transition-all"
                    >
                      升级 Pro 查看完整详情
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Upgrade Card */}
        {!isPro && (
          <div className="mt-10 p-8 bg-blue-900 rounded-[2rem] text-white relative overflow-hidden shadow-2xl shadow-blue-200">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-800 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border border-blue-700">
                <Crown className="w-3 h-3 text-amber-400 fill-amber-400" />
                Pro Membership
              </div>
              <h2 className="text-3xl font-black mb-4 leading-tight">洞察每一位潜力的<br />合作伙伴</h2>
              <p className="text-blue-200 text-xs font-medium leading-relaxed mb-8 max-w-[240px]">
                获取访客访问的精确时间、停留时长、具体来源渠道以及完整的联系详情。
              </p>
              <button 
                onClick={handleUpgrade}
                className="w-full py-4 bg-white text-blue-900 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-50 transition-colors shadow-lg shadow-black/20"
              >
                立即开启专业版 $19.9/月
              </button>
            </div>
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-800 rounded-full blur-[80px] opacity-50" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-blue-500 rounded-full blur-[100px] opacity-30" />
          </div>
        )}
      </div>
    </div>
  );
};
