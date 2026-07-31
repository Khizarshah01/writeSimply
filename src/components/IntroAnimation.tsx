import { useEffect, useState } from "react";
import { TextAnimate } from "./ui/text-animate";
import { motion, AnimatePresence } from "motion/react";

interface IntroAnimationProps {
    onComplete: () => void;
}

export default function IntroAnimation({ onComplete }: IntroAnimationProps) {
    const [isVisible, setIsVisible] = useState(true);

    const dismiss = () => {
        setIsVisible(false);
        setTimeout(onComplete, 400); // wait for exit animation
    };

    useEffect(() => {
        const timer = setTimeout(dismiss, 1500);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.4 } }}
                    onClick={dismiss}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--background)] cursor-pointer"
                >
                    <div className="text-center">
                        <TextAnimate
                            animation="blurInUp"
                            by="character"
                            className="text-2xl md:text-3xl font-medium tracking-wide text-[var(--text-color)]/90"
                            delay={0.1}
                        >
                            Welcome to WriteSimply
                        </TextAnimate>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
