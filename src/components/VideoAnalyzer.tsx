import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, Upload, Play, CheckCircle2, AlertCircle, Loader2, Sparkles, 
  Trophy, Target, Info, ChevronLeft, ChevronRight, MousePointer2, 
  Type, Slash, Circle, Ruler, RefreshCcw, Maximize, PlayCircle, PauseCircle,
  Clock, Scissors
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { analyzeTennisMotion } from '../services/ai';
import { cn } from '../lib/utils';

type Tool = 'select' | 'line' | 'angle' | 'circle' | 'text';

interface DrawingElement {
  id: string;
  type: Tool;
  points: { x: number, y: number }[];
  text?: string;
  color: string;
}

export default function VideoAnalyzer() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Kinovea-like states
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [drawings, setDrawings] = useState<DrawingElement[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const currentElement = useRef<DrawingElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      setVideoFile(file);
      setVideoUrl(URL.createObjectURL(file));
      setAnalysis(null);
      setError(null);
      setDrawings([]);
    }
  };

  // --- Kinovea Logic ---

  const stepFrame = (frames: number) => {
    if (videoRef.current) {
      const fps = 30; // Approximation
      videoRef.current.currentTime += frames * (1 / fps);
    }
  };

  const startDrawing = (e: React.MouseEvent) => {
    if (activeTool === 'select') return;
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    isDrawing.current = true;
    currentElement.current = {
      id: Math.random().toString(36).substr(2, 9),
      type: activeTool,
      points: [{ x, y }],
      color: '#dcf836'
    };
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing.current || !currentElement.current) return;
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    const el = currentElement.current;
    if (el.type === 'line' || el.type === 'circle') {
      el.points[1] = { x, y };
    } else if (el.type === 'angle') {
       if (el.points.length === 1) el.points[1] = { x, y };
       else if (el.points.length === 2) el.points[2] = { x, y };
       else el.points[el.points.length - 1] = { x, y };
    }
    
    renderOverlay();
  };

  const endDrawing = () => {
    if (isDrawing.current && currentElement.current) {
      const el = currentElement.current;
      // For angle, we might want multiple clicks or a drags. 
      // For this simplified version, let's keep the drag-to-3rd-point logic or just commit.
      setDrawings(prev => [...prev, el]);
    }
    isDrawing.current = false;
    currentElement.current = null;
  };

  const renderOverlay = () => {
    const canvas = overlayCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const elementsToDraw = currentElement.current 
      ? [...drawings, currentElement.current] 
      : drawings;

    elementsToDraw.forEach(el => {
      ctx.strokeStyle = el.color;
      ctx.fillStyle = el.color;
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (el.type === 'line' && el.points.length >= 2) {
        ctx.beginPath();
        ctx.moveTo(el.points[0].x, el.points[0].y);
        ctx.lineTo(el.points[1].x, el.points[1].y);
        ctx.stroke();
      } else if (el.type === 'circle' && el.points.length >= 2) {
        const radius = Math.sqrt(
          Math.pow(el.points[1].x - el.points[0].x, 2) + 
          Math.pow(el.points[1].y - el.points[0].y, 2)
        );
        ctx.beginPath();
        ctx.arc(el.points[0].x, el.points[0].y, radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (el.type === 'angle' && el.points.length >= 2) {
        ctx.beginPath();
        ctx.moveTo(el.points[0].x, el.points[0].y);
        el.points.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.stroke();
        
        if (el.points.length === 3) {
          const a = el.points[0];
          const b = el.points[1];
          const c = el.points[2];
          const angle1 = Math.atan2(a.y - b.y, a.x - b.x);
          const angle2 = Math.atan2(c.y - b.y, c.x - b.x);
          let angle = Math.abs(angle1 - angle2) * (180 / Math.PI);
          if (angle > 180) angle = 360 - angle;
          
          ctx.font = 'bold 32px Inter';
          ctx.fillText(`${Math.round(angle)}°`, b.x + 20, b.y - 20);
          
          // Draw arc for angle
          ctx.beginPath();
          ctx.lineWidth = 3;
          ctx.arc(b.x, b.y, 40, angle1, angle2, false);
          ctx.stroke();
        }
      }
    });
  };

  useEffect(() => {
    renderOverlay();
  }, [drawings]);

  useEffect(() => {
    if (videoUrl && videoRef.current) {
        const video = videoRef.current;
        const syncSize = () => {
            if (overlayCanvasRef.current) {
                overlayCanvasRef.current.width = video.videoWidth;
                overlayCanvasRef.current.height = video.videoHeight;
                setDuration(video.duration);
                renderOverlay();
            }
        };
        video.addEventListener('loadedmetadata', syncSize);
        return () => video.removeEventListener('loadedmetadata', syncSize);
    }
  }, [videoUrl]);

  // --- AI Analysis ---

  const extractFrames = async (): Promise<string[]> => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return [];

    const frames: string[] = [];
    const dur = video.duration;
    const points = [0.1, 0.4, 0.7, 0.9];

    for (const point of points) {
      video.currentTime = dur * point;
      await new Promise(resolve => {
        video.onseeked = resolve;
      });
      
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        frames.push(canvas.toDataURL('image/jpeg', 0.8));
      }
    }
    return frames;
  };

  const startAnalysis = async () => {
    if (!videoFile) return;
    setIsAnalyzing(true);
    setProgress(10);
    setError(null);
    try {
      const frames = await extractFrames();
      const result = await analyzeTennisMotion(frames);
      setAnalysis(result);
    } catch (err) {
      setError("حدث خطأ أثناء معالجة الفيديو.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
      {/* Tools Sidebar */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-neutral-900 border border-white/10 rounded-2xl p-4 space-y-4 shadow-xl">
            <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest px-2 flex items-center gap-2">
                <Scissors className="w-3 h-3" /> أدوات التحليل
            </h3>
            <div className="grid grid-cols-2 gap-2">
                <ToolButton 
                    active={activeTool === 'select'} 
                    onClick={() => setActiveTool('select')}
                    icon={<MousePointer2 className="w-5 h-5" />}
                    label="تحديد"
                />
                <ToolButton 
                    active={activeTool === 'line'} 
                    onClick={() => setActiveTool('line')}
                    icon={<Slash className="w-5 h-5" />}
                    label="خط"
                />
                <ToolButton 
                    active={activeTool === 'angle'} 
                    onClick={() => setActiveTool('angle')}
                    icon={<Ruler className="w-5 h-5" />}
                    label="زاوية"
                />
                <ToolButton 
                    active={activeTool === 'circle'} 
                    onClick={() => setActiveTool('circle')}
                    icon={<Circle className="w-5 h-5" />}
                    label="دائرة"
                />
            </div>
            <button 
                onClick={() => setDrawings([])}
                className="w-full py-3 px-4 bg-white/5 hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-all text-xs font-bold border border-white/5 flex items-center justify-center gap-2"
            >
                <RefreshCcw className="w-4 h-4" />
                مسح الرسومات
            </button>
        </div>

        <div className="bg-neutral-900 border border-white/10 rounded-2xl p-4 space-y-4 shadow-xl">
            <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest px-2 flex items-center gap-2">
                 <Clock className="w-3 h-3" /> سرعة العرض
            </h3>
            <div className="flex bg-neutral-800 rounded-xl p-1">
                {[0.25, 0.5, 1].map(speed => (
                    <button
                        key={speed}
                        onClick={() => {
                            setPlaybackSpeed(speed);
                            if(videoRef.current) videoRef.current.playbackRate = speed;
                        }}
                        className={cn(
                            "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                            playbackSpeed === speed ? "bg-tennis-green text-black shadow-lg shadow-tennis-green/20" : "text-neutral-400 hover:text-white"
                        )}
                    >
                        {speed}x
                    </button>
                ))}
            </div>
        </div>

        <button 
            onClick={startAnalysis}
            disabled={isAnalyzing || !videoUrl}
            className={cn(
            "w-full py-4 px-4 rounded-2xl transition-all font-bold flex items-center justify-center gap-2 shadow-2xl",
            isAnalyzing || !videoUrl
                ? "bg-neutral-800 text-neutral-500 cursor-not-allowed" 
                : "bg-tennis-green text-black hover:scale-[1.02] active:scale-95 shadow-tennis-green/30"
            )}
        >
            {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            {isAnalyzing ? "جاري التحليل..." : "تحليل الذكاء الاصطناعي"}
        </button>

        <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-4 text-[10px] text-neutral-500 leading-relaxed">
            <p className="flex gap-2">
                <Info className="w-3 h-3 text-tennis-green shrink-0" />
                <span>استخدم أداة "الزاوية" لرسم ثلاث نقاط وحساب الزاوية الحركية (Joint Angle).</span>
            </p>
        </div>
      </div>

      {/* Main Analysis View */}
      <div className="lg:col-span-3 space-y-6">
        <div className="bg-neutral-900 border border-white/10 rounded-2xl overflow-hidden relative shadow-2xl">
          {!videoUrl ? (
            <div className="aspect-video flex flex-col items-center justify-center p-12 text-center relative">
              <input type="file" accept="video/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                <Upload className="w-8 h-8 text-tennis-green animate-bounce" />
              </div>
              <h3 className="text-xl font-bold mb-2">مختبر التحليل الحركي</h3>
              <p className="text-neutral-500 max-w-sm">قم برفع فيديو الضربة لبدء التحليل الهندسي (مثل Kinovea) والذكاء الاصطناعي</p>
              <div className="mt-8 flex gap-4 text-[10px] font-mono text-neutral-600 uppercase tracking-widest">
                <span>MP4</span>
                <span>MOV</span>
                <span>HIGH_FPS_READY</span>
              </div>
            </div>
          ) : (
            <div className="relative">
              <div className="relative bg-black aspect-video flex items-center justify-center overflow-hidden">
                <video 
                  ref={videoRef}
                  src={videoUrl} 
                  className="max-h-full max-w-full"
                  onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
                <canvas 
                    ref={overlayCanvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={endDrawing}
                    className={cn(
                        "absolute inset-0 w-full h-full cursor-crosshair",
                        activeTool === 'select' && "cursor-default pointer-events-none"
                    )}
                />
              </div>

              {/* Professional Video Controls */}
              <div className="p-5 bg-neutral-900 border-t border-white/10">
                <div className="flex items-center gap-4 mb-5">
                  <span className="text-[10px] font-mono text-tennis-green font-bold w-16">{formatTime(currentTime)}</span>
                  <input 
                    type="range" 
                    min={0} 
                    max={duration} 
                    step={0.001}
                    value={currentTime}
                    onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if(videoRef.current) videoRef.current.currentTime = val;
                    }}
                    className="flex-1 h-1.5 bg-neutral-800 rounded-full appearance-none cursor-pointer accent-tennis-green"
                  />
                  <span className="text-[10px] font-mono text-neutral-500 w-16 text-left">{formatTime(duration)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button 
                        onClick={() => stepFrame(-1)}
                        className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-neutral-300 transition-colors"
                        title="الإطار السابق"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={() => {
                            if(isPlaying) videoRef.current?.pause();
                            else videoRef.current?.play();
                        }}
                        className="p-4 bg-tennis-green hover:scale-110 active:scale-95 rounded-full text-black transition-all shadow-lg shadow-tennis-green/20"
                    >
                      {isPlaying ? <PauseCircle className="w-7 h-7" /> : <PlayCircle className="w-7 h-7" />}
                    </button>
                    <button 
                        onClick={() => stepFrame(1)}
                        className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-neutral-300 transition-colors"
                        title="الإطار التالي"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-4">
                     <div className="h-10 px-4 bg-neutral-800 rounded-xl flex items-center gap-3 border border-white/5">
                        <Target className="w-4 h-4 text-tennis-green" />
                        <span className="text-xs font-mono text-neutral-400">FRAME_STEPPER_READY</span>
                     </div>
                     <button 
                        onClick={() => {
                          if (videoUrl) URL.revokeObjectURL(videoUrl);
                          setVideoUrl(null); 
                          setVideoFile(null); 
                          setDrawings([]); 
                          setAnalysis(null);
                        }}
                        className="text-xs font-bold text-neutral-500 hover:text-red-500 transition-colors px-3 py-2"
                     >
                        تبديل الملف
                     </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results / Analysis Panel */}
        <AnimatePresence>
            {analysis && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-neutral-900 border border-white/10 rounded-2xl p-8 shadow-2xl relative"
                >
                    <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                        <Trophy className="w-32 h-32" />
                    </div>
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-3 bg-tennis-green/10 rounded-xl text-tennis-green">
                            <Sparkles className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold italic uppercase tracking-tight">تقرير التحليل الحركي</h2>
                            <p className="text-[10px] font-mono text-neutral-500">AI_MOTION_DECODED_v2.4</p>
                        </div>
                    </div>
                    <div className="markdown-body rtl text-right">
                        <Markdown>{analysis}</Markdown>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

function ToolButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
    return (
        <button 
            onClick={onClick}
            className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-300",
                active 
                    ? "bg-tennis-green border-tennis-green text-black scale-105 shadow-lg shadow-tennis-green/20" 
                    : "bg-white/5 border-white/5 text-neutral-500 hover:bg-neutral-800 hover:text-white"
            )}
        >
            {icon}
            <span className="text-[10px] font-black uppercase italic">{label}</span>
        </button>
    );
}

function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}
