export function Decorations() {
  return (
    <>
      {/* Background shapes - mais sutis com opacidade */}
      <div className="absolute left-0 top-0 h-full w-1/3 opacity-10">
        <svg viewBox="0 0 400 600" className="h-full w-full" preserveAspectRatio="none">
          <path
            d="M 0 0 Q 150 100 150 200 Q 150 300 100 400 Q 50 500 150 600 L 0 600 Z"
            fill="#0EA5E9"
          />
        </svg>
      </div>

      <div className="absolute right-0 top-0 h-full w-1/3 opacity-10">
        <svg viewBox="0 0 400 600" className="h-full w-full" preserveAspectRatio="none">
          <path
            d="M 400 0 Q 250 150 300 300 Q 350 450 250 600 L 400 600 Z"
            fill="#0EA5E9"
          />
        </svg>
      </div>

      {/* Decorative elements - mais sutis */}
      {/* Stars */}
      <div className="absolute left-[15%] top-[15%] opacity-20">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="#EF4444">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      </div>

      <div className="absolute left-[25%] top-[45%] opacity-20">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="#0EA5E9">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      </div>

      <div className="absolute right-[15%] top-[20%] opacity-20">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#EC4899">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      </div>

      <div className="absolute right-[8%] top-[75%] opacity-20">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="#FBBF24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      </div>

      {/* Circles */}
      <div className="absolute left-[18%] top-[25%]">
        <div className="h-12 w-12 rounded-full border-4 border-sky-500"></div>
      </div>

      <div className="absolute left-[32%] top-[35%]">
        <div className="h-8 w-8 rounded-full border-4 border-sky-400"></div>
      </div>

      <div className="absolute right-[25%] top-[28%]">
        <div className="h-10 w-10 rounded-full border-4 border-sky-400"></div>
      </div>

      <div className="absolute left-[28%] top-[65%]">
        <div className="h-6 w-6 rounded-full border-3 border-orange-400"></div>
      </div>

      <div className="absolute right-[35%] top-[32%]">
        <div className="h-7 w-7 rounded-full border-3 border-amber-400"></div>
      </div>

      {/* Small dots */}
      <div className="absolute left-[12%] top-[18%] h-3 w-3 rounded-full bg-sky-400"></div>
      <div className="absolute right-[18%] top-[12%] h-2 w-2 rounded-full bg-amber-400"></div>
      <div className="absolute right-[40%] top-[8%] h-2.5 w-2.5 rounded-full bg-pink-400"></div>

      {/* Suns */}
      <div className="absolute left-[8%] top-[60%]">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      </div>

      <div className="absolute right-[12%] top-[22%]">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      </div>

      {/* Rainbows */}
      <div className="absolute left-[22%] top-[52%]">
        <svg width="60" height="40" viewBox="0 0 60 40">
          <path d="M 5 35 Q 30 5 55 35" fill="none" stroke="#EF4444" strokeWidth="4" strokeLinecap="round" />
          <path d="M 8 35 Q 30 10 52 35" fill="none" stroke="#FBBF24" strokeWidth="4" strokeLinecap="round" />
          <path d="M 11 35 Q 30 15 49 35" fill="none" stroke="#0EA5E9" strokeWidth="4" strokeLinecap="round" />
        </svg>
      </div>

      <div className="absolute right-[38%] top-[45%]">
        <svg width="80" height="50" viewBox="0 0 80 50">
          <path d="M 5 45 Q 40 5 75 45" fill="none" stroke="#F59E0B" strokeWidth="5" strokeLinecap="round" />
          <path d="M 10 45 Q 40 12 70 45" fill="none" stroke="#EF4444" strokeWidth="5" strokeLinecap="round" />
          <path d="M 15 45 Q 40 19 65 45" fill="none" stroke="#0EA5E9" strokeWidth="5" strokeLinecap="round" />
        </svg>
      </div>

      {/* Striped circles */}
      <div className="absolute left-[20%] top-[80%]">
        <svg width="50" height="50" viewBox="0 0 50 50">
          <circle cx="25" cy="25" r="22" fill="none" stroke="#0EA5E9" strokeWidth="2" strokeDasharray="4 4" />
        </svg>
      </div>

      <div className="absolute right-[10%] top-[8%]">
        <svg width="40" height="40" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="18" fill="none" stroke="#0EA5E9" strokeWidth="2" strokeDasharray="4 4" />
        </svg>
      </div>

      {/* Hearts */}
      <div className="absolute left-[35%] top-[28%]">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="#EC4899">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </div>

      {/* Small rectangles */}
      <div className="absolute left-[16%] top-[48%] h-4 w-4 bg-orange-400"></div>
      <div className="absolute right-[28%] top-[80%] h-3 w-3 bg-sky-400"></div>

      {/* Striped patterns - decorative diagonal lines */}
      <div className="absolute right-[15%] top-[12%]">
        <svg width="60" height="60" viewBox="0 0 60 60">
          <g stroke="#0EA5E9" strokeWidth="3">
            <line x1="0" y1="0" x2="20" y2="0" />
            <line x1="0" y1="6" x2="20" y2="6" />
            <line x1="0" y1="12" x2="20" y2="12" />
            <line x1="0" y1="18" x2="20" y2="18" />
            <line x1="0" y1="24" x2="20" y2="24" />
          </g>
        </svg>
      </div>

      <div className="absolute left-[18%] top-[70%]">
        <svg width="50" height="50" viewBox="0 0 50 50">
          <g stroke="#0EA5E9" strokeWidth="3">
            <line x1="0" y1="0" x2="18" y2="0" />
            <line x1="0" y1="5" x2="18" y2="5" />
            <line x1="0" y1="10" x2="18" y2="10" />
            <line x1="0" y1="15" x2="18" y2="15" />
            <line x1="0" y1="20" x2="18" y2="20" />
          </g>
        </svg>
      </div>
    </>
  );
}
