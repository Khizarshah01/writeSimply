import { useEffect, useState } from "react";
import { TextAnimate } from "./ui/text-animate";
import { motion, AnimatePresence } from "motion/react";

interface IntroAnimationProps {
    onComplete: () => void;
}

export default function IntroAnimation({ onComplete }: IntroAnimationProps) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onComplete, 500); // Wait for exit animation
        }, 1500); // 1.5s fast duration

        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.5 } }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black text-white"
                >
                    <div className="text-center">
                        <TextAnimate
                            animation="blurInUp"
                            by="character"
                            className="text-2xl md:text-3xl font-medium tracking-wide text-white/90"
                            delay={0.1}
                        >
                            Welcome to writesimply
                        </TextAnimate>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
