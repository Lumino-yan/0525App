import { useState, useEffect } from 'react';
import { Bell, Menu, X } from 'lucide-react';

const navLinks = [
  { label: '概览', href: '#hero' },
  { label: '项目', href: '#projects' },
  { label: '团队', href: '#console' },
  { label: '动态', href: '#features' },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'glass-nav' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2 group">
          <span className="text-lg font-extrabold tracking-tight text-white">
            MOMENTA
          </span>
          <span className="w-2 h-2 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 animate-pulse" />
        </a>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="relative text-sm text-white/70 hover:text-white transition-colors duration-300 py-1 group"
            >
              {link.label}
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-gradient-to-r from-violet-500 to-pink-500 transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          <button className="relative p-2 text-white/60 hover:text-white transition-colors">
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-pink-500 rounded-full" />
          </button>

          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 p-[2px]">
            <div className="w-full h-full rounded-full bg-[#1a1a1a] flex items-center justify-center">
              <span className="text-xs font-semibold text-white">U</span>
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-white/60 hover:text-white"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden glass-nav border-t border-white/5">
          <nav className="flex flex-col px-6 py-4 gap-3">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm text-white/70 hover:text-white py-2 transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
