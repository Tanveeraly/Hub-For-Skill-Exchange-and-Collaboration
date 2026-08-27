import { useState, useMemo } from 'react';
import { X, Search, Plus, Award, ChevronRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SKILL_CATEGORIES, ALL_SKILLS } from '../constants/skills';

interface SkillModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (skills: { name: string, level: string }[]) => void;
    existingSkills: string[];
}

interface SelectedSkill {
    name: string;
    level: string;
}

export default function SkillModal({ isOpen, onClose, onAdd, existingSkills }: SkillModalProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedSkills, setSelectedSkills] = useState<SelectedSkill[]>([]);
    const [expertiseLevel, setExpertiseLevel] = useState("Beginner");
    const [manualSkill, setManualSkill] = useState("");

    const expertiseLevels = ["Beginner", "Intermediate", "Advanced", "Expert"];

    const filteredSkills = useMemo(() => {
        if (searchTerm.trim() === "") {
            if (selectedCategory) {
                return SKILL_CATEGORIES.find(c => c.name === selectedCategory)?.skills || [];
            }
            return [];
        }
        return ALL_SKILLS.filter(s =>
            s.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, selectedCategory]);

    const handleToggleSkill = (skillName: string) => {
        setSelectedSkills(prev => {
            const exists = prev.find(s => s.name === skillName);
            if (exists) {
                return prev.filter(s => s.name !== skillName);
            }
            return [...prev, { name: skillName, level: expertiseLevel }];
        });
    };

    const handleAdd = () => {
        if (selectedSkills.length > 0) {
            onAdd(selectedSkills);
            reset();
            onClose();
        } else if (manualSkill.trim()) {
            onAdd([{ name: manualSkill, level: expertiseLevel }]);
            reset();
            onClose();
        }
    };

    const reset = () => {
        setSearchTerm("");
        setSelectedCategory(null);
        setSelectedSkills([]);
        setExpertiseLevel("Beginner");
        setManualSkill("");
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-neutral-100 flex items-center justify-between bg-gradient-to-r from-primary-50/50 to-primary-50/50">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                                    <Award className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-neutral-900">Add Specialties</h3>
                                    <p className="text-xs text-neutral-500">Showcase what you bring to the table</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                                <X className="w-6 h-6 text-neutral-400" />
                            </button>
                        </div>

                        <div className="p-6 flex-1 overflow-y-auto space-y-6">
                            {/* Selected Skills Basket */}
                            {selectedSkills.length > 0 && (
                                <div className="p-4 bg-primary-50/50 rounded-2xl border border-primary-100">
                                    <h4 className="text-xs font-black text-primary-600 uppercase tracking-widest mb-3 pl-1">Selection ({selectedSkills.length})</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedSkills.map(skill => (
                                            <div key={skill.name} className="flex items-center space-x-1 bg-white border border-primary-200 px-3 py-1.5 rounded-xl shadow-sm animate-in fade-in zoom-in duration-200">
                                                <span className="text-sm font-bold text-neutral-700">{skill.name}</span>
                                                <span className="text-[10px] font-black text-primary-500 uppercase px-1.5 py-0.5 bg-primary-50 rounded-md">{skill.level}</span>
                                                <button
                                                    onClick={() => handleToggleSkill(skill.name)}
                                                    className="p-0.5 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-error-500 transition-colors"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Search & Manual Entry */}
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Search skills or type a custom one..."
                                    value={searchTerm || manualSkill}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setSearchTerm(val);
                                        setManualSkill(val);
                                        if (val === "") setSelectedCategory(null);
                                    }}
                                    className="w-full pl-12 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all outline-none font-medium"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Categories */}
                                <div className="space-y-2">
                                    <h4 className="text-xs font-black text-neutral-400 uppercase tracking-widest pl-2">Categories</h4>
                                    <div className="space-y-1">
                                        {SKILL_CATEGORIES.map(cat => (
                                            <button
                                                key={cat.name}
                                                onClick={() => {
                                                    setSelectedCategory(cat.name);
                                                    setSearchTerm("");
                                                    setManualSkill("");
                                                }}
                                                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-between group ${selectedCategory === cat.name
                                                    ? 'bg-primary-600 text-white shadow-md'
                                                    : 'text-neutral-600 hover:bg-primary-50'
                                                    }`}
                                            >
                                                <span>{cat.name}</span>
                                                <ChevronRight className={`w-4 h-4 transition-transform ${selectedCategory === cat.name ? 'translate-x-1' : 'opacity-0 group-hover:opacity-100'}`} />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Skill Selection */}
                                <div className="md:col-span-2 space-y-2">
                                    <h4 className="text-xs font-black text-neutral-400 uppercase tracking-widest pl-2">
                                        {searchTerm ? `Results for "${searchTerm}"` : selectedCategory || "Popular Skills"}
                                    </h4>
                                    <div className="grid grid-cols-2 gap-2 h-fit max-h-[300px] overflow-y-auto pr-2">
                                        {filteredSkills.length > 0 ? (
                                            filteredSkills.map(skill => {
                                                const isSelected = selectedSkills.some(s => s.name === skill);
                                                const isExisting = existingSkills.some(s => s.toLowerCase() === skill.toLowerCase());
                                                return (
                                                    <button
                                                        key={skill}
                                                        disabled={isExisting}
                                                        onClick={() => handleToggleSkill(skill)}
                                                        className={`px-4 py-3 rounded-xl text-sm font-bold border-2 transition-all flex items-center justify-between group ${isSelected
                                                            ? 'border-primary-600 bg-primary-50 text-primary-700'
                                                            : isExisting
                                                                ? 'border-neutral-100 bg-neutral-50 text-neutral-300 cursor-not-allowed'
                                                                : 'border-neutral-100 text-neutral-600 hover:border-primary-200 hover:bg-primary-50/30'
                                                            }`}
                                                    >
                                                        <span className="truncate">{skill}</span>
                                                        {isSelected && <Check className="w-4 h-4" />}
                                                        {isExisting && <span className="text-[10px] font-black uppercase">Added</span>}
                                                    </button>
                                                );
                                            })
                                        ) : selectedCategory || searchTerm ? (
                                            <div className="col-span-2 py-10 text-center">
                                                <p className="text-neutral-400 text-sm font-medium">No direct matches found.</p>
                                                <p className="text-xs text-neutral-500 mt-1">You can still add "{searchTerm || manualSkill}" by selecting a level below.</p>
                                            </div>
                                        ) : (
                                            <div className="col-span-2 py-10 text-center">
                                                <p className="text-neutral-400 text-sm font-medium">Select a category to browse</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Level Selection */}
                            <div className="pt-6 border-t border-neutral-100">
                                <label className="block text-xs font-black text-neutral-400 uppercase tracking-widest mb-4 pl-2">Default Expertise Level</label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {expertiseLevels.map(level => {
                                        const isSelected = expertiseLevel === level;
                                        return (
                                            <button
                                                key={level}
                                                onClick={() => {
                                                    setExpertiseLevel(level);
                                                }}
                                                className={`py-3 rounded-2xl text-sm font-black transition-all border-2 ${isSelected
                                                    ? 'bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-100'
                                                    : 'bg-white text-neutral-500 border-neutral-100 hover:border-neutral-200'
                                                    }`}
                                            >
                                                {level}
                                            </button>
                                        );
                                    })}
                                </div>
                                <p className="text-[10px] text-neutral-400 mt-2 pl-2">Selected level will be applied to new skills you click on.</p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 bg-neutral-50 border-t border-neutral-100 flex items-center justify-end space-x-4">
                            <button
                                onClick={onClose}
                                className="px-6 py-2.5 text-sm font-bold text-neutral-500 hover:text-neutral-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAdd}
                                disabled={selectedSkills.length === 0 && !manualSkill.trim()}
                                className="px-8 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-black shadow-lg shadow-primary-200 hover:bg-primary-700 disabled:opacity-50 disabled:shadow-none transition-all flex items-center space-x-2"
                            >
                                <Plus className="w-5 h-5" />
                                <span>{selectedSkills.length > 1 ? `Add ${selectedSkills.length} Skills` : 'Add Specialty'}</span>
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
