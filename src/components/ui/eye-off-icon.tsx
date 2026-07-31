import { forwardRef, useImperativeHandle, useCallback } from "react";
import type { AnimatedIconHandle, AnimatedIconProps } from "./types";
import { motion, useAnimate } from "motion/react";

const EyeOffIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  (
    { size = 24, color = "currentColor", strokeWidth = 2, className = "" },
    ref,
  ) => {
    const [scope, animate] = useAnimate();

    const start = useCallback(async () => {
      // Strike-through line extends
      animate(
        ".eye-strike",
        {
          pathLength: [0, 1],
          opacity: [0.5, 1],
        },
        {
          duration: 0.3,
          ease: "easeOut",
        },
      );

      // Eye parts fade slightly
      animate(
        ".eye-parts",
        {
          opacity: 0.6,
          scale: 0.98,
        },
        {
          duration: 0.3,
          ease: "easeOut",
        },
      );
    }, [animate]);

    const stop = useCallback(async () => {
      animate(
        ".eye-strike, .eye-parts",
        {
          pathLength: 1,
          opacity: 1,
          scale: 1,
        },
        {
          duration: 0.2,
          ease: "easeInOut",
        },
      );
    }, [animate]);

    useImperativeHandle(ref, () => ({
      startAnimation: start,
      stopAnimation: stop,
    }));

    return (
      <motion.svg
        ref={scope}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`cursor-pointer ${className}`}
        onHoverStart={start}
        onHoverEnd={stop}
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />

        {/* Eye parts */}
        <motion.g className="eye-parts" style={{ transformOrigin: "50% 50%" }}>
          <path d="M10.585 10.587a2 2 0 0 0 2.829 2.828" />
          <path d="M16.681 16.673a8.717 8.717 0 0 1 -4.681 1.327c-3.6 0 -6.6 -2 -9 -6c1.272 -2.12 2.712 -3.678 4.32 -4.674m2.86 -1.146a9.055 9.055 0 0 1 1.82 -.18c3.6 0 6.6 2 9 6c-.666 1.11 -1.379 2.067 -2.138 2.87" />
        </motion.g>

        {/* Strike-through line */}
        <motion.path
          d="M3 3l18 18"
          className="eye-strike"
          initial={{ pathLength: 1 }}
        />
      </motion.svg>
    );
  },
);

EyeOffIcon.displayName = "EyeOffIcon";
export default EyeOffIcon;
