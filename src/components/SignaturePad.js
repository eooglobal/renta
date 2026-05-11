'use client';

import { useRef, useState, useEffect } from 'react';
import { Eraser, Check, X } from 'lucide-react';

export default function SignaturePad({ onSave, onCancel, title = "Sign Agreement" }) {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isEmpty, setIsEmpty] = useState(true);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        // Handle high DPI screens
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }, []);

    const startDrawing = (e) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || e.touches[0].clientX) - rect.left;
        const y = (e.clientY || e.touches[0].clientY) - rect.top;

        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
        const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;

        ctx.lineTo(x, y);
        ctx.stroke();
        setIsEmpty(false);
        
        // Prevent scrolling while drawing on touch devices
        if (e.touches) {
            e.preventDefault();
        }
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clear = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setIsEmpty(true);
    };

    const handleSave = () => {
        if (isEmpty) return;
        const canvas = canvasRef.current;
        const dataUrl = canvas.toDataURL('image/png');
        onSave(dataUrl);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-bottom flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-xl m-0">{title}</h3>
                    <button onClick={onCancel} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-6">
                    <p className="text-muted text-sm mb-4">Please sign inside the box below. Use your mouse or touch screen.</p>
                    
                    <div className="relative border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 overflow-hidden touch-none" style={{ height: '200px' }}>
                        <canvas
                            ref={canvasRef}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            onTouchStart={startDrawing}
                            onTouchMove={draw}
                            onTouchEnd={stopDrawing}
                            className="w-full h-full cursor-crosshair"
                        />
                        {isEmpty && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                                <span className="text-2xl font-serif italic">Sign Here</span>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-4 mt-8">
                        <button 
                            type="button" 
                            onClick={clear}
                            className="btn btn-outline flex-1 flex items-center justify-center gap-2"
                        >
                            <Eraser size={18} /> Clear
                        </button>
                        <button 
                            type="button" 
                            onClick={handleSave}
                            disabled={isEmpty}
                            className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                        >
                            <Check size={18} /> Confirm Signature
                        </button>
                    </div>
                </div>
                
                <div className="bg-blue-50 p-4 border-t border-blue-100">
                    <p className="text-xs text-blue-800 text-center m-0">
                        By signing, you agree that this electronic signature is as legally binding as a handwritten signature.
                    </p>
                </div>
            </div>
        </div>
    );
}
