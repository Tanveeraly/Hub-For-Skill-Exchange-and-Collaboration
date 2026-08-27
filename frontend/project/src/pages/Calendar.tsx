import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, User, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Calendar() {
    const { received, sent } = useSelector((state: RootState) => state.swaps);
    const [currentDate, setCurrentDate] = useState(new Date());
    const allSwaps = [...received, ...sent].filter(s => s.status === 'ACCEPTED');

    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const monthDays = daysInMonth(currentDate.getFullYear(), currentDate.getMonth());
    const firstDay = firstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());

    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    const getSwapsForDay = (day: number) => {
        return allSwaps.filter(s => {
            const date = new Date(s.scheduledAt);
            return date.getDate() === day &&
                date.getMonth() === currentDate.getMonth() &&
                date.getFullYear() === currentDate.getFullYear();
        });
    };

    return (
        <div className="min-h-screen bg-neutral-50 pt-24 pb-12 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-neutral-900">Exchange Calendar</h1>
                        <p className="text-neutral-500">Track all your sessions and meetings in one place</p>
                    </div>
                    <div className="flex items-center bg-white rounded-2xl p-2 shadow-sm border border-neutral-100">
                        <button onClick={prevMonth} className="p-2 hover:bg-neutral-50 rounded-xl"><ChevronLeft /></button>
                        <span className="px-6 font-bold text-neutral-700">
                            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </span>
                        <button onClick={nextMonth} className="p-2 hover:bg-neutral-50 rounded-xl"><ChevronRight /></button>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-4 mb-4">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-center text-xs font-black text-neutral-400 uppercase tracking-widest">{day}</div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-4">
                    {[...Array(firstDay)].map((_, i) => (
                        <div key={`empty-${i}`} className="h-32 bg-neutral-100/50 rounded-3xl opacity-50" />
                    ))}
                    {[...Array(monthDays)].map((_, i) => {
                        const day = i + 1;
                        const swaps = getSwapsForDay(day);
                        const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();

                        return (
                            <div key={day} className={`h-48 bg-white rounded-3xl p-4 shadow-sm border border-neutral-100 transition-all hover:shadow-md relative group ${isToday ? 'ring-2 ring-primary-600' : ''}`}>
                                <span className={`text-lg font-black ${isToday ? 'text-primary-600' : 'text-neutral-300 group-hover:text-neutral-900'}`}>{day}</span>

                                <div className="mt-2 space-y-1 overflow-y-auto max-h-32">
                                    {swaps.map(swap => (
                                        <div key={swap.id} className="text-[10px] bg-primary-50 text-primary-700 p-2 rounded-xl font-bold border border-primary-100 truncate flex flex-col">
                                            <span className="truncate">{swap.offeredSkill}</span>
                                            <div className="flex items-center mt-1 text-primary-400">
                                                <Clock className="w-2.5 h-2.5 mr-1" />
                                                {new Date(swap.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
