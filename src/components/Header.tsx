import React from 'react';
import Link from 'next/link';
import WalletConnection from './WalletConnection';
import { usePathname } from 'next/navigation';
import { ChevronDown, Menu } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

const NavItem = ({ href, children, isActive }: { href: string, children: React.ReactNode, isActive: boolean }) => {
  return (
    <Link href={href}>
      <div className={`px-4 py-2 rounded-md transition-colors ${
        isActive 
          ? 'bg-purple-900/40 text-purple-300' 
          : 'hover:bg-gray-800/60 text-gray-300 hover:text-white'
      }`}>
        {children}
      </div>
    </Link>
  );
};

export default function Header() {
  const pathname = usePathname();
  
  return (
    <header className="bg-gray-900/95 border-b border-gray-800/50 sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/">
              <div className="flex items-center gap-2">
                <div className="bg-gradient-to-r from-purple-600 to-blue-500 p-2 rounded-md shadow-lg shadow-purple-500/20">
                  <span className="text-white font-bold">DAIZU</span>
                </div>
              </div>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="ml-8 hidden md:flex space-x-1">
              <NavItem href="/" isActive={pathname === '/'}>
                Home
              </NavItem>
              <NavItem href="/dashboard" isActive={pathname === '/dashboard'}>
                Dashboard
              </NavItem>
              <NavItem href="/portfolio" isActive={pathname === '/portfolio'}>
                Portfolio
              </NavItem>
              <NavItem href="/analytics" isActive={pathname === '/analytics'}>
                Analytics
              </NavItem>
            </nav>
          </div>
          
          {/* Mobile Navigation */}
          <div className="md:hidden flex mr-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white hover:bg-gray-800/60">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-gray-800/95 border-gray-700/50 backdrop-blur-sm">
                <DropdownMenuItem asChild>
                  <Link href="/" className="cursor-pointer hover:bg-gray-700/50">Home</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="cursor-pointer hover:bg-gray-700/50">Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/portfolio" className="cursor-pointer hover:bg-gray-700/50">Portfolio</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/analytics" className="cursor-pointer hover:bg-gray-700/50">Analytics</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Wallet Connection */}
          <div className="flex items-center space-x-4">
            <WalletConnection 
              variant="default"
              showBalance={true}
              size="default"
            />
          </div>
        </div>
      </div>
    </header>
  );
} 