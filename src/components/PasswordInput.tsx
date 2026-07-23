import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export function PasswordInput({ 
  value, 
  onChange, 
  placeholder = "Password",
  className = "",
  autoFocus = false
}: { 
  value: string; 
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}) {
  const [show, setShow] = useState(false);

  return (
    <div className={`relative flex items-center ${className}`}>
      <input
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus={autoFocus}
        className="w-full h-full rounded-full border-2 px-4 py-3 outline-none text-sm pr-10 focus:ring-2 focus:ring-ring"
        style={{ backgroundColor: "#ffffff", color: "#111111", borderColor: "var(--foreground)" }}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 grid h-6 w-6 place-items-center text-black/50 hover:text-black transition-colors"
        tabIndex={-1}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
