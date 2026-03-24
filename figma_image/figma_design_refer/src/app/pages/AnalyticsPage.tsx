import React from 'react';
import { BarChart3, TrendingUp, TrendingDown, Eye, RefreshCw, MessageCircle, ChevronRight, PieChart, Activity, Info, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const data = [
  { name: 'Mon', views: 400, exchange: 24 },
  { name: 'Tue', views: 300, exchange: 13 },
  { name: 'Wed', views: 200, exchange: 98 },
  { name: 'Thu', views: 278, exchange: 39 },
  { name: 'Fri', views: 189, exchange: 48 },
  { name: 'Sat', views: 239, exchange: 38 },
  { name: 'Sun', views: 349, exchange: 43 },
];

export const AnalyticsPage: React.FC = () => {
  return (
    <div className="bg-white min-h-screen p-6 pb-24">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">数据分析</h1>
        <p className="text-sm text-gray-500">洞察你的名片影响力和转化率</p>
      </header>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 gap-6 mb-8">
        <div className="bg-blue-50 rounded-3xl p-6 border border-blue-100 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-blue-900 uppercase tracking-widest">总浏览量</span>
            </div>
            <div className="flex items-end gap-3 mb-2">
              <div className="text-4xl font-black text-blue-900">12.5k</div>
              <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold mb-1">
                <TrendingUp className="w-3 h-3" />
                <span>+12.4%</span>
              </div>
            </div>
            <p className="text-[10px] text-blue-700 font-medium">近 30 天名片被查看的次数</p>
          </div>
          <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-blue-100 rounded-full blur-3xl opacity-50" />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-3xl p-5 border border-gray-100">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">交换率</div>
            <div className="text-2xl font-black text-gray-900 mb-1">8.42%</div>
            <div className="text-[10px] text-gray-500 font-medium italic">行业均值 5.2%</div>
          </div>
          <div className="bg-gray-50 rounded-3xl p-5 border border-gray-100">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">平均停留</div>
            <div className="text-2xl font-black text-gray-900 mb-1">45s</div>
            <div className="text-[10px] text-gray-500 font-medium italic">较昨日 ↑ 5s</div>
          </div>
        </div>
      </div>

      {/* Trends Chart */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 mb-8 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight">趋势洞察</h3>
          <div className="flex gap-2">
            <div className="flex items-center gap-1 text-[10px] font-bold text-blue-600">
              <div className="w-2 h-2 rounded-full bg-blue-600" />
              <span>浏览</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>交换</span>
            </div>
          </div>
        </div>
        
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%" key="responsive-container">
            <AreaChart data={data} key="area-chart">
              <defs key="defs">
                <linearGradient id="analyticsColorViews" x1="0" y1="0" x2="0" y2="1">
                  <stop key="stop1" offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                  <stop key="stop2" offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid key="grid" strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                key="xaxis" 
                dataKey="name" 
                hide 
              />
              <YAxis key="yaxis" hide />
              <Tooltip 
                key="tooltip"
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Area 
                key="area-views" 
                type="monotone" 
                dataKey="views" 
                stroke="#2563eb" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#analyticsColorViews)" 
                animationDuration={1000}
              />
              <Area 
                key="area-exchange" 
                type="monotone" 
                dataKey="exchange" 
                stroke="#10b981" 
                strokeWidth={3} 
                fillOpacity={0} 
                animationDuration={1000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Optimization Tips */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-5 h-5 text-amber-500" />
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight">AI 优化建议</h3>
        </div>
        
        <div className="p-5 bg-amber-50 rounded-3xl border border-amber-100 flex gap-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
            <PieChart className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-amber-900 mb-1">提高作品集吸引力</h4>
            <p className="text-[10px] text-amber-800 leading-relaxed">
              数据显示，访客在视频展示部分的停留时间最长。建议将最近的「CodeFlow AI」演示视频置顶，可增加约 15% 的交换率。
            </p>
          </div>
        </div>

        <div className="p-5 bg-blue-50 rounded-3xl border border-blue-100 flex gap-4">
          <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-blue-900 mb-1">高峰访问时段</h4>
            <p className="text-[10px] text-blue-800 leading-relaxed">
              你的名片在周三上午 10:00 - 11:30 访问量最高。建议在此时间段多在社交平台分享你的名片链接。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
