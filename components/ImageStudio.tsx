import React, { useState, useRef } from 'react';
import { editImageWithGemini } from '../services/geminiService';
import { Button } from './ui/Button';
import { Image as ImageIcon, Sparkles, Upload, Download, Undo2, Eraser, Wand2 } from 'lucide-react';

const MAX_HISTORY_LENGTH = 12;
const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;

export const ImageStudio: React.FC = () => {
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setStatusMessage({ type: 'error', text: 'Please upload an image file.' });
        input.value = '';
        return;
      }

      if (file.size > MAX_UPLOAD_SIZE_BYTES) {
        setStatusMessage({ type: 'error', text: 'Image too large. Use a file under 10MB.' });
        input.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setCurrentImage(base64String);
        setHistory([base64String]);
        setPrompt('');
        setStatusMessage({ type: 'success', text: 'Image loaded.' });
      };
      reader.readAsDataURL(file);
    }
    input.value = '';
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedPrompt = prompt.trim();
    if (!currentImage || !trimmedPrompt) return;

    setIsProcessing(true);
    setStatusMessage(null);
    try {
      const editedImage = await editImageWithGemini(currentImage, trimmedPrompt);
      setHistory(prev => [...prev, editedImage].slice(-MAX_HISTORY_LENGTH));
      setCurrentImage(editedImage);
      setPrompt('');
      setStatusMessage({ type: 'success', text: 'Edit generated successfully.' });
    } catch (error) {
      console.error(error);
      setStatusMessage({ type: 'error', text: 'Failed to edit image. Try a simpler instruction.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUndo = () => {
    if (history.length > 1) {
      const newHistory = history.slice(0, -1);
      setHistory(newHistory);
      setCurrentImage(newHistory[newHistory.length - 1]);
    }
  };

  const triggerUpload = () => fileInputRef.current?.click();

  const handleDownload = () => {
    if (currentImage) {
      const link = document.createElement('a');
      link.href = currentImage;
      link.download = `edited-image-${Date.now()}.png`;
      link.click();
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto pb-20">
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[700px]">
        {/* Editor Controls */}
        <div className="lg:col-span-4 flex flex-col h-full">
          {/* Upload Area */}
          {!currentImage ? (
             <div 
              onClick={triggerUpload}
              className="flex-1 border border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-white/[0.02] transition-all p-8 group bg-surface/30 backdrop-blur-sm"
            >
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Upload className="w-8 h-8 text-muted group-hover:text-primary transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Upload Source Image</h3>
              <p className="text-sm text-muted">Click or drag and drop to start editing</p>
            </div>
          ) : (
            <div className="bg-surface/50 backdrop-blur-xl border border-white/5 p-6 rounded-2xl shadow-2xl space-y-6 flex-1 flex flex-col">
              <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <Wand2 className="w-5 h-5 text-primary" />
                    <h3 className="text-white font-bold">Magic Editor</h3>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={handleUndo} 
                    disabled={history.length <= 1 || isProcessing}
                    className="p-2 hover:bg-white/10 rounded-lg text-muted disabled:opacity-30 transition-colors"
                    title="Undo"
                  >
                    <Undo2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => {
                        setCurrentImage(null);
                        setHistory([]);
                        setPrompt('');
                        setStatusMessage(null);
                    }} 
                    className="p-2 hover:bg-red-500/10 hover:text-red-400 rounded-lg text-muted transition-colors"
                    title="Clear All"
                  >
                    <Eraser className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleEdit} className="space-y-4 flex-1 flex flex-col">
                <div className="flex-1 group">
                    <label className="block text-xs font-medium text-gray-400 mb-2 group-focus-within:text-white transition-colors">Prompt Instruction</label>
                    <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., Change background to a cyber city, Add a neon glow, Make it black and white..."
                    className="w-full h-full min-h-[200px] bg-black/20 border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:ring-1 focus:ring-primary focus:border-primary/50 outline-none resize-none transition-all hover:bg-white/5"
                    />
                </div>
                
                <Button type="submit" isLoading={isProcessing} disabled={!prompt} className="w-full py-4 shadow-lg shadow-primary/20">
                    <Sparkles className="w-4 h-4" />
                    Generate Edit
                </Button>
              </form>

              {statusMessage && (
                <p className={`text-xs ${statusMessage.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>
                  {statusMessage.text}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Image Preview Canvas */}
        <div className="lg:col-span-8 bg-[#0a0a0a] border border-white/5 rounded-3xl overflow-hidden relative flex items-center justify-center p-8 shadow-2xl">
            {/* Checkerboard pattern for transparency */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" 
                 style={{ backgroundImage: 'linear-gradient(45deg, #222 25%, transparent 25%), linear-gradient(-45deg, #222 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #222 75%), linear-gradient(-45deg, transparent 75%, #222 75%)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px' }}>
            </div>

            {currentImage ? (
                <div className="relative w-full h-full flex items-center justify-center group z-10">
                    <img 
                        src={currentImage} 
                        alt="Current workspace" 
                        className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
                    />
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 duration-300">
                        <Button variant="secondary" onClick={handleDownload} className="shadow-xl">
                            <Download className="w-4 h-4" />
                            Download
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="text-center space-y-6 z-10 opacity-50">
                    <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mx-auto border border-white/5">
                        <ImageIcon className="w-10 h-10 text-muted" />
                    </div>
                    <p className="text-muted font-medium tracking-wide uppercase text-sm">Workspace Empty</p>
                </div>
            )}
            
            {isProcessing && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-20 backdrop-blur-md transition-all duration-500">
                    <div className="relative">
                        <div className="w-16 h-16 border-t-2 border-b-2 border-primary rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-primary animate-pulse" />
                        </div>
                    </div>
                    <p className="text-white font-medium mt-6 animate-pulse tracking-wide">Refining pixels...</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
