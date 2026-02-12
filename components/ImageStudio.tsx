import React, { useState } from 'react';
import { generateOrEditImage } from '../services/geminiService';
import { Image as ImageIcon, Sparkles, Upload, Loader2, ArrowRight } from 'lucide-react';

const ImageStudio: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [resultText, setResultText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remove data URL prefix for API
        const base64Data = base64String.split(',')[1];
        setBaseImage(base64Data);
        // Keep full string for preview
        const preview = document.getElementById('preview-image') as HTMLImageElement;
        if (preview) preview.src = base64String;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsLoading(true);
    setResultImage(null);
    setResultText(null);

    const result = await generateOrEditImage(prompt, baseImage || undefined);
    
    setResultImage(result.imageUrl);
    setResultText(result.text);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-6 overflow-y-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ImageIcon className="w-6 h-6 text-purple-500" />
          Image Studio
        </h2>
        <p className="text-slate-500 dark:text-slate-400">Powered by Gemini 2.5 Flash Image. Generate or edit images with text.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto w-full">
        {/* Input Section */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
             <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
               Base Image (Optional)
             </label>
             <div className="relative group">
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center text-slate-400 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-colors cursor-pointer relative overflow-hidden h-48">
                   {baseImage ? (
                      <img id="preview-image" src={`data:image/png;base64,${baseImage}`} className="absolute inset-0 w-full h-full object-contain" />
                   ) : (
                      <>
                        <Upload className="w-8 h-8 mb-2" />
                        <span className="text-sm">Click to upload image to edit</span>
                      </>
                   )}
                   <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
                {baseImage && (
                  <button onClick={() => setBaseImage(null)} className="absolute top-2 right-2 bg-slate-900/80 text-white text-xs px-2 py-1 rounded">Clear</button>
                )}
             </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
             <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
               Prompt
             </label>
             <textarea 
               value={prompt}
               onChange={(e) => setPrompt(e.target.value)}
               className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-xl p-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 resize-none"
               rows={4}
               placeholder="Describe what you want to see, or how to edit the image above (e.g. 'Add a retro filter')"
             />
             <button 
               onClick={handleGenerate}
               disabled={!prompt || isLoading}
               className="mt-4 w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
             >
               {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
               {isLoading ? 'Generating...' : 'Generate Image'}
             </button>
          </div>
        </div>

        {/* Output Section */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
           <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Result</h3>
           <div className="flex-1 bg-slate-100 dark:bg-slate-950 rounded-xl flex items-center justify-center overflow-hidden min-h-[300px]">
              {resultImage ? (
                <img src={resultImage} alt="Generated" className="max-w-full max-h-full object-contain" />
              ) : resultText ? (
                <div className="p-4 text-slate-600 dark:text-slate-300 text-center">{resultText}</div>
              ) : (
                <div className="text-slate-400 text-sm flex flex-col items-center">
                   <ImageIcon className="w-12 h-12 mb-2 opacity-20" />
                   Generated image will appear here
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default ImageStudio;