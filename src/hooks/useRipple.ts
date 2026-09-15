import { MouseEvent } from "react";

export function useRipple(lightRipple = false) {
  const addRipple = (e: MouseEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const size = Math.max(el.offsetWidth, el.offsetHeight);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const ripple = document.createElement("span");
    ripple.className = "ripple-wave";
    ripple.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: ${lightRipple ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.1)"};
    `;

    el.classList.add("ripple-wrapper");
    el.appendChild(ripple);
    setTimeout(() => ripple.remove(), 700);
  };

  return addRipple;
}
