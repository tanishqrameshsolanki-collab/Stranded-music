
import React from 'react';
import { motion } from 'framer-motion';
import { X, Check, Zap, Sliders, Waves, Speaker, Clock, Moon } from 'lucide-react';
import { AppSettings, EQMode } from '../../types';

interface SettingsModalProps {
  settings: AppSettings;
  onUpdate: (newSettings: AppSettings) => void;
  onClose: () => void;
}

const EQ_PRESETS: EQMode[] = ['Balanced', 'Bass Boost', 'Vocal', 'Electronic'];
const SLEEP_TIMERS = [0, 15, 30, 45, 60];

const SettingsModal: React.FC<SettingsModalProps> = ({ settings, onUpdate, onClose }) => {
  
  const toggleSetting = (key: keyof AppSettings) => {
      onUpdate({ ...settings, [key]: !settings[key] });
  };

  const setEQ = (mode: EQMode) => {
      onUpdate({ ...settings, eqMode: mode });
  };

  const setTimer = (min: number) => {
      onUpdate({ ...settings, sleepTimer: min });
  };

  return (
    <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-4"
        onClick={onClose}
    >
        <motion.div 
            initial={{ y: 100, scale: 0.9 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 100, scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-[#1C1C1E] border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative"
        >
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                <h2 className="text-xl font-bold text-white">Audio Settings</h2>
                <button onClick={onClose} className="p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                    <X size={20} />
                </button>
            </div>

            <div className="p-6 space-y-8">
                
                {/* Quality Section */}
                <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-1">Audio Quality</h3>
                    <div className="space-y-2">
                        <SettingToggle 
                            label="Hi-Res Lossless" 
                            desc="Up to 24-bit/192 kHz" 
                            active={settings.lossless} 
                            icon={Waves}
                            onClick={() => toggleSetting('lossless')} 
                        />
                        <SettingToggle 
                            label="Dolby Spatial Audio" 
                            desc="Immersive surround sound" 
                            active={settings.spatialAudio} 
                            icon={Speaker}
                            onClick={() => toggleSetting('spatialAudio')} 
                        />
                    </div>
                </div>

                {/* EQ Section */}
                <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-1">Equalizer</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {EQ_PRESETS.map(mode => (
                            <button
                                key={mode}
                                onClick={() => setEQ(mode)}
                                className={`px-4 py-3 rounded-xl text-sm font-medium transition-all border ${
                                    settings.eqMode === mode 
                                    ? 'bg-[#FA233B] border-[#FA233B] text-white shadow-lg shadow-red-900/30' 
                                    : 'bg-[#2C2C2E] border-transparent text-gray-300 hover:bg-[#3a3a3c]'
                                }`}
                            >
                                {mode}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Sleep Timer Section */}
                <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-1">Sleep Timer</h3>
                    <div className="flex justify-between bg-[#2C2C2E] p-1 rounded-xl">
                        {SLEEP_TIMERS.map(min => (
                            <button
                                key={min}
                                onClick={() => setTimer(min)}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                                    settings.sleepTimer === min 
                                    ? 'bg-[#FA233B] text-white shadow-md' 
                                    : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                {min === 0 ? 'Off' : `${min}m`}
                            </button>
                        ))}
                    </div>
                </div>

            </div>
        </motion.div>
    </motion.div>
  );
};

const SettingToggle = ({ label, desc, active, icon: Icon, onClick }: any) => (
    <div 
        onClick={onClick}
        className={`flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-all border ${
            active ? 'bg-[#FA233B]/10 border-[#FA233B]/50' : 'bg-[#2C2C2E] border-transparent hover:bg-[#3a3a3c]'
        }`}
    >
        <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${active ? 'bg-[#FA233B] text-white' : 'bg-white/10 text-gray-400'}`}>
                <Icon size={18} />
            </div>
            <div>
                <p className={`text-sm font-bold ${active ? 'text-white' : 'text-gray-200'}`}>{label}</p>
                <p className="text-xs text-gray-500">{desc}</p>
            </div>
        </div>
        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
            active ? 'bg-[#FA233B] border-[#FA233B]' : 'border-gray-600'
        }`}>
            {active && <Check size={12} className="text-white" strokeWidth={3} />}
        </div>
    </div>
);

export default SettingsModal;
