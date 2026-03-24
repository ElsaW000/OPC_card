import React from 'react';
import { Mail, Github, Twitter, MessageCircle, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

export const FooterLinks: React.FC = () => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('复制成功！');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="px-6 py-12 bg-white">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-2">联系我</h2>
        <p className="text-gray-500 text-sm">如有合作意向，欢迎通过以下方式联系</p>
      </div>
      
      <div className="space-y-4">
        <div className="p-5 rounded-3xl border border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-all duration-300">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-600">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-bold text-gray-900 uppercase">微信 (WeChat)</div>
              <div className="text-xs text-gray-400">Scan or copy ID</div>
            </div>
          </div>
          <button 
            onClick={() => handleCopy('dev_opc_2026')}
            className="p-3 rounded-2xl border border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-200 transition-colors"
          >
            {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>

        <div className="p-5 rounded-3xl border border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-all duration-300">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-bold text-gray-900 uppercase">邮箱 (Email)</div>
              <div className="text-xs text-gray-400">hello@opc-maker.com</div>
            </div>
          </div>
          <a 
            href="mailto:hello@opc-maker.com"
            className="p-3 rounded-2xl border border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-200 transition-colors"
          >
            <Github className="w-5 h-5" />
          </a>
        </div>
      </div>
      
      <div className="mt-12 text-center text-gray-400 text-sm">
        <p>© 2026 Powered by Figma Make · Built for OPC Builders</p>
      </div>
    </div>
  );
};
