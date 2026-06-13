import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, Sun, Moon, Search } from 'lucide-react';

const Header = () => {
  const { user } = useAuth();
  const [isDark, setIsDark] = React.useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <header className="h-16 border-b-2 border-foreground flex items-center justify-between px-8 bg-card sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-bold font-mono tracking-tight cursor-default">
          {window.location.pathname.split('/').pop().replace('-', ' ').toUpperCase()}
        </h2>
      </div>

      <div className="flex items-center gap-6">
        <button className="flex items-center justify-center w-10 h-10 border-2 border-foreground bg-accent shadow-[2px_2px_0px_1px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_1px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all">
          <Bell size={20} />
        </button>
        
        <button 
          onClick={toggleTheme}
          className="flex items-center justify-center w-10 h-10 border-2 border-foreground bg-primary shadow-[2px_2px_0px_1px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_1px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <div className="flex items-center gap-3 pl-6 border-l-2 border-foreground">
          <div className="text-right">
            <p className="font-bold text-sm leading-none">{user?.name}</p>
            <p className="text-[10px] text-muted-foreground uppercase font-mono mt-1 font-black">{user?.role}</p>
          </div>
          <div className="w-10 h-10 border-2 border-foreground bg-accent flex items-center justify-center font-mono font-bold text-lg select-none">
            {user?.name?.[0].toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
