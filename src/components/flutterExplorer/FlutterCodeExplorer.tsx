import React, { useState } from 'react';
import { 
  FileCode, 
  Copy, 
  Check, 
  Folder, 
  FolderOpen, 
  Code2, 
  Download, 
  ExternalLink,
  Sparkles,
  Terminal,
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import { FLUTTER_PROJECT_FILES, FlutterFile } from '../../data/flutterCodeRepository';

interface FlutterCodeExplorerProps {
  onClose?: () => void;
}

export const FlutterCodeExplorer: React.FC<FlutterCodeExplorerProps> = ({ onClose }) => {
  const [selectedFile, setSelectedFile] = useState<FlutterFile>(
    FLUTTER_PROJECT_FILES.find((f) => f.path === 'lib/screens/feed_screen.dart') || FLUTTER_PROJECT_FILES[0]
  );
  const [copied, setCopied] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadAll = () => {
    // Combine files into a downloadable text package / script
    const blob = new Blob(
      [
        `# Gym Chuột - Google Project IDX Flutter Code Export\n# Total files: ${FLUTTER_PROJECT_FILES.length}\n\n` +
          FLUTTER_PROJECT_FILES.map(
            (f) => `// ==========================================\n// FILE: ${f.path}\n// ==========================================\n${f.code}\n\n`
          ).join('\n'),
      ],
      { type: 'text/plain;charset=utf-8' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gym_chuot_flutter_code.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredFiles = FLUTTER_PROJECT_FILES.filter((f) => {
    const matchesCategory = activeCategory === 'all' || f.category === activeCategory;
    const matchesQuery =
      f.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100">
      {/* Header */}
      <div className="bg-zinc-950/85 backdrop-blur-xl border-b border-white/10 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="apple-icon-badge-accent">
            <Code2 className="w-5 h-5 stroke-[1.75]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-bold text-base text-zinc-100 tracking-tight">
                Google Project IDX Flutter Code Explorer
              </h2>
              <span className="text-[10px] font-semibold bg-[#E4483C] text-white px-2 py-0.5 rounded-full shadow-xs">
                Material 3 & Firebase Ready
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Kiến trúc code Flutter hoàn chỉnh, không dùng placeholder, 100% tiếng Việt chuẩn PRD
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadAll}
            className="apple-btn-secondary min-h-[38px] px-3.5 py-1.5 text-xs font-semibold gap-1.5"
          >
            <Download className="w-4 h-4 text-[#E4483C] stroke-[1.75]" />
            <span>Tải Toàn Bộ Code</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="apple-btn-primary min-h-[38px] px-4 py-1.5 text-xs font-semibold"
            >
              Đóng
            </button>
          )}
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Sidebar: File Tree & Categories */}
        <div className="w-full md:w-80 bg-zinc-900/60 border-r border-white/10 flex flex-col shrink-0">
          {/* Search bar */}
          <div className="p-3 border-b border-white/10">
            <input
              type="text"
              placeholder="Tìm file theo tên..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full min-h-[38px] bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#E4483C] transition-colors"
            />
          </div>

          {/* Category Filter Pills (Apple Segmented Control style) */}
          <div className="flex gap-1 p-2 overflow-x-auto border-b border-white/10 no-scrollbar">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'screens', label: 'Screens' },
              { id: 'widgets', label: 'Widgets' },
              { id: 'models', label: 'Models' },
              { id: 'providers', label: 'Providers' },
              { id: 'services', label: 'Services' },
              { id: 'theme', label: 'Theme' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`min-h-[32px] px-2.5 py-1 rounded-xl text-xs font-semibold shrink-0 transition-all duration-200 active:scale-[0.98] border ${
                  activeCategory === cat.id
                    ? 'bg-white text-zinc-950 border-white shadow-xs'
                    : 'bg-white/[0.04] text-zinc-400 hover:text-white border-white/10'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Files List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredFiles.map((file) => {
              const isSelected = selectedFile.path === file.path;
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left p-2.5 rounded-xl transition-all duration-200 flex flex-col gap-0.5 border active:scale-[0.99] ${
                    isSelected
                      ? 'bg-[#E4483C]/15 border-[#E4483C]/50 text-zinc-100 shadow-xs'
                      : 'bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileCode className={`w-4 h-4 shrink-0 stroke-[1.75] ${isSelected ? 'text-[#E4483C]' : 'text-zinc-500'}`} />
                    <span className="font-mono text-xs font-bold truncate">{file.path}</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 truncate pl-6">
                    {file.description}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Project IDX Run Command Hint */}
          <div className="p-3 bg-zinc-950/80 border-t border-white/10">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 mb-1">
              <Terminal className="w-3.5 h-3.5 text-emerald-400 stroke-[1.75]" />
              <span>Lệnh chạy trong Project IDX:</span>
            </div>
            <code className="text-[11px] font-mono bg-black/50 p-2 rounded-xl border border-white/10 block text-[#E4483C]">
              flutter pub get && flutter run -d chrome
            </code>
          </div>
        </div>

        {/* Right Editor: Code Viewer with Copy */}
        <div className="flex-1 flex flex-col bg-zinc-950 overflow-hidden">
          {/* File Tab Header */}
          <div className="bg-zinc-950/80 border-b border-white/10 px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-[#E4483C] stroke-[1.75]" />
              <span className="font-mono text-xs font-bold text-zinc-100">{selectedFile.path}</span>
              <span className="text-[11px] text-zinc-500 hidden sm:inline">• {selectedFile.description}</span>
            </div>

            <button
              onClick={handleCopy}
              className="apple-btn-secondary min-h-[34px] px-3 py-1 text-xs font-semibold gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[2]" /> : <Copy className="w-3.5 h-3.5 text-zinc-400 stroke-[1.75]" />}
              <span>{copied ? 'Đã sao chép!' : 'Sao chép file'}</span>
            </button>
          </div>

          {/* Syntax Highlighted Code Box */}
          <div className="flex-1 p-4 overflow-auto font-mono text-xs leading-relaxed text-zinc-300 bg-black/40">
            <pre className="whitespace-pre overflow-x-auto selection:bg-[#E4483C] selection:text-white">
              {selectedFile.code}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
