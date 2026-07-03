// Old-school-meets-modern floral ornaments — curling vine-and-blossom
// sprays in all four corners, plus a couple of smaller accent sprigs along
// the top/bottom edges, all sitting behind the app content at low opacity
// so the layout still reads clean and modern. Purely decorative, so it's
// aria-hidden and never intercepts clicks (pointer-events: none is set on
// the wrapper in index.css).

function FloralSpray() {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Curling stem */}
      <path
        d="M4 4C40 8 58 26 54 56C51 80 66 92 92 88C118 84 128 100 118 118"
        stroke="#8ba57f"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M20 10C34 22 34 40 20 46"
        stroke="#8ba57f"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M100 92C112 86 126 90 130 104"
        stroke="#8ba57f"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Leaves */}
      <ellipse cx="14" cy="26" rx="10" ry="5" transform="rotate(-35 14 26)" fill="#9db98f" opacity="0.85" />
      <ellipse cx="46" cy="14" rx="9" ry="4.5" transform="rotate(30 46 14)" fill="#9db98f" opacity="0.85" />
      <ellipse cx="70" cy="70" rx="9" ry="4.5" transform="rotate(-20 70 70)" fill="#a9c19c" opacity="0.8" />
      <ellipse cx="100" cy="104" rx="8" ry="4" transform="rotate(40 100 104)" fill="#a9c19c" opacity="0.8" />
      <ellipse cx="122" cy="96" rx="7" ry="3.6" transform="rotate(-25 122 96)" fill="#a9c19c" opacity="0.75" />

      {/* Blossom 1 (rose) at the tip of the stem */}
      <g transform="translate(8,8)">
        <circle cx="0" cy="-9" r="7" fill="#d99bab" />
        <circle cx="8" cy="-3" r="7" fill="#d99bab" />
        <circle cx="5" cy="7" r="7" fill="#d99bab" />
        <circle cx="-5" cy="7" r="7" fill="#d99bab" />
        <circle cx="-8" cy="-3" r="7" fill="#d99bab" />
        <circle cx="0" cy="0" r="5" fill="#e8b8ac" />
      </g>

      {/* Blossom 2 (smaller, gold) mid-vine */}
      <g transform="translate(56,55)">
        <circle cx="0" cy="-6" r="5" fill="#d9b877" />
        <circle cx="5.5" cy="-2" r="5" fill="#d9b877" />
        <circle cx="3.5" cy="5" r="5" fill="#d9b877" />
        <circle cx="-3.5" cy="5" r="5" fill="#d9b877" />
        <circle cx="-5.5" cy="-2" r="5" fill="#d9b877" />
        <circle cx="0" cy="0" r="3.4" fill="#eccf9a" />
      </g>

      {/* Blossom 3 (small bud, rose) toward the far end */}
      <g transform="translate(94,86)">
        <circle cx="0" cy="-5" r="4.2" fill="#dba4b3" />
        <circle cx="4.6" cy="-1.5" r="4.2" fill="#dba4b3" />
        <circle cx="3" cy="4.4" r="4.2" fill="#dba4b3" />
        <circle cx="-3" cy="4.4" r="4.2" fill="#dba4b3" />
        <circle cx="-4.6" cy="-1.5" r="4.2" fill="#dba4b3" />
        <circle cx="0" cy="0" r="2.8" fill="#ecc7cf" />
      </g>

      {/* Blossom 4 (open daisy, sage-cream) — new, gives the spray a fuller,
          more "in-bloom" wallpaper feel */}
      <g transform="translate(128,102) rotate(12)">
        {[0, 51.4, 102.8, 154.2, 205.6, 257, 308.4].map((angle) => (
          <ellipse
            key={angle}
            cx="0"
            cy="-6.5"
            rx="2.6"
            ry="6.5"
            fill="#f0dcc4"
            opacity="0.9"
            transform={`rotate(${angle})`}
          />
        ))}
        <circle cx="0" cy="0" r="3.2" fill="#c9a15a" />
      </g>

      {/* Tiny dots / sprigs for texture */}
      <circle cx="34" cy="34" r="2" fill="#c9a15a" opacity="0.7" />
      <circle cx="80" cy="46" r="1.6" fill="#c47a8c" opacity="0.6" />
      <circle cx="112" cy="104" r="1.8" fill="#c9a15a" opacity="0.6" />
      <circle cx="140" cy="80" r="1.6" fill="#7a9676" opacity="0.55" />
    </svg>
  );
}

// A single classic 6-petal daisy on a short stem with two leaves — a
// simpler, more graphic "folk embroidery" motif used for the smaller
// accent sprigs along the top/bottom edges.
function FloralSprig() {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M50 96C50 70 50 52 50 40"
        stroke="#8ba57f"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <ellipse cx="38" cy="66" rx="9" ry="4.4" transform="rotate(-25 38 66)" fill="#9db98f" opacity="0.85" />
      <ellipse cx="63" cy="78" rx="9" ry="4.4" transform="rotate(20 63 78)" fill="#a9c19c" opacity="0.85" />

      <g transform="translate(50,26)">
        {[0, 60, 120, 180, 240, 300].map((angle) => (
          <ellipse
            key={angle}
            cx="0"
            cy="-11"
            rx="4.4"
            ry="11"
            fill="#d99bab"
            opacity="0.92"
            transform={`rotate(${angle})`}
          />
        ))}
        <circle cx="0" cy="0" r="6" fill="#eccf9a" />
      </g>
    </svg>
  );
}

export function FloralCorners() {
  return (
    <div className="floral-corners" aria-hidden="true">
      <div className="floral-corner tl">
        <FloralSpray />
      </div>
      <div className="floral-corner tr">
        <FloralSpray />
      </div>
      <div className="floral-corner bl">
        <FloralSpray />
      </div>
      <div className="floral-corner br">
        <FloralSpray />
      </div>

      {/* Small accent sprigs along the top and bottom edges, between the
          corner sprays, so the floral framing feels fuller without
          crowding the center of the screen where the content sits. */}
      <div className="floral-edge top">
        <FloralSprig />
      </div>
      <div className="floral-edge bottom">
        <FloralSprig />
      </div>
    </div>
  );
}
