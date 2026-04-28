"use client";

import { useEffect, useRef, useState } from "react";

export default function PromoCarousel() {
  const [index, setIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  const trackRef = useRef(null);

  const banners = [
    { img: "https://images.unsplash.com/photo-1600891964599-f61ba0e24092", title: "Delivered in Under 30 Minutes" },
    { img: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe", title: "Flat 50% OFF on First Order" },
    { img: "https://images.unsplash.com/photo-1550547660-d9450f859349", title: "Hot Deals on Burgers" },
    { img: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38", title: "Pizza Party Deals" },
    { img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c", title: "Healthy Food Options" },
    { img: "https://images.unsplash.com/photo-1551782450-a2132b4ba21d", title: "Combo Meals Starting ₹99" }
  ];

  const items = [...banners, ...banners, ...banners];
  const startIndex = banners.length;

  const gap = 16;

  const realIndex =
    ((index % banners.length) + banners.length) % banners.length;

  const handleNext = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setIsTransitioning(true);
    setIndex((p) => p + 1);
  };

  const handlePrev = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setIsTransitioning(true);
    setIndex((p) => p - 1);
  };

  // 🔥 PERFECT CENTERING
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const card = track.children[0];
    const cardWidth = card.offsetWidth;

    const container = track.parentElement;
    const containerWidth = container.offsetWidth;

    const totalOffset =
      (startIndex + index) * (cardWidth + gap);

    const centerOffset = containerWidth / 2 - cardWidth / 2;

    track.style.transform = `translateX(${
      -totalOffset + centerOffset
    }px)`;
  }, [index]);

  // 🔥 HANDLE END (smooth infinite loop)
  const handleTransitionEnd = () => {
    setIsAnimating(false);

    if (index >= banners.length) {
      setIsTransitioning(false);
      setIndex(0);
    }

    if (index <= -banners.length) {
      setIsTransitioning(false);
      setIndex(0);
    }
  };

  // autoplay
  useEffect(() => {
    const interval = setInterval(() => {
      handleNext();
    }, 3500000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="carousel">

      <div
        ref={trackRef}
        onTransitionEnd={handleTransitionEnd}
        className="track"
        style={{
          display: "flex",
          gap: `${gap}px`,
          transition: isTransitioning
            ? "transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)"
            : "none"
        }}
      >
        {items.map((b, i) => {
          const itemIndex = i % banners.length;

          return (
            <div
              key={i}
              className="Promocard"
              style={{
                minWidth: "500px",
                height: "260px",
                borderRadius: "18px",
                backgroundImage: `url(${b.img})`,
                backgroundSize: "cover",
                backgroundPosition: "center",

                opacity: itemIndex === realIndex ? 1 : 0.5,
                // transform:
                //   itemIndex === realIndex
                //     ? "scale(1.08)"
                //     : "scale(0.92)",
                transition: "all 0.4s ease"
              }}
            >
              <div className="overlay">
                <h2>{b.title}</h2>
              </div>
            </div>
          );
        })}
      </div>

      {/* 🔥 ARROWS */}
      <button className="arrow left" onClick={handlePrev}>
        ‹
      </button>

      <button className="arrow right" onClick={handleNext}>
        ›
      </button>
    </div>
  );
}