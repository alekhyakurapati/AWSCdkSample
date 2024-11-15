interface LogoProps {
    margin?: string | number;
    width?: string | number;
    height?: string | number;
}

export const IntegrationHubLogo = ({ width = '100%', height = '100%', margin = 0 }: LogoProps) => (
    <div style={{ width: width, height: height, margin: margin }}>
        <svg width="96" height="32" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M15.8866 0L0 15.8866L15.8866 31.7731L23.75 23.9097L15.7269 15.8866L23.75 7.86345L15.8866 0Z"
                fill="url(#paint0_linear_2703_15652)"
            />
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M23.75 23.9097L31.7731 15.8866L23.75 7.86345L31.6135 0L47.5 15.8866L31.6135 31.7731L23.75 23.9097Z"
                fill="url(#paint1_linear_2703_15652)"
            />
            <path
                d="M23.7497 7.87109L15.7266 15.8942L23.7497 23.9173L31.7728 15.8942L23.7497 7.87109Z"
                fill="#003369"
            />
            <defs>
                <linearGradient
                    id="paint0_linear_2703_15652"
                    x1="8.31251"
                    y1="8.31251"
                    x2="21.375"
                    y2="21.375"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#E1F4FD" />
                    <stop offset="1" stopColor="#00AEEF" />
                </linearGradient>
                <linearGradient
                    id="paint1_linear_2703_15652"
                    x1="24.9375"
                    y1="8.31251"
                    x2="38"
                    y2="21.375"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#90D1F3" />
                    <stop offset="1" stopColor="#0071BC" />
                </linearGradient>
            </defs>
        </svg>
    </div>
);
