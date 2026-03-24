import React from 'react';
import { NavLink } from 'react-router';
import { User, LayoutDashboard, Users, UserCircle } from 'lucide-react';

export const BottomNav: React.FC = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-2xl mx-auto bg-white/80 backdrop-blur-xl border-t border-gray-100 flex justify-around items-center py-2 px-6 z-50">
      <NavLink 
        to="/" 
        className={({ isActive }) => `flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400'}`}
      >
        <User className="w-6 h-6" />
        <span className="text-[10px] font-medium">我的名片</span>
      </NavLink>
      
      <NavLink 
        to="/contacts" 
        className={({ isActive }) => `flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400'}`}
      >
        <Users className="w-6 h-6" />
        <span className="text-[10px] font-medium">联系人</span>
      </NavLink>
      
      <NavLink 
        to="/workbench" 
        className={({ isActive }) => `flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400'}`}
      >
        <LayoutDashboard className="w-6 h-6" />
        <span className="text-[10px] font-medium">工作台</span>
      </NavLink>
      
      <NavLink 
        to="/edit" 
        className={({ isActive }) => `flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400'}`}
      >
        <UserCircle className="w-6 h-6" />
        <span className="text-[10px] font-medium">管理</span>
      </NavLink>
    </div>
  );
};
