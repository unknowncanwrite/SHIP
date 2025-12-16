import { PieChart, Pie, Cell, ResponsiveContainer, Label } from 'recharts';

interface DonutProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}

export default function DonutProgress({ percentage, size = 160, strokeWidth = 15 }: DonutProgressProps) {
  const data = [
    { name: 'Completed', value: percentage },
    { name: 'Remaining', value: 100 - percentage },
  ];

  const COLORS = ['hsl(var(--accent))', 'hsl(var(--muted))'];

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={size / 2 - strokeWidth}
            outerRadius={size / 2}
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-primary">{percentage}%</span>
        <span className="text-xs text-muted-foreground uppercase font-medium mt-1">Complete</span>
      </div>
    </div>
  );
}
