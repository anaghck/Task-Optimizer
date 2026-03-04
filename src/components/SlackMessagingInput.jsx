import React, { useState, useRef } from 'react';
import {
    Plus, Smile, Paperclip, AtSign, Brain, Video, Mic,
    CheckSquare, FileText, SendHorizontal, ChevronDown, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Slack-Style Messaging Input Component
 * Requirement: Tailwind CSS must be configured in your project.
 */
const SlackMessagingInput = ({ onSend, channelName = "Anagh" }) => {
    const [message, setMessage] = useState("");
    const [showBanner, setShowBanner] = useState(true);
    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);

    const [attachments, setAttachments] = useState([]);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const audioChunksRef = useRef([]);
    const [isRecording, setIsRecording] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const handleInput = (e) => {
        const target = e.target;
        target.style.height = 'auto';
        target.style.height = `${target.scrollHeight}px`;
        setMessage(target.value);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleSend = () => {
        if (message.trim() || attachments.length > 0) {
            if (onSend) {
                // Pass rich object if there are attachments
                if (attachments.length > 0) {
                    onSend({ text: message, attachments });
                } else {
                    onSend(message);
                }
            }
            setMessage("");
            setAttachments([]);
            setShowEmojiPicker(false);
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }
        }
    };

    const insertAtCursor = (text) => {
        if (textareaRef.current) {
            const start = textareaRef.current.selectionStart;
            const end = textareaRef.current.selectionEnd;
            const newMessage = message.substring(0, start) + text + message.substring(end);
            setMessage(newMessage);

            // Re-focus and set cursor position after state update
            setTimeout(() => {
                textareaRef.current.focus();
                const newPos = start + text.length;
                textareaRef.current.setSelectionRange(newPos, newPos);
            }, 0);
        } else {
            setMessage(prev => prev + text);
        }
    };

    const handleIconAction = (action) => {
        switch (action) {
            case 'plus':
            case 'attach':
            case 'file':
                fileInputRef.current?.click();
                break;
            case 'emoji':
                setShowEmojiPicker(!showEmojiPicker);
                break;
            case 'mention':
                insertAtCursor('@');
                break;
            case 'brain':
                insertAtCursor('@Brain ');
                break;
            case 'video':
                alert("Initiating secure video briefing...");
                break;
            case 'voice':
                if (isRecording) {
                    stopRecording();
                } else {
                    startRecording();
                }
                break;
            case 'task':
                insertAtCursor('\n- [ ] ');
                break;
            default:
                console.log(`Action triggered: ${action}`);
        }
    };

    const startRecording = async () => {
        audioChunksRef.current = [];
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };
            recorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const url = URL.createObjectURL(blob);
                setAttachments(prev => [...prev, {
                    id: Date.now(),
                    type: 'audio',
                    url,
                    name: `Voice-${new Date().toLocaleTimeString()}.webm`
                }]);
                stream.getTracks().forEach(track => track.stop());
            };
            recorder.start();
            setMediaRecorder(recorder);
            setIsRecording(true);
        } catch (err) {
            alert("Microphone access is required for voice briefing.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            setIsRecording(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setAttachments(prev => [...prev, {
                id: Date.now(),
                type: 'file',
                fileType: file.type,
                url,
                name: file.name,
                size: (file.size / 1024).toFixed(1) + ' KB'
            }]);
        }
        e.target.value = '';
    };

    const removeAttachment = (id) => {
        setAttachments(prev => prev.filter(a => a.id !== id));
    };

    const commonEmojis = ['👋', '✅', '🚀', '🔥', '🧠', '💡', '⚠️', '🎯'];

    return (
        <div className="w-full flex flex-col gap-2 font-sans p-3 bg-black/40 rounded-2xl border border-white/5 shadow-2xl backdrop-blur-md">
            {/* Hidden File Input */}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
            />

            {/* Top Notification Banner */}
            {showBanner && (
                <div className="flex items-center justify-between bg-zinc-900/80 border border-zinc-800 text-white px-4 py-2 rounded-xl shadow-lg w-full mb-0.5">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <span className="flex-shrink-0 text-base">👋</span>
                        <span className="text-[13px] font-medium text-zinc-300 truncate">
                            Briefing for <span className="text-emerald-400 font-bold">#{channelName}</span>. Ready?
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowBanner(false)}
                        className="p-1 hover:bg-white/10 rounded-lg transition-all ml-1"
                    >
                        <X size={14} className="text-zinc-500 hover:text-white" />
                    </button>
                </div>
            )}

            {/* Message Input Container - DARK THEME */}
            <div className="flex flex-col border border-white/10 rounded-2xl bg-black shadow-2xl overflow-hidden w-full transition-all focus-within:border-emerald-500/50 focus-within:ring-2 focus-within:ring-emerald-500/10">

                {/* Attachment Previews */}
                {attachments.length > 0 && (
                    <div className="px-4 pt-3 flex flex-wrap gap-3 bg-black/80 border-b border-white/5">
                        {attachments.map(att => (
                            <motion.div
                                key={att.id}
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="group relative bg-zinc-900 border border-white/10 rounded-xl p-2.5 flex items-center gap-3 min-w-[140px] max-w-[200px]"
                            >
                                <div className="flex-shrink-0 w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                                    {att.type === 'audio' ? <Mic size={18} className="text-emerald-400" /> : <FileText size={18} className="text-emerald-400" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-[12px] font-bold text-zinc-100 truncate">{att.name}</div>
                                    <div className="text-[10px] text-zinc-500">{att.type === 'audio' ? 'Voice Note' : att.size}</div>
                                </div>
                                <button
                                    onClick={() => removeAttachment(att.id)}
                                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-zinc-800 border border-white/10 rounded-full flex items-center justify-center text-zinc-400 hover:text-white transition-colors shadow-lg"
                                >
                                    <X size={12} />
                                </button>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Multiline Textarea Area */}
                <div className="p-4 bg-black/80">
                    <textarea
                        ref={textareaRef}
                        value={message}
                        onChange={handleInput}
                        onKeyDown={handleKeyDown}
                        placeholder={`Mention @Brain to create, find, ask anything...`}
                        className="w-full bg-transparent outline-none border-none resize-none text-[15px] leading-relaxed text-white placeholder-zinc-600 min-h-[50px] p-0"
                        style={{ boxShadow: 'none' }}
                    />

                    {/* Simple Inline Emoji Picker */}
                    <AnimatePresence>
                        {showEmojiPicker && (
                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5 overflow-x-auto pb-1 no-scrollbar animate-in fade-in slide-in-from-bottom-1">
                                {commonEmojis.map(emoji => (
                                    <button
                                        key={emoji}
                                        onClick={() => insertAtCursor(emoji)}
                                        className="text-xl hover:bg-white/10 p-1.5 rounded-lg transition-colors"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setShowEmojiPicker(false)}
                                    className="ml-auto text-xs text-zinc-500 hover:text-zinc-300 px-2"
                                >
                                    Close
                                </button>
                            </div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Toolbar Footer */}
                <div className="flex items-center justify-between px-3 py-1.5 border-t border-white/5 bg-zinc-950/50">

                    {/* Left Side Icons - Organized Group */}
                    <div className="flex items-center gap-2.5 overflow-x-auto py-1 no-scrollbar flex-1 pl-2">
                        <ToolbarButton icon={<Plus size={19} />} onClick={() => handleIconAction('plus')} tooltip="Upload" />
                        <div className="w-[1px] h-5 bg-white/10 mx-0.5 flex-shrink-0" />

                        <ToolbarButton
                            icon={<Smile size={19} />}
                            onClick={() => handleIconAction('emoji')}
                            active={showEmojiPicker}
                            tooltip="Emojis"
                        />
                        <ToolbarButton icon={<Paperclip size={19} />} onClick={() => handleIconAction('attach')} tooltip="Attach" />
                        <ToolbarButton icon={<AtSign size={19} />} onClick={() => handleIconAction('mention')} tooltip="Mention" title="Add @" />
                        <ToolbarButton
                            icon={<Brain size={19} className={message.includes('@Brain') ? "text-emerald-400" : "text-emerald-500"} />}
                            onClick={() => handleIconAction('brain')}
                            tooltip="AI Brain"
                        />
                        <ToolbarButton icon={<Video size={19} />} onClick={() => handleIconAction('video')} tooltip="Video" />
                        <ToolbarButton
                            icon={<Mic size={19} className={isRecording ? "animate-pulse text-red-500" : ""} />}
                            onClick={() => handleIconAction('voice')}
                            tooltip="Voice"
                        />
                        <ToolbarButton icon={<CheckSquare size={19} />} onClick={() => handleIconAction('task')} tooltip="Task" />
                        <ToolbarButton icon={<FileText size={19} />} onClick={() => handleIconAction('file')} tooltip="Docs" />

                        {isRecording && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center gap-2 ml-2 pr-4 border-r border-white/10"
                            >
                                <span className="flex h-2 w-2 rounded-full bg-red-500 animate-ping" />
                                <span className="text-[11px] font-bold text-red-500 uppercase tracking-tighter">Recording</span>
                            </motion.div>
                        )}
                    </div>

                    {/* Right Side Options */}
                    <div className="flex items-center gap-2 ml-3 border-l border-white/10 pl-3">
                        <button
                            type="button"
                            onClick={handleSend}
                            disabled={!message.trim()}
                            title="Send alignment signal"
                            className={`p-2.5 rounded-xl flex items-center justify-center transition-all ${message.trim()
                                ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 active:scale-95'
                                : 'text-zinc-700 bg-zinc-900/50'
                                }`}
                        >
                            <SendHorizontal size={20} />
                        </button>
                        <button
                            type="button"
                            onClick={() => handleIconAction('options')}
                            className="p-2 text-zinc-500 hover:text-zinc-200 hover:bg-white/5 rounded-lg transition-colors"
                        >
                            <ChevronDown size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ToolbarButton = ({ icon, onClick, active, tooltip }) => (
    <button
        type="button"
        onClick={onClick}
        title={tooltip}
        className={`p-2 flex-shrink-0 rounded-lg transition-all border-none outline-none bg-transparent flex items-center justify-center group relative ${active ? 'bg-white/10 text-emerald-400' : 'text-zinc-400 hover:bg-white/5 hover:text-emerald-400'
            }`}
        style={{ border: 'none', background: 'transparent' }}
    >
        <span className="transform group-hover:scale-110 transition-transform">
            {icon}
        </span>
    </button>
);

export default SlackMessagingInput;
