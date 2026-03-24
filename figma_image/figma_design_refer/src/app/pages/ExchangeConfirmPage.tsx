import React from 'react';
import { Mail, Github, Twitter, MessageCircle, Copy, Check, Share2, Save, RefreshCw, Send, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

export const ExchangeConfirmPage: React.FC = () => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('复制成功！');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col items-center justify-center p-6 pb-24">
      <div className="w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl shadow-blue-100 overflow-hidden relative">
        <div className="p-10 flex flex-col items-center text-center">
          <div className="relative mb-8">
            <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-blue-50 shadow-lg">
              <img src="https://images.unsplash.com/photo-1573164713791-0dfcd2a183a7?w=200" className="w-full h-full object-cover" alt="" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 rounded-2xl border-4 border-white flex items-center justify-center text-white shadow-lg animate-bounce">
              <RefreshCw className="w-5 h-5" />
            </div>
          </div>

          <h2 className="text-2xl font-black text-gray-900 mb-2 leading-tight">Sarah Zhang <br />希望与你交换名片</h2>
          <p className="text-sm text-gray-500 mb-8 leading-relaxed px-4">
            Sarah 来自 ByteDance，目前担任高级产品经理。
          </p>

          <div className="w-full space-y-4 mb-10">
            <button 
              onClick={() => toast.success('名片已回传！')}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2 group"
            >
              一键回传我的名片
              <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={() => toast.info('已保存至联系人')}
              className="w-full py-4 bg-white border border-gray-100 text-gray-700 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-50 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4 text-gray-400" />
              仅保存对方名片
            </button>
          </div>

          <div className="pt-8 border-t border-gray-50 w-full">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Sarah 的联系方式</div>
            <div className="flex justify-center gap-4">
              <button 
                onClick={() => handleCopy('sarah_pm_2026')}
                className="w-12 h-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100 transition-colors"
              >
                <MessageCircle className="w-6 h-6" />
              </button>
              <button 
                className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors"
              >
                <Mail className="w-6 h-6" />
              </button>
              <button 
                className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-600 flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <Github className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full blur-3xl -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-50/50 rounded-full blur-3xl -ml-16 -mb-16" />
      </div>

      <button className="mt-8 flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors group">
        我也要创建一份 OPC 名片
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
};
