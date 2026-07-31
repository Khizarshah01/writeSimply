import { forwardRef, useImperativeHandle, useCallback } from "react";
import type { AnimatedIconHandle, AnimatedIconProps } from "./types";
import { motion, useAnimate } from "motion/react";

const HistoryCircleIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  (
    { size = 24, color = "currentColor", strokeWidth = 2, className = "" },
    ref,
  ) => {
    const [scope, animate] = useAnimate();

    const start = useCallback(async () => {
      // rewind circle slightly
      animate(
        ".history-circle",
        {
          rotate: -45,
          pathLength: [1, 0.75],
        },
        {
          duration: 0.35,
          ease: "easeOut",
        },
      );

      // clock hand ticks back
      animate(
        ".clock-hand",
        {
          rotate: -30,
        },
        {
          duration: 0.25,
          ease: "easeOut",
        },
      );
    }, [animate]);

    const stop = useCallback(async () => {
      animate(
        ".history-circle, .clock-hand",
        {
          rotate: 0,
          pathLength: 1,
        },
        {
          duration: 0.25,
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

        {/* clock hand */}
        <motion.path
          d="M12 8l0 4l2 2"
          className="clock-hand"
          style={{ transformOrigin: "50% 50%" }}
        />

        {/* history circle */}
        <motion.path
          d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5"
          className="history-circle"
          style={{ transformOrigin: "50% 50%" }}
        />
      </motion.svg>
    );
  },
);

HistoryCircleIcon.displayName = "HistoryCircleIcon";
export default HistoryCircleIcon;
