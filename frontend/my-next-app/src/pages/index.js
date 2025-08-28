import { useRouter } from "next/router";
import getConfig from 'next/config';
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const [isExiting, setIsExiting] = useState(false);

  const { publicRuntimeConfig = {} } = getConfig() || {};
  const basePath = publicRuntimeConfig.basePath || '/darkweb';
  const handleClick = () => {
    setIsExiting(true);
    setTimeout(() => {
      router.push(basePath + "/lock");
    }, 1000); // Match with animation duration
  };

  return (
    <div
      className={`transition-all duration-1000 ease-in-out transform ${isExiting ? "opacity-0 scale-95" : "opacity-100 scale-100"
        } relative h-screen w-full overflow-hidden bg-black flex flex-col items-center justify-center space-y-8`}
    >
      {/* 🔲 Grid Background */}
      <div className="absolute inset-0 perspective-[100rem] [transform-style:preserve-3d] z-0">
        {[1, -1].map((dir, i) => (
          <div
            key={i}
            className={`absolute left-1/2 w-[300%] h-[150%] min-h-[70rem] [transform-style:preserve-3d] ${dir === 1
                ? "bottom-0 [transform-origin:bottom_center] [transform:translateX(-50%)_rotateX(85deg)]"
                : "top-0 [transform-origin:top_center] [transform:translateX(-50%)_rotateX(-85deg)]"
              }`}
            style={{ "--dir": dir }}
          >
            <div className="absolute inset-0 [transform-style:preserve-3d] before:absolute before:inset-0 before:block before:bg-[repeating-linear-gradient(to_left,green,green_4px,transparent_4px,transparent_10rem),repeating-linear-gradient(to_bottom,green,green_4px,transparent_4px,transparent_10rem)] before:animate-[gridmove_2s_linear_infinite] after:absolute after:inset-0 after:block after:bg-gradient-to-b after:from-black after:to-transparent after:translate-z-[1px] z-0"></div>
            <div className="absolute inset-0 blur-[1rem] mix-blend-plus-lighter z-10" />
          </div>
        ))}
      </div>

      {/* 🧠 Heading */}
      <h1 className="text-green-500 text-[2.5rem] sm:text-[4rem] md:text-[6rem] font-mono font-bold drop-shadow-[0_0_5px_currentColor] relative z-20 text-center">
        Check if your data is exposed !
        <span className="inline-block ml-2 w-[0.2em] h-[0.7em] bg-current align-middle animate-blink" />
      </h1>

      {/* 🚀 Get Started Button */}
      <button
        onClick={handleClick}
        className="relative z-20 py-4 px-8 text-center font-semibold uppercase text-white rounded-lg border-solid transition-transform duration-300 ease-in-out group outline-offset-4 focus:outline focus:outline-2 focus:outline-white overflow-hidden"
      >
        <span className="relative z-20">Get Started</span>

        {/* Shine + Corners */}
        <span className="absolute left-[-75%] top-0 h-full w-[50%] bg-white/20 rotate-12 z-10 blur-lg group-hover:left-[125%] transition-all duration-1000 ease-in-out" />
        <span className="absolute top-0 left-0 w-1/2 h-[20%] rounded-tl-lg border-l-2 border-t-2 border-[#D4EDF9] transition-all duration-300 drop-shadow-3xl" />
        <span className="absolute top-0 right-0 w-1/2 h-[60%] group-hover:h-[90%] rounded-tr-lg border-r-2 border-t-2 border-[#D4EDF9] transition-all duration-300 drop-shadow-3xl" />
        <span className="absolute bottom-0 left-0 w-1/2 h-[60%] group-hover:h-[90%] rounded-bl-lg border-l-2 border-b-2 border-[#D4EDF9] transition-all duration-300 drop-shadow-3xl" />
        <span className="absolute bottom-0 right-0 w-1/2 h-[20%] rounded-br-lg border-r-2 border-b-2 border-[#D4EDF9] transition-all duration-300 drop-shadow-3xl" />
      </button>

      {/* 🔁 Animations */}
      <style jsx global>{`
        @keyframes gridmove {
          from {
            transform: translateY(0);
          }
          to {
            transform: translateY(calc(10rem * var(--dir)));
          }
        }

        @keyframes blink {
          0%,
          50% {
            visibility: visible;
          }
          51%,
          100% {
            visibility: hidden;
          }
        }

        .animate-blink {
          animation: blink 1s step-end infinite;
        }
      `}</style>
    </div>
  );
}
