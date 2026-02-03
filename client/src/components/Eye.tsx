
import { useEffect, useRef, useState } from "react";

interface EyeProps {
  className?: string;
  isRightEye?: boolean;
}

export function Eye({ className = "", isRightEye = false }: EyeProps) {
  const eyeRef = useRef<HTMLDivElement>(null);
  const [pupilPosition, setPupilPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!eyeRef.current) return;

      // Get client coordinates from either mouse or touch event
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      // Get eye position and dimensions
      const eye = eyeRef.current;
      const eyeRect = eye.getBoundingClientRect();
      const eyeCenterX = eyeRect.left + eyeRect.width / 2;
      const eyeCenterY = eyeRect.top + eyeRect.height / 2;

      // Calculate direction vector from eye to mouse/touch
      const dx = clientX - eyeCenterX;
      const dy = clientY - eyeCenterY;

      // Calculate the distance from eye center to mouse
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Calculate max pupil movement for ellipse (different for X and Y)
      const eyeRadiusX = eyeRect.width / 2;  // 102px
      const eyeRadiusY = eyeRect.height / 2; // 122.5px
      const pupilRadius = 38; // Half of the pupil size (76px/2)
      const buffer = 5;
      const maxMovementX = eyeRadiusX - pupilRadius - buffer;
      const maxMovementY = eyeRadiusY - pupilRadius - buffer;

      // If distance is very small, return to default position
      if (distance < 1) {
        setPupilPosition({ x: 0, y: 0 });
        return;
      }

      // Normalize the direction vector
      let nx = dx / distance;
      let ny = dy / distance;

      // Calculate desired movement
      let moveX = Math.min(distance, maxMovementX) * nx;
      let moveY = Math.min(distance, maxMovementY) * ny;

      // Constrain movement within ellipse boundary
      // Use ellipse equation: (x/a)^2 + (y/b)^2 <= 1
      const normalizedX = moveX / maxMovementX;
      const normalizedY = moveY / maxMovementY;
      const ellipseValue = normalizedX * normalizedX + normalizedY * normalizedY;

      if (ellipseValue > 1) {
        const scale = 1 / Math.sqrt(ellipseValue);
        moveX *= scale;
        moveY *= scale;
      }

      setPupilPosition({ x: moveX, y: moveY });
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("touchmove", handleMove, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchmove", handleMove);
    };
  }, []);

  return (
    <div
      ref={eyeRef}
      className={`relative shrink-0 overflow-hidden ${className}`}
      style={{
        width: "204px",
        height: "245px",
        backgroundColor: "#ffffff",
        borderRadius: "50%"
      }}
      data-name="eye"
    >
      {/* Pupil */}
      <div
        className="absolute z-10"
        style={{
          top: "50%",
          left: "50%",
          width: "76px",
          height: "76px",
          borderRadius: "50%",
          backgroundColor: "#d4258e",
          transform: `translate(-50%, -50%) translate(${pupilPosition.x}px, ${pupilPosition.y}px)`,
        }}
        id="Pupil"
        data-pupil-position={`${pupilPosition.x.toFixed(2)}, ${pupilPosition.y.toFixed(2)}`}
      />
    </div>
  );
}
