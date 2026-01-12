import { FunnelData } from "@/types/marketing";
import { formatNumber, formatPercent } from "@/utils/calculations";

interface FunnelChartProps {
  data: FunnelData[];
}

export const FunnelChart = ({ data }: FunnelChartProps) => {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="glass-effect rounded-xl p-6 animate-slide-up">
      <h3 className="text-lg font-semibold mb-6 text-foreground">Funil de Conversão</h3>
      <div className="space-y-4">
        {data.map((item, index) => {
          const widthPercent = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
          
          return (
            <div key={item.label} className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-semibold text-foreground">
                    {formatNumber(item.value)}
                  </span>
                  <span 
                    className="font-mono text-xs px-2 py-0.5 rounded-full"
                    style={{ 
                      backgroundColor: `${item.color}20`,
                      color: item.color 
                    }}
                  >
                    {formatPercent(item.percentage)}
                  </span>
                </div>
              </div>
              <div className="h-3 bg-accent rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${widthPercent}%`,
                    background: `linear-gradient(90deg, ${item.color}, ${item.color}99)`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
