import React from 'react';
import { Mail, Github, Twitter, MessageCircle, ExternalLink, Play, Globe, MapPin, Briefcase } from 'lucide-react';
import { motion } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface ProfileProps {
  name: string;
  role: string;
  bio: string;
  location: string;
  avatarUrl: string;
  bannerUrl: string;
}

export const ProfileCard: React.FC<ProfileProps> = ({ name, role, bio, location, avatarUrl, bannerUrl }) => {
  return (
    <div className="relative w-full bg-white overflow-hidden">
      {/* Banner */}
      <div className="h-48 w-full relative overflow-hidden">
        <ImageWithFallback 
          src={bannerUrl} 
          alt="Banner" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-b from-transparent to-black/30" />
      </div>

      {/* Profile Info */}
      <div className="px-6 -mt-12 relative z-10 pb-6 border-b border-gray-100">
        <div className="flex justify-between items-end mb-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-white shadow-lg">
              <ImageWithFallback 
                src={avatarUrl} 
                alt={name} 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div className="flex gap-2 mb-2">
            <button className="p-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
              <Github className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
              <Twitter className="w-5 h-5" />
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-full font-medium shadow-md hover:bg-blue-700 transition-colors">
              关注
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Briefcase className="w-4 h-4" />
              {role}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {location}
            </span>
          </div>
          <p className="text-gray-600 mt-3 leading-relaxed">
            {bio}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="text-center p-3 rounded-xl bg-gray-50">
            <div className="text-lg font-bold text-gray-900">8+</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">开发年限</div>
          </div>
          <div className="text-center p-3 rounded-xl bg-gray-50">
            <div className="text-lg font-bold text-gray-900">12</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">上线产品</div>
          </div>
          <div className="text-center p-3 rounded-xl bg-gray-50">
            <div className="text-lg font-bold text-gray-900">25k</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">全球用户</div>
          </div>
        </div>
      </div>
    </div>
  );
};
