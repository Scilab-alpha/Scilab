import Svg, { Path } from "react-native-svg";

import type { AppColors } from "@/theme";

type BrandMarkProps = {
  colors: AppColors;
  size?: number;
};

export function BrandMark({ colors, size = 34 }: BrandMarkProps) {
  return (
    <Svg
      accessibilityLabel="ScholarTrend"
      height={size}
      role="img"
      viewBox="0 0 48 48"
      width={size}
    >
      <Path d="M7 17 24 7l17 10H7Z" fill={colors.primary} />
      <Path
        d="M11 20h26M13 36h22M9 40h30M15 20v16m9-16v16m9-16v16"
        fill="none"
        stroke={colors.primary}
        strokeLinecap="round"
        strokeWidth="2.4"
      />
      <Path d="M20 13h8" stroke={colors.onPrimary} strokeWidth="2" />
    </Svg>
  );
}
