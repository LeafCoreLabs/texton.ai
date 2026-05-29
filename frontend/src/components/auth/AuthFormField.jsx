import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function AuthFormField({
  icon: Icon,
  type = 'text',
  placeholder,
  value,
  onChange,
  required = false,
  className = '',
  multiline = false,
  rows = 3,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  const field = multiline ? (
    <textarea
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      rows={rows}
      className={`auth-input !pl-4 ${className}`}
    />
  ) : (
    <input
      type={inputType}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      className={`auth-input ${Icon ? '' : '!pl-4'} ${className}`}
    />
  );

  return (
    <div className="auth-field-group relative">
      {Icon && !multiline && (
        <Icon className="auth-field-icon absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors" />
      )}
      {field}
      {isPassword && (
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShowPassword((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      )}
    </div>
  );
}
