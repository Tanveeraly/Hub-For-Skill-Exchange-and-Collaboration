import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Plus, X } from 'lucide-react';
import { RootState, AppDispatch } from '../store/store';
import { fetchTermsAcceptance, acceptTerms, setShowTermsModal } from '../store/swapAgreementSlice';
import { createSwapRequest } from '../store/slices/swapsSlice';
import TermsAndConditionsModal from './TermsAndConditionsModal';
import Modal from './ui/Modal';
import Button from './ui/Button';

interface SwapRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    recipientName: string;
    recipientSkill: string;
    skillId: number;
    userSkills: string[];
    onSubmit: (data: any) => void;
}

type Slot = { date: string; time: string };
const today = () => new Date().toISOString().slice(0, 10);

export default function SwapRequestModal({ isOpen, onClose, recipientName, recipientSkill, skillId, userSkills, onSubmit }: SwapRequestModalProps) {
    const dispatch = useDispatch<AppDispatch>();
    const { hasAcceptedTerms, showTermsModal } = useSelector((state: RootState) => state.swapAgreement);

    const [skillOffered, setSkillOffered] = useState('');
    const [message, setMessage] = useState('');
    const [slots, setSlots] = useState<Slot[]>([{ date: '', time: '' }]);
    const [errors, setErrors] = useState<{ skill?: string; slots?: string; form?: string }>({});
    const [sending, setSending] = useState(false);
    const [sendAfterTerms, setSendAfterTerms] = useState(false);
    const firstName = recipientName.split(' ')[0];

    useEffect(() => {
        if (isOpen) {
            dispatch(fetchTermsAcceptance());
            setErrors({});
            if (userSkills.length === 1) setSkillOffered(userSkills[0]);
        }
    }, [isOpen, dispatch, userSkills]);

    const updateSlot = (index: number, field: keyof Slot, value: string) =>
        setSlots((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));

    const validate = () => {
        const next: typeof errors = {};
        if (!skillOffered) next.skill = 'Choose the skill you will teach in return.';
        const filled = slots.filter((s) => s.date && s.time);
        if (filled.length === 0) next.slots = 'Suggest at least one date and time.';
        else if (slots.some((s) => (s.date || s.time) && !(s.date && s.time))) next.slots = 'Each suggested time needs both a date and a time.';
        else if (filled.some((s) => new Date(`${s.date}T${s.time}`) < new Date())) next.slots = 'Suggested times must be in the future.';
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const send = async () => {
        setSending(true);
        setErrors({});
        try {
            await dispatch(createSwapRequest({
                skillId,
                message,
                offeredSkill: skillOffered,
                requestedSkill: recipientSkill,
                preferredTimeSlots: slots.filter((s) => s.date && s.time).map((s) => `${s.date} ${s.time}`),
            })).unwrap();
            onSubmit({ skillOffered, message });
            setSkillOffered('');
            setMessage('');
            setSlots([{ date: '', time: '' }]);
            onClose();
        } catch (err: any) {
            setErrors({ form: typeof err === 'string' ? err : err?.message || 'The request could not be sent. Please try again.' });
        } finally {
            setSending(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        if (!hasAcceptedTerms) {
            // Ask once, then carry on sending without making the user press the button again.
            setSendAfterTerms(true);
            dispatch(setShowTermsModal(true));
            return;
        }
        send();
    };

    const handleTermsAccept = async () => {
        await dispatch(acceptTerms());
        if (sendAfterTerms) {
            setSendAfterTerms(false);
            send();
        }
    };

    const noSkills = userSkills.length === 0;

    return (
        <>
            <TermsAndConditionsModal
                isOpen={showTermsModal}
                onClose={() => { setSendAfterTerms(false); dispatch(setShowTermsModal(false)); }}
                onAccept={handleTermsAccept}
            />

            <Modal isOpen={isOpen && !showTermsModal} onClose={onClose} title={`Request a swap with ${firstName}`}>
                <p className="text-sm text-neutral-600">
                    You'd learn <span className="font-medium text-neutral-900">{recipientSkill}</span> from {recipientName}, and teach them one of your skills in return.
                </p>

                {noSkills ? (
                    <div className="mt-5 rounded-md border border-warning-200 bg-warning-50 p-4 text-sm">
                        <p className="font-medium text-neutral-900">Add a skill to your profile first</p>
                        <p className="mt-1 text-neutral-700">A swap needs something to offer back. Add at least one skill you can teach, then come back here.</p>
                        <Link to="/profile" onClick={onClose} className="mt-3 inline-block rounded-md bg-primary-600 px-3 py-1.5 font-medium text-white hover:bg-primary-700">
                            Go to my profile
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="mt-5 space-y-5" noValidate>
                        <div>
                            <label htmlFor="offer" className="mb-1.5 block text-sm font-medium text-neutral-700">What will you teach in return?</label>
                            <select
                                id="offer"
                                value={skillOffered}
                                onChange={(e) => { setSkillOffered(e.target.value); setErrors((x) => ({ ...x, skill: undefined })); }}
                                aria-invalid={!!errors.skill}
                                className={`w-full rounded-md border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 ${errors.skill ? 'border-error-500 focus:ring-error-100' : 'border-neutral-300 focus:border-primary-500 focus:ring-primary-100'}`}
                            >
                                <option value="">Choose one of your skills</option>
                                {userSkills.map((skill) => <option key={skill} value={skill}>{skill}</option>)}
                            </select>
                            {errors.skill && <p className="mt-1 text-xs text-error-700">{errors.skill}</p>}
                        </div>

                        <fieldset>
                            <legend className="text-sm font-medium text-neutral-700">When could you meet?</legend>
                            <p className="mt-0.5 text-xs text-neutral-500">Suggest up to 3 times. {firstName} picks one. Sessions happen on a video call in the app.</p>
                            <div className="mt-2 space-y-2">
                                {slots.map((slot, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <input
                                            type="date"
                                            min={today()}
                                            aria-label={`Date ${index + 1}`}
                                            value={slot.date}
                                            onChange={(e) => updateSlot(index, 'date', e.target.value)}
                                            className="min-w-0 flex-1 rounded-md border border-neutral-300 px-2.5 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                                        />
                                        <input
                                            type="time"
                                            aria-label={`Time ${index + 1}`}
                                            value={slot.time}
                                            onChange={(e) => updateSlot(index, 'time', e.target.value)}
                                            className="w-32 rounded-md border border-neutral-300 px-2.5 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                                        />
                                        {slots.length > 1 && (
                                            <button type="button" onClick={() => setSlots(slots.filter((_, i) => i !== index))} className="rounded p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700" aria-label={`Remove time ${index + 1}`}>
                                                <X className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            {slots.length < 3 && (
                                <button type="button" onClick={() => setSlots([...slots, { date: '', time: '' }])} className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary-700 hover:underline">
                                    <Plus className="h-4 w-4" /> Add another time
                                </button>
                            )}
                            {errors.slots && <p className="mt-1 text-xs text-error-700">{errors.slots}</p>}
                        </fieldset>

                        <div>
                            <label htmlFor="msg" className="mb-1.5 block text-sm font-medium text-neutral-700">Message <span className="font-normal text-neutral-500">(optional)</span></label>
                            <textarea
                                id="msg"
                                rows={3}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder={`Say hello and tell ${firstName} what you'd like to learn.`}
                                className="w-full resize-none rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                            />
                        </div>

                        {errors.form && <p role="alert" className="rounded-md border border-error-200 bg-error-50 px-3 py-2 text-sm text-error-700">{errors.form}</p>}

                        <div className="flex flex-col-reverse gap-2 border-t border-neutral-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-xs text-neutral-500">{firstName} will be notified. You can follow it in My swaps.</p>
                            <div className="flex gap-2">
                                <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                                <Button type="submit" loading={sending}>Send request</Button>
                            </div>
                        </div>
                    </form>
                )}
            </Modal>
        </>
    );
}
