export default function MockMap({
  town,
  progress = 0,
}: {
  town: string;
  progress?: number;
}) {
  return (
    <div className="demo-map">
      <svg
        viewBox="0 0 600 320"
        role="img"
        aria-label={`Illustrated map of ${town}, showing pickup and simulated driver location`}
      >
        <rect width="600" height="320" fill="#edeedf" />
        <path
          d="M0 240 Q130 120 190 320"
          fill="none"
          stroke="#b4d9d2"
          strokeWidth="70"
        />
        {[65, 150, 245].map((y) => (
          <path key={y} d={`M0 ${y} H600`} stroke="#fffdf7" strokeWidth="18" />
        ))}
        {[100, 260, 420, 540].map((x) => (
          <path key={x} d={`M${x} 0 V320`} stroke="#fffdf7" strokeWidth="18" />
        ))}
        <rect x="285" y="175" width="100" height="45" rx="12" fill="#c3d4a5" />
        <path
          d="M100 65 H260 V245 H420"
          fill="none"
          stroke="#ef7d32"
          strokeWidth="5"
          strokeDasharray="8 6"
        />
        <circle cx="420" cy="245" r="12" fill="#172b25" />
        <text x="438" y="270" fontSize="14">
          Pickup
        </text>
        <g
          transform={`translate(${100 + Math.min(progress * 500, 160) + Math.max(progress * 500 - 340, 0)},${65 + Math.max(0, Math.min(progress * 500 - 160, 180))})`}
          style={{ transition: "transform 250ms linear" }}
        >
          <circle r="19" fill="#ef7d32" />
          <text textAnchor="middle" y="5" fontSize="12" fill="white">
            AUTO
          </text>
        </g>
        <text x="300" y="35" fontSize="18" fill="#243b30">
          {town}
        </text>
        <text x="305" y="202" fontSize="12">
          Town park
        </text>
      </svg>
      <span>Illustrated demo map • simulated locations</span>
    </div>
  );
}
