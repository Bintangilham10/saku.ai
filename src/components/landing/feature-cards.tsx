"use client";

export function FeatureCards() {
  return (
    <div className="mt-6 flex items-center justify-center gap-2.5 lg:justify-start">
      {/* ── Card 1: Wallet & floating coins ── */}
      <div className="feature-card">
        <div className="fc-inner">
          <div className="wallet-body">
            <div className="wallet-flap" />
            <div className="wallet-slot" />
          </div>
          <div className="coin coin-1" />
          <div className="coin coin-2" />
          <div className="coin coin-3" />
        </div>
      </div>

      {/* ── Card 2: Lightning tap ── */}
      <div className="feature-card">
        <div className="fc-inner">
          <div className="phone-body">
            <div className="phone-screen">
              <div className="check-ring">
                <div className="check-mark" />
              </div>
            </div>
          </div>
          <div className="bolt bolt-1">⚡</div>
          <div className="bolt bolt-2">⚡</div>
        </div>
      </div>

      {/* ── Card 3: AI chat bubble ── */}
      <div className="feature-card">
        <div className="fc-inner">
          <div className="chat-bubble bubble-bot">
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
          </div>
          <div className="chat-bubble bubble-user" />
        </div>
      </div>

      <style>{`
        .feature-card {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(15,23,42,0.65);
          backdrop-filter: blur(12px);
          box-shadow: 0 2px 12px rgba(0,0,0,0.35),
                      0 1px 0 rgba(255,255,255,0.05) inset;
          transition: transform 0.3s cubic-bezier(.34,1.56,.64,1),
                      box-shadow 0.3s ease;
          cursor: default;
          width: 52px;
          height: 48px;
        }
        .feature-card:hover {
          transform: translateY(-4px) scale(1.08);
          box-shadow: 0 8px 24px rgba(0,0,0,0.5),
                      0 1px 0 rgba(255,255,255,0.09) inset;
        }

        .fc-inner {
          position: relative;
          width: 36px;
          height: 32px;
        }

        /* ── Card 1: Wallet ── */
        .wallet-body {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 24px;
          height: 16px;
          background: linear-gradient(135deg, #10b981, #059669);
          border-radius: 5px;
          box-shadow: 0 2px 6px rgba(16,185,129,0.4);
        }
        .wallet-flap {
          position: absolute;
          top: -5px;
          left: 2px;
          width: 20px;
          height: 7px;
          background: linear-gradient(135deg, #34d399, #10b981);
          border-radius: 4px 4px 0 0;
        }
        .wallet-slot {
          position: absolute;
          right: 3px;
          top: 50%;
          transform: translateY(-50%);
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(255,255,255,0.3);
        }

        .coin {
          position: absolute;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 35%, #fde68a, #f59e0b);
          box-shadow: 0 1px 4px rgba(245,158,11,0.5);
          animation: coinFloat 2.2s ease-in-out infinite;
          opacity: 0;
        }
        .coin-1 { left: 4px;  animation-delay: 0s; }
        .coin-2 { left: 15px; animation-delay: 0.45s; }
        .coin-3 { left: 26px; animation-delay: 0.9s; }

        @keyframes coinFloat {
          0%   { transform: translateY(16px) scale(0.5); opacity: 0; }
          20%  { opacity: 1; }
          75%  { opacity: 0.8; }
          100% { transform: translateY(-4px) scale(1); opacity: 0; }
        }

        /* ── Card 2: Phone + check ── */
        .phone-body {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 18px;
          height: 28px;
          background: #1e293b;
          border-radius: 4px;
          border: 1.5px solid #334155;
          overflow: hidden;
        }
        .phone-screen {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .check-ring {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #10b981;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: checkPop 2s ease-in-out infinite;
          box-shadow: 0 0 5px rgba(16,185,129,0.7);
        }
        .check-mark {
          width: 5px;
          height: 3px;
          border-left: 1.5px solid #fff;
          border-bottom: 1.5px solid #fff;
          transform: rotate(-45deg) translateY(-1px);
        }
        @keyframes checkPop {
          0%,100% { transform: scale(1); }
          40% { transform: scale(1.3); box-shadow: 0 0 10px rgba(16,185,129,0.9); }
          55% { transform: scale(0.9); }
        }

        .bolt {
          position: absolute;
          font-size: 8px;
          animation: boltPop 2s ease-in-out infinite;
          opacity: 0;
          line-height: 1;
        }
        .bolt-1 { top: 0;   right: 2px; animation-delay: 0.3s; }
        .bolt-2 { top: 6px; left: 2px;  animation-delay: 1.1s; }
        @keyframes boltPop {
          0%   { opacity: 0; transform: scale(0.5) translateY(3px); }
          25%  { opacity: 1; transform: scale(1.1) translateY(0); }
          60%  { opacity: 0.4; }
          100% { opacity: 0; transform: translateY(-6px); }
        }

        /* ── Card 3: Chat bubbles ── */
        .chat-bubble {
          position: absolute;
          border-radius: 8px;
          animation: bubbleIn 2.4s ease-in-out infinite;
        }
        .bubble-bot {
          bottom: 2px;
          left: 2px;
          width: 26px;
          height: 12px;
          background: linear-gradient(135deg, #10b981, #059669);
          border-bottom-left-radius: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 3px;
          box-shadow: 0 1px 5px rgba(16,185,129,0.4);
          animation-delay: 0s;
        }
        .bubble-user {
          top: 2px;
          right: 2px;
          width: 20px;
          height: 10px;
          background: #334155;
          border-top-right-radius: 2px;
          animation-delay: 0.8s;
        }
        @keyframes bubbleIn {
          0%   { transform: scale(0.85) translateY(3px); opacity: 0.4; }
          30%  { transform: scale(1) translateY(0); opacity: 1; }
          70%  { opacity: 1; }
          100% { transform: scale(0.95) translateY(-1px); opacity: 0.5; }
        }
        .bubble-bot .dot {
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: rgba(255,255,255,0.9);
          animation: dotPulse 1.2s ease-in-out infinite;
        }
        .bubble-bot .dot:nth-child(2) { animation-delay: 0.2s; }
        .bubble-bot .dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes dotPulse {
          0%,100% { transform: translateY(0); opacity: 0.5; }
          50%      { transform: translateY(-2px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

