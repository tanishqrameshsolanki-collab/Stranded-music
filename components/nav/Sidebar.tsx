
import React from 'react';
import { Home, LayoutGrid, Users, Clock, Mic2, Disc, Music, Plus, Search as SearchIcon, ListMusic } from 'lucide-react';
import { Tab } from '../../types';

interface SidebarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="w-full h-full flex flex-col pt-6 pb-4 px-3 bg-[#1e1e1e]/60 backdrop-blur-xl border-r border-white/5 select-none">
      
      {/* Apple Music Header / Search */}
      <div className="mb-6 px-2 mt-2">
        <div 
            onClick={() => onTabChange('search')}
            className="w-full bg-[#2c2c2e] hover:bg-[#3a3a3c] transition-colors rounded-md h-8 flex items-center px-2.5 cursor-text group border border-white/5"
        >
            <SearchIcon size={14} className="text-[#a1a1a1] mr-2 group-hover:text-white transition-colors" />
            <span className="text-[#a1a1a1] text-[13px] font-medium group-hover:text-white transition-colors">Search</span>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="mb-8 mt-4">
        <div className="space-y-[2px]">
          <SidebarItem 
             active={activeTab === 'listen-now'}
             onClick={() => onTabChange('listen-now')}
             icon={Home}
             label="Home"
          />
          <SidebarItem 
             active={activeTab === 'browse'}
             onClick={() => onTabChange('browse')}
             icon={LayoutGrid}
             label="New"
          />
          <SidebarItem 
             active={activeTab === 'radio'}
             onClick={() => onTabChange('radio')}
             icon={Users}
             label="Radio"
          />
        </div>
      </div>

      {/* Library Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between px-3 mb-2 group cursor-pointer">
            <h3 className="text-[11px] font-bold text-gray-500/80 uppercase tracking-wider group-hover:text-gray-400 transition-colors">Library</h3>
        </div>
        <div className="space-y-[1px]">
           <SidebarItem 
              active={activeTab === 'library'}
              onClick={() => onTabChange('library')}
              icon={Clock}
              label="Recently Added"
           />
           <SidebarItem 
              active={false}
              onClick={() => {}}
              icon={Mic2}
              label="Artists"
           />
           <SidebarItem 
              active={false}
              onClick={() => {}}
              icon={Disc}
              label="Albums"
           />
           <SidebarItem 
              active={false}
              onClick={() => {}}
              icon={Music}
              label="Songs"
           />
        </div>
      </div>

      {/* Playlists Section */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="flex items-center justify-between px-3 mb-2 group cursor-pointer">
            <h3 className="text-[11px] font-bold text-gray-500/80 uppercase tracking-wider group-hover:text-gray-400 transition-colors">Playlists</h3>
            <Plus size={14} className="text-gray-500 hover:text-white transition-colors" />
        </div>
        <div className="space-y-[1px]">
           {['Chill Mix', 'Workout Energy', 'Classical Essentials', 'Late Night', 'Focus Flow', 'Pure Pop', 'Hip-Hop Hits'].map(p => (
              <SidebarItem 
                key={p}
                active={false}
                onClick={() => {}}
                icon={ListMusic}
                label={p}
                isPlaylist
              />
           ))}
        </div>
      </div>
    </div>
  );
};

const SidebarItem: React.FC<{ active: boolean; onClick: () => void; icon: any; label: string; isPlaylist?: boolean }> = ({ active, onClick, icon: Icon, label, isPlaylist }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-2.5 px-3 py-[5px] rounded-md transition-all duration-200 group ${
      active ? 'bg-[#ffffff15] text-white' : 'text-[#a1a1a1] hover:text-white hover:bg-white/5'
    }`}
  >
    <Icon 
        size={isPlaylist ? 16 : 18} 
        className={`${active ? 'text-[var(--color-apple-red)]' : 'text-[#a1a1a1] group-hover:text-white'} transition-colors`} 
        strokeWidth={active ? 2.5 : 2} 
    />
    <span className={`text-[13px] tracking-tight truncate ${active ? 'font-medium' : 'font-normal'}`}>{label}</span>
  </button>
);

export default Sidebar;
