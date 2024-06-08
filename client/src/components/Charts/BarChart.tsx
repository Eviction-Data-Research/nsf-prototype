import { Bar } from "@visx/shape";
import { Group } from "@visx/group";
import { Grid } from "@visx/grid";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { scaleBand, scaleLinear } from "@visx/scale";
import { useTooltip, useTooltipInPortal, defaultStyles } from "@visx/tooltip";
import { localPoint } from "@visx/event";
import { useParentSize } from "@visx/responsive";
import { Box } from "@chakra-ui/react";

export type TooltipData = {
  label: string;
  value: number;
};

type BarChartProps = {
  data: {
    label: string;
    value: number;
  }[];
  margin?: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  };
  showGrid?: boolean;
  tooltipTitleTransformer?: (data: TooltipData) => string;
  tooltipContent?: ({ data }: { data: TooltipData }) => JSX.Element;
};

const DEFAULT_MARGIN = {
  top: 10,
  left: 20,
  right: 0,
  bottom: 50,
};
const tooltipStyles = {
  ...defaultStyles,
  minWidth: 60,
  backgroundColor: "rgba(0,0,0,0.9)",
  color: "white",
};
let tooltipTimeout: number;

function BarChart({
  data,
  margin = DEFAULT_MARGIN,
  tooltipTitleTransformer,
  tooltipContent: TooltipContent,
  showGrid = true,
}: BarChartProps) {
  const {
    tooltipOpen,
    tooltipLeft,
    tooltipTop,
    tooltipData,
    hideTooltip,
    showTooltip,
  } = useTooltip<TooltipData>();

  const { parentRef, width, height } = useParentSize({ debounceTime: 150 });

  const { containerRef, TooltipInPortal } = useTooltipInPortal({
    // TooltipInPortal is rendered in a separate child of <body /> and positioned
    // with page coordinates which should be updated on scroll. consider using
    // Tooltip or TooltipWithBounds if you don't need to render inside a Portal
    scroll: true,
  });

  // if (height < 10) return null;
  // bounds
  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;

  const xScale = scaleBand<string>({
    domain: data.map((d) => d.label),
    range: [0, xMax],
    // padding: 0.2,
  });

  const maxVal = Math.max(...data.map((d) => d.value));

  const yScale = scaleLinear<number>({
    domain: [0, maxVal],
    range: [yMax, 0],
    nice: true,
    clamp: true,
  });

  return (
    <Box ref={parentRef} pos="relative" w="100%" h="100%">
      <svg ref={containerRef} width={width} height={height}>
        {showGrid && (
          <Grid
            top={margin.top}
            left={margin.left}
            xScale={xScale}
            yScale={yScale}
            width={xMax}
            height={yMax}
            stroke="black"
            strokeOpacity={0.1}
            xOffset={xScale.bandwidth() / 2}
          />
        )}
        <Group top={margin.top} left={margin.left}>
          <AxisLeft scale={yScale} />
          <AxisBottom top={yMax} scale={xScale} />
          {data.map((d) => {
            const barWidth = xScale.bandwidth();
            const barHeight = yMax - yScale(d.value);
            const barX = xScale(d.label);
            const barY = yMax - barHeight;
            return (
              <Group
                key={`bar-${d.label}`}
                onMouseLeave={() => {
                  tooltipTimeout = window.setTimeout(() => {
                    hideTooltip();
                  }, 100);
                }}
                onMouseMove={(event) => {
                  if (tooltipTimeout) clearTimeout(tooltipTimeout);
                  // TooltipInPortal expects coordinates to be relative to containerRef
                  // localPoint returns coordinates relative to the nearest SVG, which
                  // is what containerRef is set to in this example.
                  const eventSvgCoords = localPoint(event);
                  const left = barX! + barWidth / 2;
                  showTooltip({
                    tooltipData: d,
                    tooltipTop: eventSvgCoords?.y,
                    tooltipLeft: left,
                  });
                }}
              >
                <Bar
                  x={barX}
                  y={barY}
                  width={barWidth}
                  height={barHeight}
                  fill="#3182CE"
                />
                {d.value > 0 && xScale.bandwidth() >= 16 && barHeight >= 20 ? (
                  <text
                    x={barX! + barWidth / 2}
                    y={barY + barHeight / 2}
                    width={barWidth}
                    fill="white"
                    dominant-baseline="middle"
                    text-anchor="middle"
                    fontSize={xScale.bandwidth() - 6}
                  >
                    {d.value}
                  </text>
                ) : null}
              </Group>
            );
          })}
        </Group>
      </svg>

      {tooltipTitleTransformer !== undefined && tooltipOpen && tooltipData && (
        <TooltipInPortal
          top={tooltipTop}
          left={tooltipLeft}
          style={tooltipStyles}
        >
          <strong>{tooltipTitleTransformer(tooltipData)}</strong>
          {TooltipContent ? <TooltipContent data={tooltipData} /> : null}
        </TooltipInPortal>
      )}
    </Box>
  );
}

export default BarChart;
