import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, CheckCircle, Upload } from 'lucide-react';
import axios from 'axios';

interface SubmitProgressModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { content: string; percentage: number; attachments: any[] }) => void;
}

export default function SubmitProgressModal({ isOpen, onClose, onSubmit }: SubmitProgressModalProps) {
    const [content, setContent] = useState('');
    const [percentage, setPercentage] = useState(0);
    const [attachments, setAttachments] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const response = await axios.post('https://hub-for-skill-exchange-and-collaboration.onrender.com/api/v1/files/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                withCredentials: true
            });

            setAttachments(prev => [...prev, {
                name: file.name,
                url: response.data.data.fileUrl,
                type: response.data.data.fileType
            }]);
        } catch (error) {
            console.error("Upload failed", error);
            alert("Failed to upload file");
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ content, percentage, attachments });
        setContent('');
        setPercentage(0);
        setAttachments([]);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden"
                >
                    <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
                        <h3 className="text-xl font-bold text-neutral-900 flex items-center">
                            <CheckCircle className="w-5 h-5 mr-2 text-success-600" />
                            Submit Progress
                        </h3>
                        <button onClick={onClose} className="p-2 hover:bg-neutral-200 rounded-full transition-colors">
                            <X className="w-5 h-5 text-neutral-500" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-neutral-700 mb-2">
                                What did you accomplish?
                            </label>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="w-full p-4 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none min-h-[120px] resize-none text-neutral-700 placeholder-neutral-400"
                                placeholder="Describe your work done today..."
                                required
                            />
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-bold text-neutral-700">
                                    Completion Status
                                </label>
                                <span className="text-sm font-black text-primary-600 bg-primary-50 px-2 py-1 rounded-md">
                                    {percentage}%
                                </span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                step="10"
                                value={percentage}
                                onChange={(e) => setPercentage(Number(e.target.value))}
                                className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                            />
                            <div className="flex justify-between text-xs text-neutral-400 mt-2 font-medium">
                                <span>Started</span>
                                <span>Halfway</span>
                                <span>Done</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-neutral-700 mb-2">
                                Attachments
                            </label>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {attachments.map((file, idx) => (
                                    <div key={idx} className="flex items-center bg-neutral-50 border border-neutral-200 px-3 py-1.5 rounded-lg text-sm">
                                        <FileText className="w-4 h-4 mr-2 text-neutral-400" />
                                        <span className="truncate max-w-[150px]">{file.name}</span>
                                        <button
                                            type="button"
                                            onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                                            className="ml-2 text-neutral-400 hover:text-error-500"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="flex items-center justify-center w-full p-3 border-2 border-dashed border-neutral-200 rounded-xl text-neutral-500 hover:border-primary-500 hover:text-primary-600 transition-colors font-medium disabled:opacity-50"
                            >
                                {isUploading ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600" />
                                ) : (
                                    <>
                                        <Upload className="w-5 h-5 mr-2" />
                                        Upload Proof of Work
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                className="w-full py-4 bg-gradient-to-r from-primary-600 to-primary-600 text-white rounded-xl font-bold shadow-lg shadow-primary-200 hover:from-primary-700 hover:to-primary-700 transition-all flex items-center justify-center"
                            >
                                <CheckCircle className="w-5 h-5 mr-2" />
                                Submit Report
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
