import React, { useState } from 'react';

interface BrandEmblemProps {
  className?: string;
}

export const BrandEmblem: React.FC<BrandEmblemProps> = ({ className = 'w-11 h-11' }) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`${className} rounded-full border-2 border-[#1B5E42] bg-emerald-50 text-[#1B5E42] flex items-center justify-center font-bold text-xs select-none`}
        aria-hidden="true"
      >
        CC
      </div>
    );
  }

  return (
    <img
      src="/assets/aistudio/logo_e0f99096.png"
      alt="Logo Conferência de Carcaças"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`${className} object-contain select-none`}
    />
  );
};
