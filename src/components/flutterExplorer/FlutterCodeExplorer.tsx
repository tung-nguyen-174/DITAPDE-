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
    <div className="flex flex-col h-full bg-[#121214] text-white">
      {/* Header */}
      <div className="bg-[#18181D] border-b border-[#2A2A33] p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#00E5FF]/15 text-[#00E5FF]">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-black text-base text-white">Google Project IDX Flutter Code Explorer</h2>
              <span className="text-[10px] font-black bg-[#FF5722] text-white px-2 py-0.5 rounded-full">
                Material 3 & Firebase Ready
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Kiến trúc code Flutter hoàn chỉnh, không dùng placeholder, 100% tiếng Việt chuẩn PRD
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#26262B] hover:bg-[#34343E] text-xs font-bold text-gray-200 border border-[#3A3A44] transition"
          >
            <Download className="w-4 h-4 text-[#00E5FF]" />
            <span>Tải Toàn Bộ Code</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-[#FF5722] text-white text-xs font-black"
            >
              Đóng
            </button>
          )}
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Sidebar: File Tree & Categories */}
        <div className="w-full md:w-80 bg-[#16161A] border-r border-[#26262F] flex flex-col shrink-0">
          {/* Search bar */}
          <div className="p-3 border-b border-[#26262F]">
            <input
              type="text"
              placeholder="Tìm file theo tên..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1F1F26] border border-[#2F2F3D] rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-hidden focus:border-[#00E5FF]"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex gap-1 p-2 overflow-x-auto border-b border-[#26262F] no-scrollbar">
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
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold shrink-0 transition ${
                  activeCategory === cat.id
                    ? 'bg-[#00E5FF] text-black'
                    : 'bg-[#222228] text-gray-400 hover:text-white'
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
                  className={`w-full text-left p-2.5 rounded-xl transition flex flex-col gap-0.5 border ${
                    isSelected
                      ? 'bg-[#FF5722]/15 border-[#FF5722] text-white shadow-xs'
                      : 'bg-[#1A1A1F] border-transparent text-gray-400 hover:bg-[#222228] hover:text-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileCode className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[#FF5722]' : 'text-gray-400'}`} />
                    <span className="font-mono text-xs font-bold truncate">{file.path}</span>
                  </div>
                  <span className="text-[10px] text-gray-500 truncate pl-6">
                    {file.description}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Project IDX Run Command Hint */}
          <div className="p-3 bg-[#111113] border-t border-[#26262F]">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-300 mb-1">
              <Terminal className="w-3.5 h-3.5 text-[#10B981]" />
              <span>Lệnh chạy trong Project IDX:</span>
            </div>
            <code className="text-[11px] font-mono bg-[#1E1E24] p-1.5 rounded block text-[#00E5FF]">
              flutter pub get && flutter run -d chrome
            </code>
          </div>
        </div>

        {/* Right Editor: Code Viewer with Copy */}
        <div className="flex-1 flex flex-col bg-[#141418] overflow-hidden">
          {/* File Tab Header */}
          <div className="bg-[#18181D] border-b border-[#26262F] px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-[#FF5722]" />
              <span className="font-mono text-xs font-black text-white">{selectedFile.path}</span>
              <span className="text-[11px] text-gray-500 hidden sm:inline">• {selectedFile.description}</span>
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#26262B] hover:bg-[#34343E] text-xs font-bold text-white border border-[#3A3A44] transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5 text-gray-300" />}
              <span>{copied ? 'Đã sao chép!' : 'Sao chép file'}</span>
            </button>
          </div>

          {/* Syntax Highlighted Code Box */}
          <div className="flex-1 p-4 overflow-auto font-mono text-xs leading-relaxed text-gray-200 bg-[#0F0F12]">
            <pre className="whitespace-pre overflow-x-auto selection:bg-[#FF5722] selection:text-white">
              {selectedFile.code}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
