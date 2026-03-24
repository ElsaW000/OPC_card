import React from 'react';
import { LayoutDashboard, Users, UserCircle, Settings, BarChart3, History, MessageSquareMore, ChevronRight, Eye, RefreshCw, Star, Info } from 'lucide-react';
import { NavLink } from 'react-router';
import { motion } from 'motion/react';

const QuickAction: React.FC<{ icon: React.ReactNode; label: string; to: string; color: string }> = ({ icon, label, to, color }) => (
  <NavLink 
    to={to}
    className="flex flex-col items-center gap-3 p-4 bg-white rounded-3xl border border-gray-100 hover:border-blue-100 transition-all group"
  >
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
      {icon}
    </div>
    <span className="text-xs font-bold text-gray-700">{label}</span>
  </NavLink>
);

export const WorkbenchPage: React.FC = () => {
  return (
    <div className="p-6 pb-20">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">工作台</h1>
        <p className="text-sm text-gray-500">管理你的 OPC 品牌与人脉网络</p>
      </header>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-blue-600 rounded-3xl p-6 text-white shadow-xl shadow-blue-200 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="w-4 h-4 opacity-70" />
              <span className="text-xs font-medium uppercase tracking-wider opacity-80">本周访客</span>
            </div>
            <div className="text-3xl font-black mb-1">1,284</div>
            <div className="text-[10px] font-bold text-blue-200 flex items-center gap-1">
              <span className="text-blue-100">↑ 12%</span> 比上周
            </div>
          </div>
          <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
        </div>
        <div className="bg-emerald-500 rounded-3xl p-6 text-white shadow-xl shadow-emerald-200 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <RefreshCw className="w-4 h-4 opacity-70" />
              <span className="text-xs font-medium uppercase tracking-wider opacity-80">交换成功</span>
            </div>
            <div className="text-3xl font-black mb-1">42</div>
            <div className="text-[10px] font-bold text-emerald-100 flex items-center gap-1">
              <span className="text-white">活跃率 8.5%</span>
            </div>
          </div>
          <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
        </div>
      </div>

      {/* Todo Alert */}
      <div className="mb-8 bg-amber-50 border border-amber-100 rounded-3xl p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center flex-shrink-0 text-amber-600">
          <Info className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-amber-900 mb-1">待办提醒：完善作品集</h4>
          <p className="text-xs text-amber-700 leading-relaxed">
            你还有 2 个项目链接未添加，完善后的名片交换率通常会提升 30% 以上。
          </p>
          <NavLink to="/edit" className="mt-3 inline-block text-xs font-bold text-amber-900 underline underline-offset-4">
            立即去完善
          </NavLink>
        </div>
      </div>

      {/* Main Navigation Grid */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <QuickAction icon={<UserCircle className="w-6 h-6" />} label="名片管理" to="/cards" color="bg-indigo-50 text-indigo-600" />
        <QuickAction icon={<History className="w-6 h-6" />} label="浏览记录" to="/visitors" color="bg-rose-50 text-rose-600" />
        <QuickAction icon={<RefreshCw className="w-6 h-6" />} label="交换记录" to="/contacts" color="bg-teal-50 text-teal-600" />
        <QuickAction icon={<BarChart3 className="w-6 h-6" />} label="数据分析" to="/analytics" color="bg-orange-50 text-orange-600" />
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900">最近访客</h3>
          <NavLink to="/visitors" className="text-xs font-medium text-blue-600">查看更多</NavLink>
        </div>
        
        <div className="space-y-5">
          {[
            { name: 'Sarah Zhang', role: '产品经理 @ ByteDance', time: '10分钟前', img: 'https://images.unsplash.com/photo-1573164713791-0dfcd2a183a7?w=200' },
            { name: 'David Li', role: '独立开发者', time: '2小时前', img: 'https://images.unsplash.com/photo-1664101606938-e664f5852fac?w=200' },
            { name: 'Emily Wang', role: 'UX 设计师', time: '5小时前', img: 'https://images.unsplash.com/photo-1645951252284-4aa663bf59ca?w=200' },
          ].map((visitor, i) => (
            <div key={i} className="flex items-center gap-4">
              <img src={visitor.img} className="w-10 h-10 rounded-full object-cover" alt="" />
              <div className="flex-1">
                <div className="text-sm font-bold text-gray-900">{visitor.name}</div>
                <div className="text-[10px] text-gray-500">{visitor.role}</div>
              </div>
              <div className="text-[10px] text-gray-400 font-medium">{visitor.time}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
