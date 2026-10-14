import React, { useRef, useState, useEffect } from 'react';

export default function App() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('pen'); // 'pen' or 'eraser'
  const [brushColor, setBrushColor] = useState('#ffffff');
  const [penSize, setPenSize] = useState(3);
  const [eraserSize, setEraserSize] = useState(15);
  const [bgColor, setBgColor] = useState('#0f172a'); // Default dark slate
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Custom modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isLastPageAction, setIsLastPageAction] = useState(false);

  // Multi-page state
  const [pages, setPages] = useState(['']); 
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const pagesRef = useRef(pages);
  pagesRef.current = pages;

  const currentPageIndexRef = useRef(currentPageIndex);
  currentPageIndexRef.current = currentPageIndex;

  const loadPageToCanvas = (index, targetPages = pagesRef.current, background = bgColor) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.width = window.innerWidth * 0.92;
    canvas.height = window.innerHeight * 0.74; // Adjusted slightly to fit footer cleanly

    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Clear and set background
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const savedData = targetPages[index];
    if (savedData) {
      const img = new Image();
      img.src = savedData;
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
    }
  };

  useEffect(() => {
    loadPageToCanvas(currentPageIndex);

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      setTimeout(() => loadPageToCanvas(currentPageIndex), 100);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [currentPageIndex, bgColor]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        alert(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const saveCanvasState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL();
    setPages(prev => {
      const updated = [...prev];
      updated[currentPageIndexRef.current] = dataUrl;
      return updated;
    });
  };

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === 'pen') {
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = penSize;
    } else {
      ctx.strokeStyle = bgColor;
      ctx.lineWidth = eraserSize;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    saveCanvasState();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveCanvasState();
  };

  const addPage = () => {
    saveCanvasState();
    setPages(prev => {
      const updated = [...prev, ''];
      setCurrentPageIndex(updated.length - 1);
      return updated;
    });
  };

  const handleDeleteClick = () => {
    if (pages.length === 1) {
      setIsLastPageAction(true);
      setDeleteModalOpen(true);
      return;
    }
    setIsLastPageAction(false);
    setDeleteModalOpen(true);
  };

  const handleModalConfirm = () => {
    setDeleteModalOpen(false);

    if (isLastPageAction) {
      clearCanvas();
    } else {
      const targetIndex = currentPageIndex;
      setPages(prevPages => {
        const updatedPages = prevPages.filter((_, i) => i !== targetIndex);
        let newIndex = targetIndex > 0 ? targetIndex - 1 : 0;
        setCurrentPageIndex(newIndex);
        
        setTimeout(() => {
          loadPageToCanvas(newIndex, updatedPages);
        }, 0);

        return updatedPages;
      });
    }
  };

  const goToPrevPage = () => {
    if (currentPageIndex > 0) {
      saveCanvasState();
      setCurrentPageIndex(currentPageIndex - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPageIndex < pages.length - 1) {
      saveCanvasState();
      setCurrentPageIndex(currentPageIndex + 1);
    }
  };

  const downloadNotes = () => {
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = `studypad-page-${currentPageIndex + 1}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const getGridStyle = () => {
    if (bgColor === '#0f172a') return 'radial-gradient(#334155 1.5px, transparent 1.5px)';
    if (bgColor === '#ffffff') return 'radial-gradient(#cbd5e1 1.5px, transparent 1.5px)';
    return 'radial-gradient(#d1d5db 1.5px, transparent 1.5px)';
  };

  return (
    <div ref={containerRef} className="flex flex-col min-h-screen bg-slate-950 text-slate-100 p-4 select-none pb-20 relative">
      
      {/* Top Header & Centered Toolbar Container */}
      <div className="flex flex-col md:flex-row items-center justify-between w-full mb-3 gap-3">
        
        {/* Left Side: Title */}
        <div className="text-left">
          <h1 className="text-xl font-black tracking-wider text-indigo-400">STUDYPAD 📚</h1>
          <p className="text-[10px] text-slate-400">Pentab Optimized Notebook</p>
        </div>

        {/* Top Center: Tools & Size Sliders */}
        <div className="flex flex-wrap gap-3 items-center bg-slate-900 border border-slate-800 p-2.5 rounded-xl shadow-xl">
          
          {/* Pen Group */}
          <div className="flex items-center gap-2 bg-slate-950/60 p-1.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setTool('pen')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${tool === 'pen' ? 'bg-indigo-600 text-white shadow' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
            >
              Pen 🖊️
            </button>
            <div className="flex flex-col text-[10px] text-slate-400 px-1">
              <span>Size: {penSize}</span>
              <input
                type="range"
                min="1"
                max="15"
                value={penSize}
                onChange={(e) => setPenSize(Number(e.target.value))}
                className="w-16 cursor-pointer accent-indigo-500 h-1"
              />
            </div>
            <input
              type="color"
              value={brushColor}
              onChange={(e) => setBrushColor(e.target.value)}
              className="w-5 h-5 rounded border-0 cursor-pointer bg-transparent"
              title="Pen Color"
            />
          </div>

          {/* Eraser Group */}
          <div className="flex items-center gap-2 bg-slate-950/60 p-1.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setTool('eraser')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${tool === 'eraser' ? 'bg-indigo-600 text-white shadow' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
            >
              Eraser 🧹
            </button>
            <div className="flex flex-col text-[10px] text-slate-400 px-1">
              <span>Size: {eraserSize}</span>
              <input
                type="range"
                min="5"
                max="40"
                value={eraserSize}
                onChange={(e) => setEraserSize(Number(e.target.value))}
                className="w-16 cursor-pointer accent-indigo-500 h-1"
              />
            </div>
          </div>

          <div className="h-5 w-[1px] bg-slate-700" />

          {/* Background Theme Selector */}
          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <span>Theme:</span>
            <button 
              onClick={() => setBgColor('#0f172a')} 
              className={`w-5 h-5 rounded-full bg-slate-900 border ${bgColor === '#0f172a' ? 'border-indigo-400 scale-110' : 'border-slate-700'}`} 
              title="Dark Slate"
            />
            <button 
              onClick={() => setBgColor('#ffffff')} 
              className={`w-5 h-5 rounded-full bg-white border ${bgColor === '#ffffff' ? 'border-indigo-400 scale-110' : 'border-slate-300'}`} 
              title="Clean White"
            />
            <button 
              onClick={() => setBgColor('#fdf6e2')} 
              className={`w-5 h-5 rounded-full bg-[#fdf6e2] border ${bgColor === '#fdf6e2' ? 'border-indigo-400 scale-110' : 'border-slate-300'}`} 
              title="Study Cream"
            />
          </div>

          <div className="h-5 w-[1px] bg-slate-700" />

          {/* Fullscreen Toggle Button */}
          <button
            onClick={toggleFullscreen}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-700 transition-all"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? '⤢ Exit FS' : '⛶ Fullscreen'}
          </button>

          <button
            onClick={clearCanvas}
            className="bg-rose-950/60 hover:bg-rose-900 text-rose-300 px-2.5 py-1 text-xs font-semibold rounded-lg border border-rose-800 transition-all"
          >
            Clear
          </button>
          <button
            onClick={downloadNotes}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 text-xs font-semibold rounded-lg transition-all shadow"
          >
            Export 📥
          </button>
        </div>
      </div>

      {/* Maximized Canvas Area */}
      <div className="flex justify-center w-full flex-grow">
        <div className="border border-slate-800 rounded-xl overflow-hidden shadow-2xl relative w-full flex justify-center">
          <canvas
            ref={canvasRef}
            onPointerDown={startDrawing}
            onPointerMove={draw}
            onPointerUp={stopDrawing}
            onPointerLeave={stopDrawing}
            className={`touch-none block ${tool === 'eraser' ? 'cursor-cell' : 'cursor-crosshair'}`}
            style={{
              backgroundColor: bgColor,
              backgroundImage: getGridStyle(),
              backgroundSize: '24px 24px'
            }}
          />
        </div>
      </div>

      {/* Footer Branding */}
      <footer className="mt-2 text-center text-[11px] text-slate-500">
        © 2026 StudyPad. All rights reserved. Created by{' '}
        <a 
          href="https://github.com/raunakranjann" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-indigo-400 hover:underline font-semibold"
        >
          Raunak Ranjan
        </a>
      </footer>

      {/* Bottom Right Page Manager Bar */}
      <div className="fixed bottom-4 right-4 flex items-center gap-3 bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl shadow-2xl z-50">
        <div className="flex items-center gap-2">
          <button
            onClick={goToPrevPage}
            disabled={currentPageIndex === 0}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-lg text-xs font-bold transition-all"
            title="Previous Page"
          >
            &lt;
          </button>
          
          <span className="text-xs font-semibold text-slate-300 min-w-[80px] text-center">
            Page {currentPageIndex + 1} of {pages.length}
          </span>

          <button
            onClick={goToNextPage}
            disabled={currentPageIndex === pages.length - 1}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-lg text-xs font-bold transition-all"
            title="Next Page"
          >
            &gt;
          </button>
        </div>

        <div className="h-4 w-[1px] bg-slate-700" />

        <div className="flex items-center gap-2">
          <button
            onClick={addPage}
            className="bg-emerald-600 hover:bg-emerald-500 text-white w-7 h-7 rounded-lg text-xs font-bold shadow-md transition-all flex items-center justify-center"
            title="Add New Page"
          >
            +
          </button>

          <button
            onClick={handleDeleteClick}
            className="bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 w-7 h-7 rounded-lg text-xs font-bold shadow-md transition-all flex items-center justify-center"
            title="Delete Current Page"
          >
            ×
          </button>
        </div>
      </div>

      {/* Custom Modal Popup */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl max-w-sm w-full text-center">
            <h3 className="text-base font-bold text-slate-100 mb-2">
              {isLastPageAction ? "Clear Last Page?" : `Delete Page ${currentPageIndex + 1}?`}
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              {isLastPageAction 
                ? "This is your last remaining page, so it cannot be deleted. Would you like to clear the board instead?" 
                : "Are you sure you want to delete this page? This action cannot be undone."}
            </p>
            
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all w-full"
              >
                Cancel
              </button>
              <button
                onClick={handleModalConfirm}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl shadow-lg transition-all w-full"
              >
                {isLastPageAction ? "Clear Board" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}