import React from 'react';
import { Trophy, Activity, History, Settings, User, Search } from 'lucide-react';
import { motion } from 'motion/react';
import VideoAnalyzer from './components/VideoAnalyzer';
import { cn } from './lib/utils';

export default function App() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 selection:bg-tennis-green selection:text-black" dir="rtl">
      {/* Sidebar Navigation (Desktop) */}
      <nav className="fixed right-0 top-0 h-full w-20 border-l border-white/5 bg-neutral-900/50 backdrop-blur-xl hidden md:flex flex-col items-center py-8 gap-8 z-50">
        <div className="w-12 h-12 bg-tennis-green rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(220,248,54,0.3)] mb-4">
          <Activity className="w-6 h-6 text-black" />
        </div>
        
        <NavItem icon={<History />} active />
        <NavItem icon={<Search />} />
        <NavItem icon={<Trophy />} />
        
        <div className="mt-auto flex flex-col gap-8">
          <NavItem icon={<Settings />} />
          <NavItem icon={<User />} />
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="md:pr-20 min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-neutral-950/80 backdrop-blur-md border-b border-white/5 py-4 px-6 md:px-12 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-black tracking-tighter uppercase italic flex items-center gap-3">
              TennisForm <span className="text-tennis-green">AI</span>
            </h1>
            <div className="h-4 w-px bg-white/20 hidden sm:block" />
            <p className="text-xs font-mono text-neutral-500 hidden sm:block uppercase tracking-widest">
              Motion Analysis Engine v1.0
            </p>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="hidden lg:flex items-center gap-2 bg-white/5 rounded-full px-4 py-1.5 border border-white/10">
                <div className="w-2 h-2 rounded-full bg-tennis-green animate-pulse" />
                <span className="text-xs font-bold text-neutral-400">نظام التحليل متصل</span>
             </div>
             <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
               <Settings className="w-5 h-5 text-neutral-400" />
             </button>
          </div>
        </header>

        {/* Content View */}
        <div className="max-w-7xl mx-auto py-8 px-6 md:px-12 space-y-12">
          {/* Welcome Section */}
          <section className="space-y-2">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-4xl md:text-5xl font-black italic uppercase leading-none">
                ارتقِ بمستواك <br />
                في <span className="text-tennis-green">التنس</span> اليوم
              </h2>
              <p className="text-neutral-400 max-w-2xl mt-4 text-lg">
                استخدم تقنية الذكاء الاصطناعي للحصول على تحليل تقني مفصل لضرباتك. 
                قم بتحميل فيديو الممارسة الخاص بك واحصل على ملاحظات فورية من "المدرب الذكي".
              </p>
            </motion.div>
          </section>

          {/* Core App Feature */}
          <section>
            <VideoAnalyzer />
          </section>

          {/* Footer Stats/Info */}
          <footer className="pt-12 border-t border-white/5 grid grid-cols-1 md:grid-cols-3 gap-8 pb-12">
            <StatCard 
              label="تحليلات تمت" 
              value="1,280+" 
              subValue="+12% هذا الأسبوع" 
            />
            <StatCard 
              label="دقة المحرك" 
              value="94.2%" 
              subValue="بناءً على 50 ألف حركة" 
            />
            <StatCard 
              label="تحسن اللاعبين" 
              value="3x" 
              subValue="أسرع من التدريب التقليدي" 
            />
          </footer>
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, active = false }: { icon: React.ReactNode, active?: boolean }) {
  return (
    <button className={cn(
      "w-12 h-12 rounded-xl flex items-center justify-center transition-all group relative",
      active ? "bg-white/10 text-tennis-green" : "text-neutral-500 hover:bg-white/5 hover:text-white"
    )}>
      {icon}
      {active && (
        <motion.div 
          layoutId="active-indicator"
          className="absolute right-0 w-1 h-6 bg-tennis-green rounded-l-full" 
        />
      )}
    </button>
  );
}

function StatCard({ label, value, subValue }: { label: string, value: string, subValue: string }) {
  return (
    <div className="bg-neutral-900/30 border border-white/5 rounded-2xl p-6 hover:bg-neutral-900/50 transition-colors">
      <p className="text-neutral-500 text-sm font-bold uppercase tracking-widest mb-1">{label}</p>
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-black italic">{value}</span>
        <span className="text-xs text-tennis-green font-mono">{subValue}</span>
      </div>
    </div>
  );
}
