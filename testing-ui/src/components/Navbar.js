import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, TestTubes } from 'lucide-react';
import { Button } from './ui/button';
import { ThemeToggle } from './ui/theme-toggle';

const Navbar = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const isActive = (path) => location.pathname === path;

  const navItems = [
    { to: '/', label: 'Dashboard' },
    { to: '/api-testing', label: 'API Testing' },
    { to: '/mqtt-testing', label: 'MQTT Testing' },
    { to: '/database-testing', label: 'Database Testing' },
    { to: '/performance-testing', label: 'Performance Testing' },
    { to: '/e2e-testing', label: 'E2E Testing' },
    { to: '/system-monitoring', label: 'System Monitoring' },
    { to: '/test-scenarios', label: 'Test Scenarios' },
    { to: '/test-runner', label: 'Test Runner' },
  ];

  return (
    <nav className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 font-semibold text-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground shadow">
              <TestTubes className="h-4 w-4" />
            </div>
            <span className="hidden sm:inline text-base tracking-tight">City IoT Testing</span>
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {navItems.map(item => (
              <Link
                key={item.to}
                to={item.to}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors hover:text-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background ${
                  isActive(item.to) ? 'bg-accent text-accent-foreground shadow-sm' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/test-runner" className="hidden sm:inline-flex">
            <Button size="sm" className="shadow-sm">Run Tests</Button>
          </Link>
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(v => !v)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <div className="container py-2 flex flex-col">
            {navItems.map(item => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.to) ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
