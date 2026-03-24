import React from 'react';
import { ProfileCard } from '../components/ProfileCard';
import { PortfolioGrid, Project } from '../components/PortfolioGrid';
import { VideoShorts, VideoItem } from '../components/VideoShorts';
import { FooterLinks } from '../components/FooterLinks';
import { RefreshCw, UserPlus, Share2, MessageCircle, Send, QrCode } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

const projects: Project[] = [
  {
    id: '1',
    title: 'CodeFlow AI',
    description: '一个帮助独立开发者通过自然语言直接生成 React 组件的 AI 工作流。',
    thumbnail: 'https://images.unsplash.com/photo-1575388902449-6bca946ad549?w=800',
    link: 'https://codeflow.example.com',
    github: 'https://github.com/example/codeflow',
    tags: ['AI', 'React', 'SaaS']
  },
  {
    id: '2',
    title: 'ZenTask Mobile',
    description: '极简主义的个人效率工具，支持跨端同步与离线工作。',
    thumbnail: 'https://images.unsplash.com/photo-1758598303946-385680e4eabd?w=800',
    link: 'https://zentask.example.com',
    tags: ['Mobile', 'Flutter', 'Efficiency']
  }
];

const videos: VideoItem[] = [
  {
    id: 'v1',
    title: '演示：如何在 5 分钟内使用 CodeFlow AI 生成 UI',
    thumbnail: 'https://images.unsplash.com/photo-1647247743538-0137d6a8a268?w=800',
    views: '12k',
    duration: '01:45'
  }
];

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="pb-32 bg-white relative">
      <ProfileCard 
        name="陈小独立 (Independent Chen)"
        role="OPC 创始人 / 全栈工程师"
        location="中国，深圳"
        bio="一名专注于构建 AI 工具与效率应用的独立开发者。我喜欢探索极致的产品体验，并将复杂的逻辑简化为直观的 UI。目前致力于 OPC (一人公司) 的规模化与自动化。"
        avatarUrl="https://images.unsplash.com/photo-1701463387028-3947648f1337?w=400"
        bannerUrl="https://images.unsplash.com/photo-1647247743538-0137d6a8a268?w=1080"
      />
      
      <PortfolioGrid projects={projects} />
      
      <VideoShorts videos={videos} />
      
      <FooterLinks />

      {/* Floating Action Buttons */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-3 z-50">
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate('/exchange')}
          className="flex items-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-full font-bold shadow-2xl shadow-blue-400/50 hover:bg-blue-700 transition-all group"
        >
          <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
          <span>交换名片</span>
        </motion.button>
        
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            toast.success('名片已保存至通讯录');
          }}
          className="w-14 h-14 flex items-center justify-center bg-white border border-gray-100 rounded-full text-blue-600 shadow-xl shadow-gray-200/50 hover:bg-gray-50 transition-all"
        >
          <UserPlus className="w-6 h-6" />
        </motion.button>

        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            toast.info('二维码已生成，长按保存');
          }}
          className="w-14 h-14 flex items-center justify-center bg-white border border-gray-100 rounded-full text-gray-700 shadow-xl shadow-gray-200/50 hover:bg-gray-50 transition-all"
        >
          <QrCode className="w-6 h-6" />
        </motion.button>
      </div>

      {/* Share Toast Simulation */}
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-40 right-6 z-50"
      >
        <button 
          className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-100 text-blue-500 hover:text-blue-600 active:scale-95 transition-all"
          onClick={() => {
            toast('分享给朋友', {
              description: '名片链接已复制到剪贴板'
            });
          }}
        >
          <Share2 className="w-5 h-5" />
        </button>
      </motion.div>
    </div>
  );
};
