import React, { useState, useEffect, useRef } from 'react';

// --- Custom Hook for Card Interaction (3D Tilt & Follow Glow) ---
const useInteractiveCard = () => {
    const cardRef = useRef(null);

    const handleMouseMove = (e) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const { width, height } = rect;

        const rotateX = (y / height - 0.5) * -20; // Max tilt 10 degrees
        const rotateY = (x / width - 0.5) * 20;  // Max tilt 10 degrees

        cardRef.current.style.setProperty('--mouse-x', `${x}px`);
        cardRef.current.style.setProperty('--mouse-y', `${y}px`);
        cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
    };

    const handleMouseLeave = () => {
        if (!cardRef.current) return;
        cardRef.current.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
    };

    return { cardRef, handleMouseMove, handleMouseLeave };
};

// --- Custom Hook for Scroll-based Entrance Animation ---
const useInView = (options) => {
    const ref = useRef(null);
    const [isInView, setIsInView] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsInView(true);
                observer.unobserve(entry.target);
            }
        }, options);

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            if (ref.current) {
                // eslint-disable-next-line react-hooks/exhaustive-deps
                observer.unobserve(ref.current);
            }
        };
    }, [ref, options]);

    return [ref, isInView];
};

// --- Helper Components ---
const Icon = ({ path, className = 'w-6 h-6', ...props }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
);

const featureIcons = {
    'AI Study Planner': "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    'Aura Reader': "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25",
    'AI Study Buddy': "M9.813 15.904L9 15l.813-.904L9.937 15l-.124.904zM12 21a9 9 0 100-18 9 9 0 000 18z",
    'My Topic Calendar': "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5",
    'AI-Powered Flashcards': "M11.354 16.646a.5.5 0 010-.708L14.293 12l-2.939-2.939a.5.5 0 11.708-.708l3.293 3.293a.5.5 0 010 .708l-3.293 3.293a.5.5 0 01-.708 0z",
    'Collaborative Study Sessions': "M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.04-2.72a3 3 0 00-4.682 2.72 9.094 9.094 0 003.741.479m7.04-2.72a3 3 0 01-2.247 2.247m1.334 0a3 3 0 01-2.247-2.247M3 18.72v-3.528c0-.995.606-1.911 1.558-2.328a.75.75 0 11.812 1.348a1.5 1.5 0 00-.93 1.157v2.353a9.094 9.094 0 003.741.479M21 18.72v-3.528c0-.995-.606-1.911-1.558-2.328a.75.75 0 10-.812 1.348a1.5 1.5 0 01.93 1.157v2.353a9.094 9.094 0 01-3.741.479M12 15a3 3 0 110-6 3 3 0 010 6z",
    'Mind Map Generator': "M3.75 12h16.5M12 3.75v16.5m-4.5-4.5H12M12 8.25h4.5M6 12H9m-2.25-4.5H6.75M12 16.5h4.5m-4.5-4.5H12m-4.5 0h4.5M12 12v4.5"
};

// --- FeatureCard Component ---
const FeatureCard = ({ title, description, onClick }) => {
    const { cardRef, handleMouseMove, handleMouseLeave } = useInteractiveCard();

    return (
        <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={onClick}
            className="group feature-card-glow relative bg-[#121212] p-6 rounded-2xl border border-[#2a2a2a] cursor-pointer h-full"
        >
            <div className="relative z-10 h-full flex flex-col">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                        <Icon path={featureIcons[title]} className="w-8 h-8 text-gray-500 transition-colors duration-300 group-hover:text-[#00BFFF]" />
                        <h3 className="text-2xl font-bold text-white pr-4 text-shadow-sm">{title}</h3>
                    </div>
                    <Icon path="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" className="w-7 h-7 text-gray-600 transition-all duration-300 group-hover:text-white group-hover:translate-x-1" />
                </div>
                <p className="text-gray-400 font-inter text-base flex-grow">{description}</p>
            </div>
        </div>
    );
};

// --- AnimatedCardWrapper Component ---
const AnimatedCardWrapper = ({ feature, index, onFeatureSelect }) => {
    const [ref, inView] = useInView({ threshold: 0.1, triggerOnce: true });

    return (
        <div
            ref={ref}
            className={`card-container ${inView ? 'is-visible' : ''}`}
            style={{ transitionDelay: `${inView ? index * 100 : 0}ms` }}
        >
            <FeatureCard
                title={feature.title}
                description={feature.description}
                onClick={() => onFeatureSelect(feature.id)}
            />
        </div>
    );
};

// --- Main FeaturesPage Component ---
export const FeaturesPage = ({ onFeatureSelect }) => {
    const title = "Features Hub";
    const features = [
        { id: 'dashboard', title: 'AI Study Planner', description: 'Generate personalized study plans from your course materials, tailored to your schedule and goals.' },
        { id: 'auraReader', title: 'Aura Reader', description: 'Experience an interactive PDF reader with AI-powered highlighting, smart notes, and instant summaries.' },
        { id: 'dashboard', title: 'AI Study Buddy', description: 'Get instant explanations and clarify complex topics by asking direct questions about your content.' },
        { id: 'calendar', title: 'My Topic Calendar', description: 'Visually organize your entire study schedule, track progress, and manage deadlines with ease.' },
        { id: 'flashcards', title: 'AI-Powered Flashcards', description: 'Create intelligent flashcards from your documents, optimized for spaced repetition and memory retention.' },
        { id: 'studysessions', title: 'Collaborative Study Sessions', description: 'Join or create dynamic study groups, share insights, and learn collaboratively in real-time.' },
        { id: 'mindmap', title: 'Mind Map Generator', description: 'Automatically generate comprehensive mind maps from your study materials to visualize connections.' },
    ];

    const styles = `
        /* MODIFICATION: Merged background layers */
        .merged-background {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: -1;
            background:
                /* Top layer: Soft radial glow */
                radial-gradient(circle at center, rgba(0, 191, 255, 0.08) 0%, rgba(0,0,0,0) 35%),
                /* Bottom layer: Animated linear gradient */
                linear-gradient(300deg, #050505, #101010, #050505, #004d99);
            background-size: 100% 100%, 200% 200%; /* Size for each layer */
            animation: gradient-animation 20s ease infinite;
        }
        @keyframes gradient-animation {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }

        /* Typography */
        .dynamic-heading {
            font-family: 'Poppins', sans-serif; font-weight: 800; color: #F5F5F5;
            letter-spacing: -0.02em; text-shadow: 0 0 15px rgba(0, 191, 255, 0.3);
        }
        .stagger-reveal span {
            display: inline-block; opacity: 0; transform: translateY(20px) scale(0.9);
            animation: reveal 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        @keyframes reveal { to { opacity: 1; transform: translateY(0) scale(1); } }
        
        /* Entrance animation for card containers */
        .card-container {
            opacity: 0; transform: translateY(30px);
            transition: opacity 0.6s ease-out, transform 0.6s ease-out;
        }
        .card-container.is-visible { opacity: 1; transform: translateY(0); }
        
        /* Card-specific interactions */
        .feature-card-glow {
            transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), border 0.3s ease, box-shadow 0.3s ease;
            transform-style: preserve-3d;
        }
        .feature-card-glow:hover {
            border-color: rgba(0, 191, 255, 0.7);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }
        .feature-card-glow::before {
            content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0;
            border-radius: 1rem;
            background: radial-gradient(circle at var(--mouse-x) var(--mouse-y), 
                                        rgba(0, 191, 255, 0.25), transparent 40%);
            opacity: 0; transition: opacity 0.3s ease;
        }
        .feature-card-glow:hover::before { opacity: 1; }
    `;

    return (
        <div className="relative min-h-screen w-full bg-[#0A0A0A] overflow-hidden">
            <style>{styles}</style>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
            <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@700;800&family=Inter:wght@400;500&display=swap" rel="stylesheet" />

            {/* MODIFICATION: Single background div */}
            <div className="merged-background"></div>
            
            <div className="container mx-auto px-6 py-20 relative z-10 animate-fade-in">
                <h2 className="text-5xl md:text-6xl font-bold text-center mb-4 dynamic-heading stagger-reveal">
                    {title.split("").map((char, index) => (
                        <span key={index} style={{ animationDelay: `${index * 0.05}s` }}>{char === " " ? "\u00A0" : char}</span>
                    ))}
                </h2>
                <p className="text-lg text-gray-400 text-center mb-16 max-w-2xl mx-auto font-inter">
                    Your complete arsenal for peak academic performance. Select a tool to begin.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <AnimatedCardWrapper
                            key={index}
                            feature={feature}
                            index={index}
                            onFeatureSelect={onFeatureSelect}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};