import Svg, { Circle, Path } from 'react-native-svg';

/** Line icons from the design (24px grid, 1.6 stroke). */
export type IconProps = { size?: number; color: string };

function Base({ size = 22, color, children, round }: IconProps & { children: React.ReactNode; round?: boolean }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.6}
      strokeLinejoin={round ? undefined : 'round'}
      strokeLinecap={round ? 'round' : undefined}>
      {children}
    </Svg>
  );
}

export const HomeIcon = (p: IconProps) => (
  <Base {...p}>
    <Path d="M4 5h16v14H4z" />
    <Path d="M4 9h16M9 9v10" />
  </Base>
);

export const FeedIcon = (p: IconProps) => (
  <Base {...p}>
    <Path d="M6 3h12v18H6z" />
    <Path d="M9 8h6M9 12h6M9 16h3" />
  </Base>
);

export const LibraryIcon = (p: IconProps) => (
  <Base {...p}>
    <Path d="M3.5 7h6l2 2h9v10h-17z" />
  </Base>
);

export const YouIcon = (p: IconProps) => (
  <Base {...p} round>
    <Circle cx={12} cy={8.5} r={3.5} />
    <Path d="M5 20c1.2-3.6 4-5.5 7-5.5s5.8 1.9 7 5.5" />
  </Base>
);

export const SearchIcon = (p: IconProps) => (
  <Base {...p} round>
    <Circle cx={11} cy={11} r={6.5} />
    <Path d="M16 16l4.5 4.5" />
  </Base>
);

export const BookmarkIcon = ({ filled, ...p }: IconProps & { filled?: boolean }) => (
  <Base {...p}>
    <Path d="M6.5 3.5h11v17L12 16.5l-5.5 4z" fill={filled ? p.color : 'none'} />
  </Base>
);

export const MoreIcon = ({ vertical, ...p }: IconProps & { vertical?: boolean }) => (
  <Base {...p} round>
    {vertical ? (
      <>
        <Circle cx={12} cy={5.5} r={1.1} fill={p.color} />
        <Circle cx={12} cy={12} r={1.1} fill={p.color} />
        <Circle cx={12} cy={18.5} r={1.1} fill={p.color} />
      </>
    ) : (
      <>
        <Circle cx={5.5} cy={12} r={1.1} fill={p.color} />
        <Circle cx={12} cy={12} r={1.1} fill={p.color} />
        <Circle cx={18.5} cy={12} r={1.1} fill={p.color} />
      </>
    )}
  </Base>
);

export const BackIcon = (p: IconProps) => (
  <Base {...p} round>
    <Path d="M15 5l-7 7 7 7" />
  </Base>
);

export const CloseIcon = (p: IconProps) => (
  <Base {...p} round>
    <Path d="M6 6l12 12M18 6L6 18" />
  </Base>
);

export const CheckIcon = (p: IconProps) => (
  <Base {...p} round>
    <Path d="M5 12.5l4.5 4.5L19 7.5" />
  </Base>
);

export const ChevronIcon = (p: IconProps) => (
  <Base {...p} round>
    <Path d="M9 5l7 7-7 7" />
  </Base>
);

export const ArrowIcon = (p: IconProps) => (
  <Base {...p} round>
    <Path d="M5 12h14M13 6l6 6-6 6" />
  </Base>
);

export const FolderIcon = LibraryIcon;

/** Explore tab: a compass, in the tab bar's line style. */
export const ExploreIcon = (p: IconProps) => (
  <Base {...p} round>
    <Circle cx={12} cy={12} r={8.5} />
    <Path d="M15.5 8.5l-2 5-5 2 2-5z" strokeLinejoin="round" />
  </Base>
);

// ⋯ menu icons (MoreSheet board, 20px).
export const DownloadIcon = (p: IconProps) => (
  <Base {...p} round>
    <Path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19.5h14" strokeLinejoin="round" />
  </Base>
);

export const DownloadedIcon = (p: IconProps) => (
  <Base {...p} round>
    <Circle cx={12} cy={12} r={8.5} />
    <Path d="M8.2 12.4l2.7 2.7 5-5.4" strokeLinejoin="round" />
  </Base>
);

export const ShareIcon = (p: IconProps) => (
  <Base {...p} round>
    <Path d="M12 15V4M7.5 8.5L12 4l4.5 4.5M5 13v7h14v-7" strokeLinejoin="round" />
  </Base>
);

export const InfoIcon = (p: IconProps) => (
  <Base {...p} round>
    <Circle cx={12} cy={12} r={8.5} />
    <Path d="M12 11v5.5" />
    <Circle cx={12} cy={7.8} r={0.9} fill={p.color} stroke="none" />
  </Base>
);

export const MinusIcon = (p: IconProps) => (
  <Base {...p} round>
    <Path d="M5 12h14" />
  </Base>
);

export const PlusIcon = (p: IconProps) => (
  <Base {...p} round>
    <Path d="M12 5v14M5 12h14" />
  </Base>
);

/** "Remove this source": the outlet leaves the reader's list. */
export const RemoveSourceIcon = (p: IconProps) => (
  <Base {...p} round>
    <Circle cx={12} cy={12} r={8.5} />
    <Path d="M8 12h8" />
  </Base>
);

export const FlagIcon = (p: IconProps) => (
  <Base {...p} round>
    <Path d="M6 21V4h11l-2 4 2 4H6" strokeLinejoin="round" />
  </Base>
);

export const SunIcon = (p: IconProps) => (
  <Base {...p} round>
    <Circle cx="12" cy="12" r="4" />
    <Path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
  </Base>
);

export const MoonIcon = (p: IconProps) => (
  <Base {...p}>
    <Path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
  </Base>
);
