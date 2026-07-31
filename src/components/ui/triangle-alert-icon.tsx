import { forwardRef, useImperativeHandle, useCallback } from "react";
import type { AnimatedIconHandle, AnimatedIconProps } from "./types";
import { motion, useAnimate } from "motion/react";

const TriangleAlertIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  (
    { size = 24, color = "currentColor", strokeWidth = 2, className = "" },
    ref,
  ) => {
    const [scope, animate] = useAnimate();

    const start = useCallback(async () => {
      await animate(
        ".triangle",
        {
          y: [0, -1.5, 0],
        },
        {
          duration: 0.25,
          ease: "easeOut",
        },
      );

      animate(
        ".exclamation-line",
        {
          scaleY: [1, 1.35, 1],
        },
        {
          duration: 0.3,
          ease: "easeOut",
        },
      );

      animate(
        ".exclamation-dot",
        {
          scale: [1, 1.4, 1],
          opacity: [1, 0.6, 1],
        },
        {
          duration: 0.25,
          delay: 0.05,
          ease: "easeOut",
        },
      );
    }, [animate]);

    const stop = useCallback(() => {
      animate(".triangle", { y: 0 }, { duration: 0.2, ease: "easeOut" });
      animate(
        ".exclamation-line",
        { scaleY: 1 },
        { duration: 0.2, ease: "easeOut" },
      );
      animate(
        ".exclamation-dot",
        { scale: 1, opacity: 1 },
        { duration: 0.2, ease: "easeOut" },
      );
    }, [animate]);

    useImperativeHandle(ref, () => ({
      startAnimation: start,
      stopAnimation: stop,
    }));

    return (
      <motion.svg
        ref={scope}
        onHoverStart={start}
        onHoverEnd={stop}
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
      >
        <motion.path
          className="triangle"
          d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"
        />

        <g>
          <motion.path
            className="exclamation-line"
            d="M12 9v4"
            style={{ transformOrigin: "12px 11px" }}
          />
          <motion.path
            className="exclamation-dot"
            d="M12 17h.01"
            style={{ transformOrigin: "12px 17px" }}
          />
        </g>
      </motion.svg>
    );
  },
);

TriangleAlertIcon.displayName = "TriangleAlertIcon";
export default TriangleAlertIcon;
