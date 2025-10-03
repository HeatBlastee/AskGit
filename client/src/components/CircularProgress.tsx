export const CircularProgress = ({ progress }: { progress: number }) => {
    const radius = 40;
    const stroke = 6;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <svg height={radius * 2} width={radius * 2}>
            <circle
                stroke="#e5e7eb"
                fill="transparent"
                strokeWidth={stroke}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
            />
            <circle
                stroke="#3b82f6"
                fill="transparent"
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={circumference + " " + circumference}
                style={{ strokeDashoffset, transition: "stroke-dashoffset 0.2s" }}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
            />
            <text
                x="50%"
                y="50%"
                dominantBaseline="middle"
                textAnchor="middle"
                className="text-sm font-semibold fill-current text-gray-700"
            >
                {progress}%
            </text>
        </svg>
    );
};
