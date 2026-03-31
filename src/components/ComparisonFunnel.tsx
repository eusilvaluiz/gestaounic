interface FunnelStage {
  label: string;
  valueA: number;
  valueB: number;
}

interface ComparisonFunnelProps {
  title: string;
  stages: FunnelStage[];
}

const formatNumber = (v: number) => new Intl.NumberFormat("pt-BR").format(v);

export const ComparisonFunnel = ({ title, stages }: ComparisonFunnelProps) => {
  const maxValue = Math.max(...stages.flatMap((s) => [s.valueA, s.valueB]), 1);

  return (
    <div className="glass-effect rounded-xl p-6 animate-slide-up">
      <h3 className="text-lg font-semibold mb-2 text-foreground">{title}</h3>
      <div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "hsl(199 89% 48%)" }} />
          <span>Período A</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "hsl(38 92% 50%)" }} />
          <span>Período B</span>
        </div>
      </div>
      <div className="space-y-4">
        {stages.map((stage) => {
          const widthA = (stage.valueA / maxValue) * 100;
          const widthB = (stage.valueB / maxValue) * 100;

          return (
            <div key={stage.label} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">{stage.label}</span>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-info font-semibold">{formatNumber(stage.valueA)}</span>
                  <span className="text-muted-foreground">vs</span>
                  <span className="text-warning font-semibold">{formatNumber(stage.valueB)}</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="w-full h-3 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.max(widthA, 2)}%`,
                      backgroundColor: "hsl(199 89% 48%)",
                    }}
                  />
                </div>
                <div className="w-full h-3 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.max(widthB, 2)}%`,
                      backgroundColor: "hsl(38 92% 50%)",
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
