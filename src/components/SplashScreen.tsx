import React, { useState, useEffect } from "react";

const LeafSVG: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <svg
    viewBox="0 0 60 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={style}
  >
    <path
      d="M30 75 C30 75 5 55 5 30 C5 10 20 2 30 2 C40 2 55 10 55 30 C55 55 30 75 30 75Z"
      fill="white"
      fillOpacity="0.18"
    />
    <path
      d="M30 75 L30 2"
      stroke="white"
      strokeOpacity="0.25"
      strokeWidth="1.5"
    />
    <path
      d="M30 20 C20 18 10 22 8 30"
      stroke="white"
      strokeOpacity="0.2"
      strokeWidth="1"
    />
    <path
      d="M30 35 C20 33 8 38 6 46"
      stroke="white"
      strokeOpacity="0.2"
      strokeWidth="1"
    />
    <path
      d="M30 20 C40 18 50 22 52 30"
      stroke="white"
      strokeOpacity="0.2"
      strokeWidth="1"
    />
    <path
      d="M30 35 C40 33 52 38 54 46"
      stroke="white"
      strokeOpacity="0.2"
      strokeWidth="1"
    />
  </svg>
);

export const SplashScreen: React.FC<{ onComplete: () => void }> = ({
  onComplete,
}) => {
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    const openTimer = setTimeout(() => {
      setOpened(true);
    }, 500);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, 1800);

    return () => {
      clearTimeout(openTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  const panelBase: React.CSSProperties = {
    position: "fixed",
    top: 0,
    bottom: 0,
    width: "50%",
    zIndex: 9999,
    overflow: "hidden",
  };

  return (
    <>
      {/* LEFT PANEL */}
      <div
        className={`curtain-panel gradient-jungle ${opened ? "open-left" : ""}`}
        style={{ ...panelBase, left: 0 }}
      >
        {/* Ambient glow circles */}
        <div
          style={{
            position: "absolute",
            top: "-60px",
            left: "-60px",
            width: "220px",
            height: "220px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(16,185,129,0.35) 0%, transparent 70%)",
            filter: "blur(30px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "80px",
            left: "20px",
            width: "160px",
            height: "160px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(6,182,212,0.3) 0%, transparent 70%)",
            filter: "blur(25px)",
          }}
        />

        {/* Leaf decorations */}
        <div
          style={{
            position: "absolute",
            top: "40px",
            right: "10px",
            width: "60px",
            height: "80px",
            transform: "rotate(-30deg)",
          }}
        >
          <LeafSVG />
        </div>
        <div
          style={{
            position: "absolute",
            top: "140px",
            left: "20px",
            width: "44px",
            height: "58px",
            transform: "rotate(20deg)",
          }}
        >
          <LeafSVG />
        </div>
        <div
          style={{
            position: "absolute",
            bottom: "120px",
            right: "0px",
            width: "52px",
            height: "70px",
            transform: "rotate(-10deg)",
          }}
        >
          <LeafSVG />
        </div>
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            left: "30px",
            width: "38px",
            height: "50px",
            transform: "rotate(15deg)",
          }}
        >
          <LeafSVG />
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div
        className={`curtain-panel gradient-jungle ${opened ? "open-right" : ""}`}
        style={{ ...panelBase, right: 0 }}
      >
        {/* Ambient glow circles */}
        <div
          style={{
            position: "absolute",
            top: "-40px",
            right: "-40px",
            width: "200px",
            height: "200px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(6,182,212,0.35) 0%, transparent 70%)",
            filter: "blur(30px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "60px",
            right: "30px",
            width: "180px",
            height: "180px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(16,185,129,0.3) 0%, transparent 70%)",
            filter: "blur(28px)",
          }}
        />

        {/* Leaf decorations */}
        <div
          style={{
            position: "absolute",
            top: "60px",
            left: "5px",
            width: "56px",
            height: "74px",
            transform: "rotate(25deg)",
          }}
        >
          <LeafSVG />
        </div>
        <div
          style={{
            position: "absolute",
            top: "180px",
            right: "25px",
            width: "46px",
            height: "62px",
            transform: "rotate(-20deg)",
          }}
        >
          <LeafSVG />
        </div>
        <div
          style={{
            position: "absolute",
            bottom: "100px",
            left: "10px",
            width: "50px",
            height: "66px",
            transform: "rotate(8deg)",
          }}
        >
          <LeafSVG />
        </div>
        <div
          style={{
            position: "absolute",
            bottom: "30px",
            right: "20px",
            width: "40px",
            height: "54px",
            transform: "rotate(-12deg)",
          }}
        >
          <LeafSVG />
        </div>
      </div>

      {/* CENTER LOGO — sits above both panels */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 10000,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        {/* Glow halo behind logo */}
        <div
          style={{
            position: "absolute",
            width: "260px",
            height: "260px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(6,182,212,0.22) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />

        {/* Logo icon */}
        <div
          style={{
            fontSize: "64px",
            lineHeight: 1,
            marginBottom: "16px",
            filter: "drop-shadow(0 4px 24px rgba(0,0,0,0.3))",
          }}
          className="animate-float"
        >
          🌴
        </div>

        {/* App name */}
        <h1
          style={{
            fontFamily: "Outfit, sans-serif",
            fontWeight: 900,
            fontSize: "2.5rem",
            color: "#ffffff",
            letterSpacing: "-0.02em",
            margin: 0,
            textShadow: "0 2px 20px rgba(0,0,0,0.4)",
          }}
        >
          Pool-n-Pay
        </h1>

        {/* Tagline */}
        <p
          style={{
            fontFamily: "Outfit, sans-serif",
            fontWeight: 400,
            fontSize: "1rem",
            color: "rgba(255,255,255,0.70)",
            margin: "8px 0 0",
            letterSpacing: "0.02em",
          }}
        >
          Your travel money companion
        </p>

        {/* Subtle divider dots */}
        <div
          style={{
            display: "flex",
            gap: "6px",
            marginTop: "24px",
            alignItems: "center",
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: i === 1 ? "20px" : "6px",
                height: "6px",
                borderRadius: "3px",
                background:
                  i === 1
                    ? "rgba(255,255,255,0.9)"
                    : "rgba(255,255,255,0.35)",
                transition: "all 0.3s ease",
              }}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default SplashScreen;
