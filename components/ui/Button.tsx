import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  isLoading, 
  className = '', 
  disabled,
  ...props 
}) => {
  const baseStyles =
    "relative overflow-hidden rounded-[18px] font-semibold tracking-[0.01em] transition-all duration-300 flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed group";
  
  const variants = {
    primary:
      "border border-primary/30 bg-[linear-gradient(135deg,#83efe0_0%,#48d9c8_42%,#168d87_100%)] text-[#04161a] shadow-[0_18px_45px_-20px_rgba(64,214,195,0.85)] hover:-translate-y-0.5 hover:shadow-[0_24px_52px_-24px_rgba(64,214,195,0.9)]",
    secondary:
      "border border-white/10 bg-white/6 text-white backdrop-blur-xl hover:border-white/20 hover:bg-white/10 hover:-translate-y-0.5",
    outline:
      "border border-white/14 bg-transparent text-[#d7e4ee] hover:border-primary/40 hover:bg-primary/8 hover:text-white",
    ghost:
      "border border-transparent bg-transparent text-muted hover:bg-white/6 hover:text-white"
  };

  const sizes = {
    sm: "px-3.5 py-2 text-xs",
    md: "px-5 py-3 text-sm",
    lg: "px-6 py-3.5 text-base",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || disabled}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {/* Loading State Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-inherit backdrop-blur-sm">
           <svg className="h-5 w-5 animate-spin text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      )}
      
      {/* Content */}
      <span
        className={`relative z-[1] flex items-center gap-2 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
      >
        {children}
      </span>
    </button>
  );
};
