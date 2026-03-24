import React, { useState } from 'react';
import { Search, Filter, MessageCircle, Phone, Mail, ChevronRight, UserPlus, Star, MapPin, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Contact {
  id: string;
  name: string;
  role: string;
  company: string;
  location: string;
  avatar: string;
  tags: string[];
  lastActive: string;
  isStarred?: boolean;
}

const contacts: Contact[] = [
  {
    id: '1',
    name: 'Sarah Zhang',
    role: '高级产品经理',
    company: 'ByteDance',
    location: '北京',
    avatar: 'https://images.unsplash.com/photo-1573164713791-0dfcd2a183a7?w=200',
    tags: ['AI', 'B端产品', '出海'],
    lastActive: '10分钟前',
    isStarred: true
  },
  {
    id: '2',
    name: 'David Li',
    role: '独立开发者',
    company: 'Solopreneur',
    location: '杭州',
    avatar: 'https://images.unsplash.com/photo-1664101606938-e664f5852fac?w=200',
    tags: ['Flutter', 'Rust', 'Web3'],
    lastActive: '2小时前'
  },
  {
    id: '3',
    name: 'Emily Wang',
    role: '资深 UX 设计师',
    company: 'Adobe',
    location: '深圳',
    avatar: 'https://images.unsplash.com/photo-1645951252284-4aa663bf59ca?w=200',
    tags: ['Design System', 'AIGC'],
    lastActive: '5小时前'
  },
  {
    id: '4',
    name: 'Kevin Chen',
    role: 'CTO',
    company: 'FinTech Startup',
    location: '上海',
    avatar: 'https://images.unsplash.com/photo-1666698809123-44e998e93f23?w=200',
    tags: ['Architecture', 'Go', 'Backend'],
    lastActive: '1天前',
    isStarred: true
  }
];

export const ContactsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const filteredContacts = contacts.filter(c => 
    (c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     c.role.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (!selectedTag || c.tags.includes(selectedTag))
  );

  const allTags = Array.from(new Set(contacts.flatMap(c => c.tags)));

  return (
    <div className="bg-gray-50/50 min-h-screen">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">联系人列表</h1>
          <button className="p-2 rounded-full bg-blue-50 text-blue-600">
            <UserPlus className="w-5 h-5" />
          </button>
        </div>
        
        <div className="relative group mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text" 
            placeholder="搜索姓名、职位或公司..." 
            className="w-full pl-11 pr-4 py-3 bg-gray-100 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-100 transition-all outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button 
            onClick={() => setSelectedTag(null)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${!selectedTag ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100' : 'bg-white text-gray-500 border-gray-100'}`}
          >
            全部
          </button>
          {allTags.map(tag => (
            <button 
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${selectedTag === tag ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100' : 'bg-white text-gray-500 border-gray-100'}`}
            >
              {tag}
            </button>
          ))}
        </div>
      </header>

      <div className="p-6 space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredContacts.map((contact, index) => (
            <motion.div 
              key={contact.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm hover:shadow-xl transition-all group relative cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="relative">
                  <img src={contact.avatar} className="w-14 h-14 rounded-2xl object-cover" alt="" />
                  {contact.isStarred && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full border-2 border-white flex items-center justify-center text-white shadow-sm">
                      <Star className="w-3 h-3 fill-white" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-lg font-bold text-gray-900">{contact.name}</h3>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">{contact.lastActive}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>{contact.role} @ {contact.company}</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {contact.tags.map(tag => (
                      <span key={tag} className="px-2 py-0.5 bg-gray-50 text-[10px] font-bold text-gray-500 rounded-md border border-gray-100 uppercase tracking-tight">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
                    <button className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors">
                      <MessageCircle className="w-4 h-4" />
                      聊天
                    </button>
                    <button className="w-10 h-10 flex items-center justify-center bg-gray-50 text-gray-400 rounded-xl hover:text-blue-600 transition-colors">
                      <Phone className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
