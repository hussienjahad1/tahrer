
import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  containerClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, id, className = '', containerClassName = '', ...props }, ref) => {
    const inputId = id || (label ? label.replace(/\s+/g, '-').toLowerCase() : undefined);
    return (
      <div className={`group ${containerClassName}`}>
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-slate-400 mb-1.5 transition-colors group-focus-within:text-sky-400">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={`w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 
            focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 
            hover:border-slate-500 transition-all duration-200 ${className}`}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;