import React from "react";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ size = "md", showTagline = true }) => {
  const isLarge = size === "lg";
  const isSmall = size === "sm";

  return (
    <div className="flex items-center space-x-3.5 select-none">
      {/* Official TreadTrace Logo: Front-View F1 Car with Red Tachometer Arch */}
      <div className="relative flex items-center justify-center flex-shrink-0">
        <img
          src="/images/treadtrace_logo.png"
          alt="TreadTrace Logo"
          loading="eager"
          draggable={false}
          className={`${
            isLarge ? "h-14 sm:h-16" : isSmall ? "h-7" : "h-10 sm:h-11"
          } w-auto object-contain drop-shadow-[0_0_14px_rgba(225,6,0,0.75)]`}
        />
      </div>

      {/* Brand Name Typography */}
      <div>
        <div className="flex items-center space-x-2">
          <span
            className={`font-black tracking-tighter uppercase text-white font-mono italic leading-none ${
              isLarge ? "text-2xl sm:text-3xl" : isSmall ? "text-base" : "text-xl sm:text-2xl"
            }`}
          >
            TREAD<span className="text-[#E10600]">TRACE</span>
          </span>
          <span
            className={`px-1.5 py-0.5 rounded bg-[#E10600]/20 text-[#FF2A1A] font-mono font-bold tracking-widest border border-[#E10600]/40 ${
              isLarge ? "text-[10px]" : "text-[9px]"
            }`}
          >
            F1-SPEC AI
          </span>
        </div>
        {showTagline && (
          <p
            className={`text-[#9A9FA8] font-mono uppercase tracking-widest mt-0.5 font-semibold ${
              isLarge ? "text-[11px]" : "text-[10px]"
            }`}
          >
            Tyre Intelligence & Digital Twin
          </p>
        )}
      </div>
    </div>
  );
};
