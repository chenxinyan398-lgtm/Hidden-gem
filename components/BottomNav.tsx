'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, PlusSquare, ScanLine, User } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();

  // Hide bottom nav on auth pages
  if (pathname?.startsWith('/auth')) return null;

  const links = [
    { href: '/', icon: Home, label: '首頁' },
    { href: '/map', icon: Compass, label: '地圖' },
    { href: '/create', icon: PlusSquare, label: '新增' },
    { href: '/scan', icon: ScanLine, label: '掃描' },
    { href: '/profile', icon: User, label: '個人' },
  ];

  return (
    <nav className="absolute bottom-0 w-full bg-zinc-950/80 backdrop-blur-md border-t border-zinc-800 z-50">
      <div className="flex justify-around items-center h-16">
        {links.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href;
          return (
            <Link 
              key={href} 
              href={href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  );
}
