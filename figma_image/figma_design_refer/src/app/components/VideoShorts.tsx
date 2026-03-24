import React from 'react';
import { Play, Eye, Share2 } from 'lucide-react';
import { motion } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';

export interface VideoItem {
  id: string;
  title: string;
  thumbnail: string;
  views: string;
  duration: string;
}

interface VideoShortsProps {
  videos: VideoItem[];
}

export const VideoShorts: React.FC<VideoShortsProps> = ({ videos }) => {
  return (
    <div className="px-6 py-8 bg-gray-50/50">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">产品演示 & 短视频</h2>
        <span className="text-sm text-gray-400">Recent</span>
      </div>
      
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {videos.map((video, index) => (
          <motion.div 
            key={video.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex-shrink-0 w-64 h-[400px] relative rounded-3xl overflow-hidden shadow-lg group cursor-pointer"
          >
            <ImageWithFallback 
              src={video.thumbnail} 
              alt={video.title} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            
            <div className="absolute inset-0 bg-linear-to-b from-black/10 via-transparent to-black/80 group-hover:to-black/90 transition-all duration-300" />
            
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-md border border-white/40 rounded-full flex items-center justify-center">
                <Play className="w-6 h-6 text-white fill-white" />
              </div>
            </div>
            
            <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-1 bg-black/40 backdrop-blur-md rounded-full text-[10px] font-bold text-white uppercase">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
              {video.duration}
            </div>
            
            <div className="absolute bottom-6 left-6 right-6">
              <h3 className="text-base font-bold text-white mb-2 line-clamp-2">
                {video.title}
              </h3>
              <div className="flex items-center gap-4 text-xs text-white/70">
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {video.views}
                </span>
                <span className="flex items-center gap-1">
                  <Share2 className="w-3 h-3" />
                  Share
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
