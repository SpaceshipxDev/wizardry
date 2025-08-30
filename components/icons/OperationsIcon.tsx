// components/icons/OperationsIcon.tsx
"use client";

import React from "react";

export default function OperationsIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="24" height="24" rx="2" fill="#1A73E8" />
      <path
        d="M12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8Z"
        stroke="white"
        strokeWidth="2"
      />
      <path d="M12 6V3" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 21V18" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 12H3" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M21 12H18" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M7.8 7.8L5.7 5.7" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M18.3 18.3L16.2 16.2" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M16.2 7.8L18.3 5.7" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M5.7 18.3L7.8 16.2" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

