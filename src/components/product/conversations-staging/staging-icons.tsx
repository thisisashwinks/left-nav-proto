"use client";

/*
 * Staging's own icons, copied from the live page's DOM (Oct 7, 2026).
 *
 * Verbatim paths, not lucide look-alikes: the staging copy is a reference
 * for what shipped, so the icons are part of what it has to reproduce.
 * Every icon takes its size from `size` and its colour from `currentColor`.
 */

import * as React from "react";

type IconProps = { size?: number; className?: string };

export function ChevronRight({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6"/>
    </svg>
  );
}

export function MessagePlus({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12.5 14.5v-6m-3 3h6m-3 8.5a8.5 8.5 0 10-8.057-5.783c.108.32.162.481.172.604a.899.899 0 01-.028.326c-.03.12-.098.245-.232.494l-1.636 3.027c-.233.432-.35.648-.324.815a.5.5 0 00.234.35c.144.087.388.062.876.011l5.121-.529c.155-.016.233-.024.303-.021.07.002.12.009.187.024.069.016.155.05.329.116A8.478 8.478 0 0012.5 20z"/>
    </svg>
  );
}

export function Download({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 15v1.2c0 1.68 0 2.52-.327 3.162a3 3 0 01-1.311 1.311C18.72 21 17.88 21 16.2 21H7.8c-1.68 0-2.52 0-3.162-.327a3 3 0 01-1.311-1.311C3 18.72 3 17.88 3 16.2V15m14-5l-5 5m0 0l-5-5m5 5V3"/>
    </svg>
  );
}

export function Search({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M19 11a8 8 0 11-16 0 8 8 0 0116 0z"/>
    </svg>
  );
}

export function User({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 21c0-1.396 0-2.093-.172-2.661a4 4 0 00-2.667-2.667c-.568-.172-1.265-.172-2.661-.172h-5c-1.396 0-2.093 0-2.661.172a4 4 0 00-2.667 2.667C4 18.907 4 19.604 4 21M16.5 7.5a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"/>
    </svg>
  );
}

export function Users({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M22 21v-2a4.002 4.002 0 00-3-3.874M15.5 3.291a4.001 4.001 0 010 7.418M17 21c0-1.864 0-2.796-.305-3.53a4 4 0 00-2.164-2.165C13.796 15 12.864 15 11 15H8c-1.864 0-2.796 0-3.53.305a4 4 0 00-2.166 2.164C2 18.204 2 19.136 2 21M13.5 7a4 4 0 11-8 0 4 4 0 018 0z"/>
    </svg>
  );
}

export function Dataflow({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.857 7L5.143 17M6 19h12m.857-2L13.143 7M3.6 21h.8c.56 0 .84 0 1.054-.109a1 1 0 00.437-.437C6 20.24 6 19.96 6 19.4v-.8c0-.56 0-.84-.109-1.054a1 1 0 00-.437-.437C5.24 17 4.96 17 4.4 17h-.8c-.56 0-.84 0-1.054.109a1 1 0 00-.437.437C2 17.76 2 18.04 2 18.6v.8c0 .56 0 .84.109 1.054a1 1 0 00.437.437C2.76 21 3.04 21 3.6 21zm16 0h.8c.56 0 .84 0 1.054-.109a1 1 0 00.437-.437C22 20.24 22 19.96 22 19.4v-.8c0-.56 0-.84-.109-1.054a1 1 0 00-.437-.437C21.24 17 20.96 17 20.4 17h-.8c-.56 0-.84 0-1.054.109a1 1 0 00-.437.437C18 17.76 18 18.04 18 18.6v.8c0 .56 0 .84.109 1.054a1 1 0 00.437.437C18.76 21 19.04 21 19.6 21zm-8-14h.8c.56 0 .84 0 1.054-.109a1 1 0 00.437-.437C14 6.24 14 5.96 14 5.4v-.8c0-.56 0-.84-.109-1.054a1 1 0 00-.437-.437C13.24 3 12.96 3 12.4 3h-.8c-.56 0-.84 0-1.054.109a1 1 0 00-.437.437C10 3.76 10 4.04 10 4.6v.8c0 .56 0 .84.109 1.054a1 1 0 00.437.437C10.76 7 11.04 7 11.6 7z"/>
    </svg>
  );
}

export function ViewBox({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 -960 960 960" fill="currentColor" className={className} aria-hidden="true">
      <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-480H200v480Zm280-80q-82 0-146.5-44.5T240-440q29-71 93.5-115.5T480-600q82 0 146.5 44.5T720-440q-29 71-93.5 115.5T480-280Zm0-60q56 0 102-26.5t72-73.5q-26-47-72-73.5T480-540q-56 0-102 26.5T306-440q26 47 72 73.5T480-340Zm0-100Zm0 60q25 0 42.5-17.5T540-440q0-25-17.5-42.5T480-500q-25 0-42.5 17.5T420-440q0 25 17.5 42.5T480-380Z"/>
    </svg>
  );
}

export function FilterLines({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12h12M3 6h18M9 18h6"/>
    </svg>
  );
}

export function SwitchVertical({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 4v16m0 0l-4-4m4 4l4-4M7 20V4m0 0L3 8m4-4l4 4"/>
    </svg>
  );
}

export function Mail({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 7l8.165 5.715c.661.463.992.695 1.351.784a2 2 0 00.968 0c.36-.09.69-.32 1.351-.784L22 7M6.8 20h10.4c1.68 0 2.52 0 3.162-.327a3 3 0 001.311-1.311C22 17.72 22 16.88 22 15.2V8.8c0-1.68 0-2.52-.327-3.162a3 3 0 00-1.311-1.311C19.72 4 18.88 4 17.2 4H6.8c-1.68 0-2.52 0-3.162.327a3 3 0 00-1.311 1.311C2 6.28 2 7.12 2 8.8v6.4c0 1.68 0 2.52.327 3.162a3 3 0 001.311 1.311C4.28 20 5.12 20 6.8 20z"/>
    </svg>
  );
}

export function Inbox({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 12h3.382c.685 0 1.312.387 1.618 1 .306.613.933 1 1.618 1h5.764c.685 0 1.312-.387 1.618-1 .306-.613.933-1 1.618-1H21.5M8.967 4h6.066c1.077 0 1.616 0 2.091.164a3 3 0 011.121.693c.36.352.6.833 1.082 1.796l2.166 4.333c.19.378.284.567.35.765.06.177.102.357.128.541.029.207.029.418.029.841V15.2c0 1.68 0 2.52-.327 3.162a3 3 0 01-1.311 1.311C19.72 20 18.88 20 17.2 20H6.8c-1.68 0-2.52 0-3.162-.327a3 3 0 01-1.311-1.311C2 17.72 2 16.88 2 15.2v-2.067c0-.422 0-.634.029-.84.026-.184.068-.365.128-.541.066-.199.16-.388.35-.766l2.166-4.333c.482-.963.723-1.444 1.082-1.796a3 3 0 011.12-.693C7.352 4 7.89 4 8.968 4z"/>
    </svg>
  );
}

export function ClockRewind({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M22.7 13.5l-2-2-2 2M21 12a9 9 0 11-1.245-4.57M12 7v5l3 2"/>
    </svg>
  );
}

export function Star({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.283 3.453c.23-.467.345-.7.502-.775a.5.5 0 01.43 0c.157.075.272.308.502.775l2.187 4.43c.068.138.102.207.152.26a.502.502 0 00.155.114c.067.03.143.042.295.064l4.891.715c.515.075.773.113.892.238a.5.5 0 01.133.41c-.023.172-.21.353-.582.716L17.3 13.846c-.11.108-.165.162-.2.226a.5.5 0 00-.06.183c-.009.072.004.148.03.3l.835 4.867c.088.514.132.77.05.922a.5.5 0 01-.349.253c-.17.032-.4-.09-.862-.332l-4.373-2.3c-.136-.07-.204-.107-.276-.12a.498.498 0 00-.192 0c-.072.013-.14.05-.276.12l-4.373 2.3c-.461.243-.692.364-.862.332a.5.5 0 01-.348-.253c-.083-.152-.039-.409.05-.922l.834-4.867c.026-.152.039-.228.03-.3a.5.5 0 00-.06-.184c-.035-.063-.09-.117-.2-.225L3.16 10.4c-.373-.363-.56-.544-.582-.716a.5.5 0 01.132-.41c.12-.125.377-.163.892-.238l4.891-.715c.152-.022.228-.034.295-.064a.5.5 0 00.155-.113c.05-.054.084-.123.152-.26l2.187-4.43z"/>
    </svg>
  );
}

export function Check({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="currentColor" className={className} aria-hidden="true">
      <path d="M50.42,16.76L22.34,39.45l-8.1-11.46c-1.12-1.58-3.3-1.96-4.88-0.84c-1.58,1.12-1.95,3.3-0.84,4.88l10.26,14.51  c0.56,0.79,1.42,1.31,2.38,1.45c0.16,0.02,0.32,0.03,0.48,0.03c0.8,0,1.57-0.27,2.2-0.78l30.99-25.03c1.5-1.21,1.74-3.42,0.52-4.92  C54.13,15.78,51.93,15.55,50.42,16.76z"/>
    </svg>
  );
}

export function Eye({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.42 12.713c-.136-.215-.204-.323-.242-.49a1.173 1.173 0 010-.446c.038-.167.106-.274.242-.49C3.546 9.505 6.895 5 12 5s8.455 4.505 9.58 6.287c.137.215.205.323.243.49.029.125.029.322 0 .446-.038.167-.106.274-.242.49C20.455 14.495 17.105 19 12 19c-5.106 0-8.455-4.505-9.58-6.287z"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 15a3 3 0 100-6 3 3 0 000 6z"/>
    </svg>
  );
}

export function WhatsApp({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <path d="M15.0948 5.52066C14.4209 2.93727 12.343 0.85932 9.73148 0.213472C7.12001 -0.432376 4.2839 0.410035 2.48675 2.43182C0.268407 4.90289 -0.0123968 8.6095 1.78475 11.4175C1.64434 12.4284 1.53202 13.4393 1.39162 14.4502C1.33546 14.8153 1.78475 15.068 2.09363 14.9837C3.07644 14.7029 4.08733 14.4502 5.07015 14.1694C7.73778 15.2645 10.8266 14.7591 12.9607 12.7935C14.9544 10.9682 15.7688 8.10405 15.0948 5.52066ZM13.1292 10.9402C11.4444 13.4112 8.1309 14.3379 5.40711 13.1024C5.40711 13.1024 5.40711 13.1024 5.37903 13.1024C5.26671 13.0462 5.12631 13.0181 4.95783 13.0462C4.17158 13.2708 3.38533 13.4674 2.59908 13.692C2.68332 13.0181 2.76756 12.3723 2.8518 11.6983C2.87988 11.4737 2.93604 11.221 2.82372 10.9963C2.73948 10.8559 2.62716 10.7155 2.54291 10.547C2.34635 10.2101 2.17787 9.84503 2.03747 9.47999C1.58818 8.18829 1.5601 6.75619 1.98131 5.4645C2.7114 3.18999 4.78934 1.47709 7.14809 1.19628C9.59108 0.85932 12.0341 2.03869 13.2977 4.08856C14.5894 6.19459 14.5051 8.8903 13.1292 10.9402Z" fill="currentColor"/><path d="M11.8656 8.30024L10.602 7.31743C10.2089 7.00855 9.67536 7.06471 9.33839 7.40167L8.97335 7.76672C8.69254 7.59824 8.43982 7.40167 8.1871 7.17703C7.96246 6.95239 7.76589 6.67158 7.59741 6.39078L7.96246 6.02574C8.29942 5.68877 8.3275 5.15525 8.0467 4.76212L7.06388 3.47042C6.86732 3.18962 6.55844 3.02114 6.22147 3.02114C5.88451 2.99306 5.54755 3.13346 5.3229 3.3581L4.22777 4.45324C3.61 5.071 3.4696 6.02574 3.86272 6.81199C4.39625 7.82288 5.07018 8.72145 5.85643 9.5077C6.64268 10.2939 7.56933 10.9679 8.55214 11.5014C8.86103 11.6699 9.16991 11.726 9.4788 11.726C9.98424 11.726 10.5178 11.5295 10.8828 11.1364L11.9779 10.0412C12.2026 9.81658 12.343 9.47962 12.3149 9.14265C12.3149 8.80569 12.1464 8.49681 11.8656 8.30024ZM11.1917 9.25498L10.0966 10.3501C9.81576 10.6309 9.39455 10.6871 9.05759 10.5186C8.15902 10.0412 7.34469 9.45154 6.6146 8.72145C5.88451 7.99136 5.29482 7.17703 4.81746 6.27846C4.64897 5.94149 4.70514 5.52029 4.98594 5.23949L6.08107 4.14435C6.08107 4.14435 6.08107 4.14435 6.10915 4.14435C6.13723 4.14435 6.13723 4.14435 6.13723 4.17243L7.0358 5.35181L6.67076 5.68877C6.38996 5.96957 6.30571 6.41886 6.50228 6.7839C6.72692 7.23319 7.0358 7.62632 7.37277 7.96328C7.70973 8.30024 8.10286 8.60913 8.55214 8.83377C8.91719 9.03033 9.33839 8.94609 9.6192 8.66529L10.0123 8.27216L11.1636 9.17074C11.1636 9.17074 11.1917 9.17073 11.1917 9.19882C11.1917 9.2269 11.1917 9.25498 11.1917 9.25498Z" fill="currentColor"/>
    </svg>
  );
}

export function MessageChat({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.094 11.229A8.01 8.01 0 016 10c0-4.418 3.605-8 8.053-8 4.447 0 8.052 3.582 8.052 8 0 .998-.184 1.954-.52 2.835-.07.182-.105.274-.12.345a.897.897 0 00-.024.194c-.002.073.008.153.028.314l.403 3.27c.043.355.065.532.006.66a.5.5 0 01-.257.252c-.13.055-.306.03-.66-.022l-3.184-.467c-.167-.024-.25-.037-.326-.036a.898.898 0 00-.2.021c-.074.016-.169.051-.358.122a8.174 8.174 0 01-4.07.42M7.632 22C10.597 22 13 19.538 13 16.5S10.597 11 7.632 11c-2.965 0-5.369 2.462-5.369 5.5 0 .61.097 1.198.277 1.747.075.232.113.348.126.427.013.083.015.13.01.213-.005.08-.025.17-.065.351L2 22l2.995-.409c.163-.022.245-.034.316-.033.076 0 .115.005.19.02.07.013.173.05.381.123a5.246 5.246 0 001.75.299z"/>
    </svg>
  );
}

export function Edit({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21h-8m-10.5.5l5.55-2.134c.354-.137.532-.205.698-.294.147-.08.288-.171.42-.274.149-.115.283-.25.552-.518L21 7a2.828 2.828 0 10-4-4L5.72 14.28c-.269.268-.403.403-.519.552a2.997 2.997 0 00-.273.42c-.089.166-.157.344-.294.699L2.5 21.5zm0 0l2.058-5.351c.147-.383.221-.575.347-.662a.5.5 0 01.38-.08c.15.028.295.173.585.463l2.26 2.26c.29.29.435.434.464.585a.5.5 0 01-.08.38c-.089.126-.28.2-.663.347L2.5 21.5z"/>
    </svg>
  );
}

export function ClockRefresh({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M22.7 11.5l-2 2-2-2m2.245 1.5A9 9 0 1019 17.657M12 7v5l3 2"/>
    </svg>
  );
}

export function Associations({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M8.67153 7.67424C8.17071 7.44143 7.57599 7.65871 7.34318 8.15953C7.11038 8.66035 7.32765 9.25507 7.82847 9.48787L8.67153 7.67424ZM16.1715 9.48787C16.6723 9.25507 16.8896 8.66035 16.6568 8.15953C16.424 7.65871 15.8293 7.44143 15.3285 7.67424L16.1715 9.48787ZM7 7C7 8.10457 6.10457 9 5 9V11C7.20914 11 9 9.20914 9 7H7ZM5 9C3.89543 9 3 8.10457 3 7H1C1 9.20914 2.79086 11 5 11V9ZM3 7C3 5.89543 3.89543 5 5 5V3C2.79086 3 1 4.79086 1 7H3ZM5 5C6.10457 5 7 5.89543 7 7H9C9 4.79086 7.20914 3 5 3V5ZM21 7C21 8.10457 20.1046 9 19 9V11C21.2091 11 23 9.20914 23 7H21ZM19 9C17.8954 9 17 8.10457 17 7H15C15 9.20914 16.7909 11 19 11V9ZM17 7C17 5.89543 17.8954 5 19 5V3C16.7909 3 15 4.79086 15 7H17ZM19 5C20.1046 5 21 5.89543 21 7H23C23 4.79086 21.2091 3 19 3V5ZM14 18C14 19.1046 13.1046 20 12 20V22C14.2091 22 16 20.2091 16 18H14ZM12 20C10.8954 20 10 19.1046 10 18H8C8 20.2091 9.79086 22 12 22V20ZM10 18C10 16.8954 10.8954 16 12 16V14C9.79087 14 8 15.7909 8 18H10ZM12 16C13.1046 16 14 16.8954 14 18H16C16 15.7909 14.2092 14 12 14V16ZM12.4215 9.4174L8.67153 7.67424L7.82847 9.48787L11.5785 11.231L12.4215 9.4174ZM15.3285 7.67424L11.5785 9.4174L12.4215 11.231L16.1715 9.48787L15.3285 7.67424ZM11 10.3242L11 15L13 15L13 10.3242L11 10.3242Z" fill="currentColor"/>
    </svg>
  );
}

export function ChevronDown({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6"/>
    </svg>
  );
}

export function MailOpen({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.744 2.633l7.528 4.894c.266.173.399.259.495.374a1 1 0 01.189.348c.044.143.044.302.044.62v7.33c0 1.681 0 2.521-.327 3.163a3 3 0 01-1.311 1.31C19.72 21 18.88 21 17.2 21H6.8c-1.68 0-2.52 0-3.162-.327a3 3 0 01-1.311-1.311C2 18.72 2 17.88 2 16.2V8.868c0-.317 0-.476.044-.62a1 1 0 01.189-.347c.096-.115.229-.201.495-.374l7.528-4.894m3.488 0c-.631-.41-.947-.615-1.287-.695a2 2 0 00-.914 0c-.34.08-.656.285-1.287.695m3.488 0l7.224 4.696c.344.224.516.335.576.477a.5.5 0 010 .388c-.06.141-.232.253-.576.477l-7.224 4.695c-.631.41-.947.616-1.287.696-.3.07-.613.07-.914 0-.34-.08-.656-.285-1.287-.696L3.032 8.671c-.344-.224-.516-.336-.576-.477a.5.5 0 010-.388c.06-.142.232-.253.576-.477l7.224-4.696"/>
    </svg>
  );
}

export function Trash({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 3h6M3 6h18m-2 0l-.701 10.52c-.105 1.578-.158 2.367-.499 2.965a3 3 0 01-1.298 1.215c-.62.3-1.41.3-2.993.3h-3.018c-1.582 0-2.373 0-2.993-.3A3 3 0 016.2 19.485c-.34-.598-.394-1.387-.499-2.966L5 6m5 4.5v5m4-5v5"/>
    </svg>
  );
}

export function Calendar({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 10H3m13-8v4M8 2v4m-.2 16h8.4c1.68 0 2.52 0 3.162-.327a3 3 0 001.311-1.311C21 19.72 21 18.88 21 17.2V8.8c0-1.68 0-2.52-.327-3.162a3 3 0 00-1.311-1.311C18.72 4 17.88 4 16.2 4H7.8c-1.68 0-2.52 0-3.162.327a3 3 0 00-1.311 1.311C3 6.28 3 7.12 3 8.8v8.4c0 1.68 0 2.52.327 3.162a3 3 0 001.311 1.311C5.28 22 6.12 22 7.8 22z"/>
    </svg>
  );
}

export function Expand({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21L21 3M3 21h6m-6 0v-6M21 3h-6m6 0v6"/>
    </svg>
  );
}

export function Reply({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 14L4 9m0 0l5-5M4 9h6.4c3.36 0 5.04 0 6.324.654a6 6 0 012.622 2.622C20 13.56 20 15.24 20 18.6V20"/>
    </svg>
  );
}

export function DotsVertical({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 13a1 1 0 100-2 1 1 0 000 2zM12 6a1 1 0 100-2 1 1 0 000 2zM12 20a1 1 0 100-2 1 1 0 000 2z"/>
    </svg>
  );
}

export function MailUnread({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.5 18l-6.643-6m-5.714 0L2.5 18M2 7l8.165 5.715c.661.463.992.695 1.351.784a2 2 0 00.968 0c.36-.09.69-.32 1.351-.784L22 7M6.8 20h10.4c1.68 0 2.52 0 3.162-.327a3 3 0 001.311-1.311C22 17.72 22 16.88 22 15.2V8.8c0-1.68 0-2.52-.327-3.162a3 3 0 00-1.311-1.311C19.72 4 18.88 4 17.2 4H6.8c-1.68 0-2.52 0-3.162.327a3 3 0 00-1.311 1.311C2 6.28 2 7.12 2 8.8v6.4c0 1.68 0 2.52.327 3.162a3 3 0 001.311 1.311C4.28 20 5.12 20 6.8 20z"/>
    </svg>
  );
}

export function Send({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 13.5L21 3M10.627 13.828l2.628 6.758c.232.596.347.893.514.98a.5.5 0 00.462 0c.167-.086.283-.384.515-.979l6.59-16.888c.21-.537.315-.806.258-.977a.5.5 0 00-.316-.316c-.172-.057-.44.048-.978.257L3.413 9.253c-.595.233-.893.349-.98.516a.5.5 0 000 .461c.087.167.385.283.98.514l6.758 2.629c.121.046.182.07.233.106a.5.5 0 01.116.117c.037.05.06.111.107.232z"/>
    </svg>
  );
}

export function Close({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 7L7 17M7 7l10 10"/>
    </svg>
  );
}

export function ExternalLink({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 9V3m0 0h-6m6 0l-9 9m-2-9H7.8c-1.68 0-2.52 0-3.162.327a3 3 0 00-1.311 1.311C3 5.28 3 6.12 3 7.8v8.4c0 1.68 0 2.52.327 3.162a3 3 0 001.311 1.311C5.28 21 6.12 21 7.8 21h8.4c1.68 0 2.52 0 3.162-.327a3 3 0 001.311-1.311C21 18.72 21 17.88 21 16.2V14"/>
    </svg>
  );
}

export function Plus({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m-7-7h14"/>
    </svg>
  );
}

export function SearchSm({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-3.5-3.5m2.5-6a8.5 8.5 0 11-17 0 8.5 8.5 0 0117 0z"/>
    </svg>
  );
}

export function ChevronDownSolid({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <path d="M3.14645 5.64645C3.34171 5.45118 3.65829 5.45118 3.85355 5.64645L8 9.79289L12.1464 5.64645C12.3417 5.45118 12.6583 5.45118 12.8536 5.64645C13.0488 5.84171 13.0488 6.15829 12.8536 6.35355L8.35355 10.8536C8.15829 11.0488 7.84171 11.0488 7.64645 10.8536L3.14645 6.35355C2.95118 6.15829 2.95118 5.84171 3.14645 5.64645Z" fill="currentColor"/>
    </svg>
  );
}

export function UserCircle({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.316 19.438A4.001 4.001 0 019 17h6a4.001 4.001 0 013.684 2.438M16 9.5a4 4 0 11-8 0 4 4 0 018 0zm6 2.5c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10z"/>
    </svg>
  );
}

export function ClipboardCheck({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 4c.93 0 1.395 0 1.776.102a3 3 0 012.122 2.122C20 6.605 20 7.07 20 8v9.2c0 1.68 0 2.52-.327 3.162a3 3 0 01-1.311 1.311C17.72 22 16.88 22 15.2 22H8.8c-1.68 0-2.52 0-3.162-.327a3 3 0 01-1.311-1.311C4 19.72 4 18.88 4 17.2V8c0-.93 0-1.395.102-1.776a3 3 0 012.122-2.122C6.605 4 7.07 4 8 4m1 11l2 2 4.5-4.5M9.6 6h4.8c.56 0 .84 0 1.054-.109a1 1 0 00.437-.437C16 5.24 16 4.96 16 4.4v-.8c0-.56 0-.84-.109-1.054a1 1 0 00-.437-.437C15.24 2 14.96 2 14.4 2H9.6c-.56 0-.84 0-1.054.109a1 1 0 00-.437.437C8 2.76 8 3.04 8 3.6v.8c0 .56 0 .84.109 1.054a1 1 0 00.437.437C8.76 6 9.04 6 9.6 6z"/>
    </svg>
  );
}

export function File({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 2.27V6.4c0 .56 0 .84.109 1.054a1 1 0 00.437.437c.214.11.494.11 1.054.11h4.13M14 17H8m8-4H8m12-3.012V17.2c0 1.68 0 2.52-.327 3.162a3 3 0 01-1.311 1.311C17.72 22 16.88 22 15.2 22H8.8c-1.68 0-2.52 0-3.162-.327a3 3 0 01-1.311-1.311C4 19.72 4 18.88 4 17.2V6.8c0-1.68 0-2.52.327-3.162a3 3 0 011.311-1.311C6.28 2 7.12 2 8.8 2h3.212c.733 0 1.1 0 1.446.083.306.073.598.195.867.36.303.185.562.444 1.08.963l3.19 3.188c.518.519.777.778.963 1.081a3 3 0 01.36.867c.082.346.082.712.082 1.446z"/>
    </svg>
  );
}

export function CurrencyCircle({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 14.667A2.333 2.333 0 0010.833 17H13a2.5 2.5 0 000-5h-2a2.5 2.5 0 010-5h2.167A2.333 2.333 0 0115.5 9.333M12 5.5V7m0 10v1.5M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10z"/>
    </svg>
  );
}

export function Keyboard({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 10h.01M8 14h.01M10 10h.01M12 14h.01M14 10h.01M16 14h.01M18 10h.01M5.2 18h13.6c1.12 0 1.68 0 2.108-.218a2 2 0 00.874-.874C22 16.48 22 15.92 22 14.8V9.2c0-1.12 0-1.68-.218-2.108a2 2 0 00-.874-.874C20.48 6 19.92 6 18.8 6H5.2c-1.12 0-1.68 0-2.108.218a2 2 0 00-.874.874C2 7.52 2 8.08 2 9.2v5.6c0 1.12 0 1.68.218 2.108a2 2 0 00.874.874C3.52 18 4.08 18 5.2 18z"/>
    </svg>
  );
}
