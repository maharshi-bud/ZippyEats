"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import axios from "axios";

const API =
  process.env.NEXT_PUBLIC_SERVER_URL ||
  "http://localhost:5010";

export default function PromoCarousel() {

  // ==========================================================
  // STATE
  // ==========================================================

  const [index, setIndex] =
    useState(0);

  const [isTransitioning, setIsTransitioning] =
    useState(true);

  const [isAnimating, setIsAnimating] =
    useState(false);

  const [banners, setBanners] =
    useState([]);

  const trackRef = useRef(null);

  // ==========================================================
  // FETCH BANNERS
  // ==========================================================

  useEffect(() => {

    fetchBanners();

  }, []);

  const fetchBanners =
    async () => {

      try {

        const res =
          await axios.get(
            `${API}/api/banners`
          );

        const formatted =
          (res.data.data || []).map(
            (banner) => {

              // uploaded DB image
              const dbImage =
                `${API}/api/banners/image/${banner._id}`;

              return {

                _id:
                  banner._id,

                title:
                  banner.title,

                // prefer uploaded image
                // fallback to URL image
                img:
                  banner.imageFile?.data
                    ? dbImage
                    : banner.image,
              };
            }
          );

        setBanners(formatted);

      } catch (err) {

        console.error(
          "Failed to fetch banners:",
          err
        );
      }
    };

  // ==========================================================
  // DUPLICATE FOR INFINITE LOOP
  // ==========================================================

  const items = [
    ...banners,
    ...banners,
    ...banners,
  ];

  const startIndex =
    banners.length;

  const gap = 20;

  const realIndex =
    (
      (
        index %
        banners.length
      ) +
      banners.length
    ) %
    banners.length;

  // ==========================================================
  // NAVIGATION
  // ==========================================================

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

  // ==========================================================
  // PERFECT CENTERING
  // ==========================================================

  useEffect(() => {

    const track =
      trackRef.current;

    if (
      !track ||
      banners.length === 0
    ) return;

    const card =
      track.children[0];

    if (!card) return;

    const cardWidth =
      card.offsetWidth;

    const container =
      track.parentElement;

    const containerWidth =
      container.offsetWidth;

    const totalOffset =
      (
        startIndex + index
      ) *
      (
        cardWidth + gap
      );

    const centerOffset =
      containerWidth / 2 -
      cardWidth / 2;

    track.style.transform =
      `translateX(${
        -totalOffset +
        centerOffset
      }px)`;

  }, [index, banners]);

  // ==========================================================
  // HANDLE TRANSITION END
  // ==========================================================

  const handleTransitionEnd =
    () => {

      setIsAnimating(false);

      if (
        index >= banners.length
      ) {

        setIsTransitioning(false);

        setIndex(0);
      }

      if (
        index <= -banners.length
      ) {

        setIsTransitioning(false);

        setIndex(0);
      }
    };

  // ==========================================================
  // RESET TRANSITION
  // ==========================================================

  useEffect(() => {

    if (!isTransitioning) {

      requestAnimationFrame(() => {

        requestAnimationFrame(() => {

          setIsTransitioning(true);
        });
      });
    }

  }, [isTransitioning]);

  // ==========================================================
  // AUTOPLAY
  // ==========================================================

  useEffect(() => {

    if (
      banners.length === 0
    ) return;

    const interval =
      setInterval(() => {

        handleNext();

      }, 3500);

    return () =>
      clearInterval(interval);

  }, [banners, isAnimating]);

  // ==========================================================
  // LOADING
  // ==========================================================

  if (banners.length === 0) {

    return (
      <div className="
        flex
        h-[320px]
        items-center
        justify-center
        text-slate-400
      ">
        Loading banners...
      </div>
    );
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div className="carousel">

      <div

        ref={trackRef}

        onTransitionEnd={
          handleTransitionEnd
        }

        className="track"

        style={{

          display: "flex",

          gap: `${gap}px`,

          transition:
            isTransitioning

              ? "transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)"

              : "none",
        }}
      >

        {items.map((b, i) => {

          const itemIndex =
            i % banners.length;

          return (

            <div

              key={`${b._id}-${i}`}

              className="Promocard"

              style={{

                minWidth: "790px",

                height: "290px",

                borderRadius: "18px",

                backgroundImage:
                  `url(${b.img})`,

                backgroundSize:
                  "cover",

                backgroundPosition:
                  "center",

                opacity:
                  itemIndex === realIndex
                    ? 1
                    : 0.5,

                transition:
                  "all 0.4s ease",

                overflow:
                  "hidden",

                position:
                  "relative",
              }}
            >

              {/* OVERLAY */}

              <div className="
                absolute
                inset-0
                flex
                items-end
                bg-gradient-to-t
                from-black/70
                via-black/20
                to-transparent
                p-8
              ">

                <h2 className="
                  text-3xl
                  font-bold
                  text-white
                  drop-shadow-lg
                  absolute 
                  bottom-0
                  left-5  
                ">
                  {b.title}
                </h2>

              </div>

            </div>
          );
        })}
      </div>

      {/* ==================================================== */}
      {/* ARROWS */}
      {/* ==================================================== */}

      <button
        className="arrow left"
        onClick={handlePrev}
      >
        ‹
      </button>

      <button
        className="arrow right"
        onClick={handleNext}
      >
        ›
      </button>

    </div>
  );
}