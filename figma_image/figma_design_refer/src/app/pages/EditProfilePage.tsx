import React, { useState, useEffect } from 'react';
import { Camera, Plus, Trash2, Link, Video, Tag, Check, Zap, ChevronRight, Save, X, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';

export const EditProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const cardId = searchParams.get('id');
  
  const [isAiOptimizing, setIsAiOptimizing] = useState(false);
  const [formData, setFormData] = useState({
    name: '陈小独立 (Independent Chen)',
    role: 'OPC 创始人 / 全栈工程师',
    location: '中国，深圳',
    bio: '一名专注于构建 AI 工具与效率应用的独立开发者。我喜欢探索极致的产品体验，并将复杂的逻辑简化为直观的 UI。目前致力于 OPC (一人公司) 的规模化与自动化。',
    title: '技术开发名片'
  });

  useEffect(() => {
    // Simulate fetching card data based on ID
    if (cardId === '2') {
      setFormData({
        name: 'Independent Chen',
        role: 'Founder & CEO',
        location: '中国，香港',
        bio: '致力于用技术手段提升企业效率，专注于跨境业务与 SaaS 解决方案。OPC (One Person Company) 模式的践行者与推广者。',
        title: '商务合作名片'
      });
    } else if (cardId === '3') {
      setFormData({
        name: '阿力',
        role: '摄影爱好者 / 徒步玩家',
        location: '成都，川藏线',
        bio: '喜欢在山野间呼吸，捕捉自然的瞬间。如果你也喜欢户外或者徕卡相机，欢迎加我交流。',
        title: '个人社交名片'
      });
    }
  }, [cardId]);

  const handleAiOptimize = () => {
    setIsAiOptimizing(true);
    setTimeout(() => {
      setFormData(prev => ({
        ...prev,
        bio: '全栈独立开发者，深耕 AI 效率工具领域。擅长将复杂流程转化为极致简洁的用户体验。目前专注 OPC 自动化规模运营，致力于用技术驱动一人公司的爆发式增长。'
      }));
      setIsAiOptimizing(false);
      toast.success('AI 已优化你的个人简介！');
    }, 1500);
  };

  const handleSave = () => {
    toast.success('更改已保存');
    navigate('/cards');
  };

  return (
    <div className="bg-white min-h-screen">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-400 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">
            {cardId ? '编辑名片' : '新建名片'}
          </h1>
        </div>
        <button 
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-bold shadow-lg shadow-blue-100 active:scale-95 transition-all"
        >
          <Save className="w-4 h-4" />
          保存
        </button>
      </header>

      <div className="p-6 pb-24 space-y-10">
        {/* Card Identity Type Label */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
            <h2 className="text-lg font-bold text-gray-900 uppercase tracking-tight">身份设置</h2>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">名片分类标题</label>
            <input 
              type="text" 
              placeholder="例如：技术大牛、商务老板、户外驴友..."
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-100 transition-all outline-none"
            />
          </div>
        </section>

        {/* Profile Picture Section */}
        <section className="flex flex-col items-center gap-6">
          <div className="relative group cursor-pointer">
            <div className="w-28 h-28 rounded-[2rem] overflow-hidden border-4 border-gray-50 shadow-xl group-hover:scale-105 transition-transform duration-300">
              <img src="https://images.unsplash.com/photo-1701463387028-3947648f1337?w=300" className="w-full h-full object-cover" alt="" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 rounded-2xl border-4 border-white flex items-center justify-center text-white shadow-lg group-hover:bg-blue-700 transition-colors">
              <Camera className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">点击更换头像</p>
        </section>

        {/* Basic Info Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
            <h2 className="text-lg font-bold text-gray-900 uppercase tracking-tight">基础资料</h2>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">展示姓名</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-100 transition-all outline-none"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">职位 / 角色描述</label>
              <input 
                type="text" 
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-100 transition-all outline-none"
              />
            </div>

            <div className="space-y-2 relative">
              <div className="flex items-center justify-between pl-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">个人简介</label>
                <button 
                  onClick={handleAiOptimize}
                  disabled={isAiOptimizing}
                  className="flex items-center gap-1.5 text-[10px] font-black text-blue-600 uppercase bg-blue-50 px-2 py-1 rounded-md hover:bg-blue-100 disabled:opacity-50 transition-all"
                >
                  <Zap className={`w-3 h-3 ${isAiOptimizing ? 'animate-spin' : ''}`} />
                  {isAiOptimizing ? 'AI 优化中...' : 'AI 辅助生成'}
                </button>
              </div>
              <textarea 
                rows={4}
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-100 transition-all outline-none leading-relaxed resize-none"
              />
            </div>
          </div>
        </section>

        {/* Portfolio & Links Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
              <h2 className="text-lg font-bold text-gray-900 uppercase tracking-tight">作品集与链接</h2>
            </div>
            <button className="p-2 bg-gray-50 rounded-xl text-blue-600 hover:bg-blue-50 transition-colors">
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            {[
              { title: 'CodeFlow AI', type: 'Link', value: 'codeflow.example.com' },
              { title: '产品演示视频', type: 'Video', value: 'video_demo_01.mp4' }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 group">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.type === 'Link' ? 'bg-indigo-100 text-indigo-600' : 'bg-rose-100 text-rose-600'}`}>
                  {item.type === 'Link' ? <Link className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-gray-900 truncate">{item.title}</div>
                  <div className="text-[10px] text-gray-500 truncate">{item.value}</div>
                </div>
                <button className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-600 transition-colors" />
              </div>
            ))}
          </div>
        </section>

        {/* Tags Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
            <h2 className="text-lg font-bold text-gray-900 uppercase tracking-tight">个人标签</h2>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {['独立开发者', '全栈工程师', 'AI 探索者', 'UX 狂热者', '深圳'].map((tag, i) => (
              <div key={i} className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold border border-blue-100 group">
                {tag}
                <X className="w-3 h-3 cursor-pointer opacity-50 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
            <button className="px-4 py-2 border border-dashed border-gray-200 text-gray-400 rounded-xl text-xs font-bold hover:border-blue-200 hover:text-blue-600 transition-all flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              添加
            </button>
          </div>
        </section>

        {/* Advanced Settings */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-6 bg-rose-600 rounded-full" />
            <h2 className="text-lg font-bold text-gray-900 uppercase tracking-tight text-rose-600">高级设置</h2>
          </div>
          <button className="w-full px-6 py-4 bg-rose-50 text-rose-600 rounded-2xl text-sm font-bold flex items-center justify-between border border-rose-100">
            删除此名片身份
            <Trash2 className="w-5 h-5" />
          </button>
        </section>
      </div>
    </div>
  );
};
