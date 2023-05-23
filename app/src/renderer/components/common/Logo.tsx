import { Link as RouterLink } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { Box, BoxProps } from '@mui/material';

interface Props extends BoxProps {
  size?: number;
  disabledLink?: boolean;
}

export default function Logo({ size = 48, disabledLink = false, sx }: Props) {
  const theme = useTheme();

  const PRIMARY_MAIN = theme.palette.primary.main;

  const logo = (
    <Box sx={{ width: size, height: size, ...sx }}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        width="100%"
        height="100%"
        viewBox="0 0 154.07 154.07"
      >
        <defs>
          <linearGradient
            id="linear-gradient"
            x1="91.35"
            y1="110.65"
            x2="67.62"
            y2="7.1"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#fff" />
            <stop offset="1" />
          </linearGradient>
          <linearGradient
            id="linear-gradient-2"
            x1="90.09"
            y1="102.71"
            x2="68.39"
            y2="8.02"
            xlinkHref="#linear-gradient"
          />
          <filter
            id="luminosity-noclip"
            x="0.1"
            y="0"
            width="153.96"
            height="89.65"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodColor="#fff" result="bg" />
            <feBlend in="SourceGraphic" in2="bg" />
          </filter>
          <mask id="mask" x="0.1" y="0" width="153.96" height="89.65" maskUnits="userSpaceOnUse">
            <g className="cls-6" style={{ filter: 'url(#luminosity-noclip)' }}>
              <path
                style={{ fillRule: 'evenodd', fill: 'url(#linear-gradient)' }}
                d="M.1,89.65V84.39l0-76.27A7.94,7.94,0,0,1,7.87,0H146.32a7.94,7.94,0,0,1,7.74,8.12V52.87l-2.87-.19c-2.32-.15-4.65-.27-6.91-.37l-2.59-.12V25.61H12.51l0,54.22v1.61l-1.32.83c-2.36,1.45-4.67,3-6.88,4.49L.1,89.65Z"
              />
              <path
                style={{ fillRule: 'evenodd', fill: 'url(#linear-gradient-2)' }}
                d="M9.79,79.82l0-54.21V22.78H144.39V49.47c2.29.11,4.62.23,7,.38l0-41.73a5.17,5.17,0,0,0-5-5.28H7.87a5.17,5.17,0,0,0-5,5.28l0,76.27C5,82.87,7.34,81.34,9.79,79.82Z"
              />
            </g>
          </mask>
        </defs>
        <g id="Layer_2">
          <g id="Layer_1-2">
            <path
              style={{ fillRule: 'evenodd', fill: '#06ab54' }}
              d="M7.87,0H146.32a8,8,0,0,1,7.75,8.12L154,145.94a8,8,0,0,1-7.72,8.13H40.73c8.44-2,20.21-6.24,28.91-13.51h72l0-114.95H12.51l0,102.48a28.63,28.63,0,0,1-4.78-9.83L.1,112,.13,8.12A8,8,0,0,1,7.87,0Z"
            />
            <path
              style={{ fillRule: 'evenodd', fill: '#06ab54' }}
              d="M12.48,93.93c0,17.86.41,37.81,22.59,38.72,24.54,1,58.79-30.2,57.34-71.05C89.25,85,72.17,110.08,57.26,119,49.83,114.28,44,103,45.72,91,50,60.38,92.64,57.28,95.34,32.09c14,47.24-8.85,110.57-57,114.65-23.64,2-39.76-14.42-38.25-42.89Z"
            />
            <path
              style={{ fillRule: 'evenodd', fill: '#06ab54' }}
              d="M63.52,106.49l2.58,5.57S52,126.63,34.38,126.2c0,0,13.8-2.52,29.14-19.71Z"
            />
            <path
              style={{ fillRule: 'evenodd', fill: '#06ab54' }}
              d="M132.2,94.66c-7.28,3.07-7.72,25.49-18.48,36-8.49,8.34-22.82,6.36-30.3,1.49,11.72-.82,27.52-8.33,29.12-22.38-2.61,5.63-10.76,16.15-24.34,16.48,1.34-17.18,17.17-34.25,44-31.57Z"
            />
            <g style={{ mask: 'url(#mask)' }}>
              <path
                style={{ fillRule: 'evenodd', fill: '#ffffff' }}
                d="M9.79,79.82l0-54.21V22.78H144.39V49.47c2.29.11,4.62.23,7,.38l0-41.73a5.17,5.17,0,0,0-5-5.28H7.87a5.17,5.17,0,0,0-5,5.28l0,76.27C5,82.87,7.34,81.34,9.79,79.82Z"
              />
            </g>
            <path
              style={{ fillRule: 'evenodd', fill: '#ffffff' }}
              d="M17.81,8.94a4.6,4.6,0,1,1-4.6,4.6,4.61,4.61,0,0,1,4.6-4.6Z"
            />
            <path
              style={{ fillRule: 'evenodd', fill: '#ffffff' }}
              d="M32,8.94a4.6,4.6,0,1,1-4.59,4.6A4.6,4.6,0,0,1,32,8.94Z"
            />
            <path
              style={{ fillRule: 'evenodd', fill: '#ffffff' }}
              d="M46.28,8.94a4.6,4.6,0,1,1-4.6,4.6,4.59,4.59,0,0,1,4.6-4.6Z"
            />
          </g>
        </g>
      </svg>
    </Box>
  );

  if (disabledLink) {
    return <>{logo}</>;
  }

  return <RouterLink to="/">{logo}</RouterLink>;
}
