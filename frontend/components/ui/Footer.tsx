'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Github, Twitter, Linkedin, Mail, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FooterLink {
  label: string;
  href: string;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

interface FooterProps {
  sections?: FooterSection[];
  showSocials?: boolean;
  showNewsletter?: boolean;
  className?: string;
}

const defaultSections: FooterSection[] = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '/features' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Changelog', href: '/changelog' },
      { label: 'Roadmap', href: '/roadmap' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Documentation', href: '/docs' },
      { label: 'API Reference', href: '/api' },
      { label: 'Guides', href: '/guides' },
      { label: 'Help Center', href: '/help' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Blog', href: '/blog' },
      { label: 'Careers', href: '/careers' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
      { label: 'Security', href: '/security' },
      { label: 'Cookies', href: '/cookies' },
    ],
  },
];

const socialLinks = [
  { icon: Github, href: 'https://github.com', label: 'GitHub' },
  { icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
  { icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
  { icon: Mail, href: 'mailto:hello@cpms.com', label: 'Email' },
];

export function Footer({
  sections = defaultSections,
  showSocials = true,
  showNewsletter = true,
  className,
}: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={cn(
        'bg-secondary-50 dark:bg-secondary-950',
        'border-t border-secondary-200 dark:border-secondary-800',
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12 lg:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
            {/* Brand Section */}
            <div className="col-span-2">
              <Link href="/" className="inline-flex items-center gap-2 mb-4">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                  <span className="text-white font-bold">CP</span>
                </div>
                <span className="font-bold text-xl text-secondary-900 dark:text-white">
                  CPMS
                </span>
              </Link>
              <p className="text-secondary-600 dark:text-secondary-400 text-sm max-w-xs mb-6">
                Streamline your campus placement process with our comprehensive management system.
              </p>

              {/* Newsletter */}
              {showNewsletter && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                    Stay updated
                  </p>
                  <form className="flex gap-2">
                    <input
                      type="email"
                      placeholder="Enter your email"
                      className={cn(
                        'flex-1 h-10 px-3 rounded-lg text-sm',
                        'bg-white dark:bg-secondary-800',
                        'border border-secondary-300 dark:border-secondary-700',
                        'text-secondary-900 dark:text-secondary-100',
                        'placeholder:text-secondary-400',
                        'focus:outline-none focus:ring-2 focus:ring-primary-500/50'
                      )}
                    />
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      className={cn(
                        'h-10 px-4 rounded-lg text-sm font-medium',
                        'bg-primary-600 text-white',
                        'hover:bg-primary-700',
                        'transition-colors duration-200'
                      )}
                    >
                      Subscribe
                    </motion.button>
                  </form>
                </div>
              )}
            </div>

            {/* Link Sections */}
            {sections.map((section) => (
              <div key={section.title}>
                <h3 className="text-sm font-semibold text-secondary-900 dark:text-white mb-4">
                  {section.title}
                </h3>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className={cn(
                          'text-sm text-secondary-600 dark:text-secondary-400',
                          'hover:text-primary-600 dark:hover:text-primary-400',
                          'transition-colors duration-200'
                        )}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          className={cn(
            'py-6 border-t border-secondary-200 dark:border-secondary-800',
            'flex flex-col sm:flex-row items-center justify-between gap-4'
          )}
        >
          <p className="text-sm text-secondary-500 dark:text-secondary-400 flex items-center gap-1">
            © {currentYear} CPMS. Made with <Heart className="h-4 w-4 text-danger-500 fill-current" /> for students
          </p>

          {/* Social Links */}
          {showSocials && (
            <div className="flex items-center gap-2">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      'p-2 rounded-lg',
                      'text-secondary-500 dark:text-secondary-400',
                      'hover:text-secondary-700 dark:hover:text-secondary-200',
                      'hover:bg-secondary-200 dark:hover:bg-secondary-800',
                      'transition-colors duration-200'
                    )}
                    aria-label={social.label}
                  >
                    <Icon className="h-5 w-5" />
                  </motion.a>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}

export default Footer;
