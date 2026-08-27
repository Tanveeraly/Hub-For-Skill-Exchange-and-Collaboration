import { useState } from 'react';
import axios from 'axios';
import { X, AlertTriangle, Send } from 'lucide-react';
import Alert from './Alert';

interface ComplaintModalProps {
    onClose: () => void;
}

export default function ComplaintModal({ onClose }: ComplaintModalProps) {
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await axios.post(
                'http://localhost:5000/api/v1/admin/complaints',
                { subject, description },
                { withCredentials: true }
            );

            if (res.status === 200 || res.status === 201) {
                setSuccess('Your complaint has been submitted successfully.');
                setSubject('');
                setDescription('');
                setTimeout(() => {
                    onClose();
                }, 2000);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to submit complaint. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Report an Issue</h2>
                        <p className="text-sm text-gray-500">Let us know what's going wrong.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && <Alert type="error" message={error} />}
                    {success && <Alert type="Success" message={success} />}

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Subject</label>
                        <input
                            type="text"
                            required
                            placeholder="Briefly describe the issue..."
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Details</label>
                        <textarea
                            required
                            rows={4}
                            placeholder="Please provide as much detail as possible so our admins can investigate..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all resize-none"
                        ></textarea>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading || !subject || !description}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    Submit Complaint
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
