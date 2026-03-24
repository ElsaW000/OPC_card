import React from 'react';
import { ExternalLink, Github, Globe } from 'lucide-react';
import { motion } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';

export interface Project {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  link: string;
  github?: string;
  tags: string[];
}

interface PortfolioGridProps {
  projects: Project[];
}

export const PortfolioGrid: React.FC<PortfolioGridProps> = ({ projects }) => {
  return (
    <div className="px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">产品作品集</h2>
        <span className="text-sm text-gray-400">View All</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.map((project, index) => (
          <motion.div 
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300"
          >
            <div className="aspect-video relative overflow-hidden">
              <ImageWithFallback 
                src={project.thumbnail} 
                alt={project.title} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            
            <div className="p-5">
              <div className="flex flex-wrap gap-2 mb-3">
                {project.tags.map(tag => (
                  <span 
                    key={tag} 
                    className="px-2.5 py-1 text-[10px] font-semibold bg-gray-50 text-gray-500 rounded-full uppercase tracking-tight border border-gray-100"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                {project.title}
              </h3>
              
              <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed mb-4">
                {project.description}
              </p>
              
              <div className="flex gap-4">
                <a 
                  href={project.link}
                  className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Globe className="w-4 h-4" />
                  在线地址
                </a>
                {project.github && (
                  <a 
                    href={project.github}
                    className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Github className="w-4 h-4" />
                    GitHub
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
