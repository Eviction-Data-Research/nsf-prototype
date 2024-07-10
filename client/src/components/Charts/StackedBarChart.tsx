import { BarStack } from "@visx/shape";
import { Group } from "@visx/group";
import { Grid } from "@visx/grid";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { scaleBand, scaleLinear, scaleOrdinal } from "@visx/scale";
import { useTooltip, useTooltipInPortal, defaultStyles } from "@visx/tooltip";
import { localPoint } from "@visx/event";
import { useParentSize } from "@visx/responsive";
import { Box } from "@chakra-ui/react";

type Values = "value" | "potential";

type Data = {
  label: string;
  value: number;
  potential: number;
};

export type TooltipData = Data & { key: Values };

type BarChartProps = {
  data: Data[];
  margin?: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  };
  showGrid?: boolean;
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

const CHAKRA_BLUE_500 = "#3182CE";
const CHAKRA_BLUE_100 = "#BEE3F8";

function StackedBarChart({
  data,
  margin = DEFAULT_MARGIN,
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
    domain: data.map((d: Data) => d.label),
    range: [0, xMax],
    // padding: 0.2,
  });

  const maxVal = Math.max(...data.map((d: Data) => d.value + d.potential));

  const yScale = scaleLinear<number>({
    domain: [0, maxVal || 1],
    range: [yMax, 0],
    nice: true,
    clamp: true,
  });

  const colorScale = scaleOrdinal<Values, string>({
    domain: ["value", "potential"],
    range: [CHAKRA_BLUE_500, CHAKRA_BLUE_100],
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
          <BarStack<any, any>
            data={data}
            keys={["value", "potential"]}
            x={(d: TooltipData) => d.label}
            xScale={xScale}
            yScale={yScale}
            color={colorScale}
          >
            {(barStacks) =>
              barStacks.map((barStack) =>
                barStack.bars.map((bar) => {
                  return (
                    <rect
                      x={bar.x}
                      y={bar.y}
                      height={bar.height}
                      width={bar.width}
                      fill={bar.color}
                      onMouseLeave={() => {
                        tooltipTimeout = window.setTimeout(() => {
                          hideTooltip();
                        }, 300);
                      }}
                      onMouseMove={(event) => {
                        if (tooltipTimeout) clearTimeout(tooltipTimeout);
                        // TooltipInPortal expects coordinates to be relative to containerRef
                        // localPoint returns coordinates relative to the nearest SVG, which
                        // is what containerRef is set to in this example.
                        const eventSvgCoords = localPoint(event);
                        const left = bar.x + bar.width / 2;
                        console.log({
                          ...bar.bar.data,
                          key: bar.key,
                        });
                        showTooltip({
                          tooltipData: { ...bar.bar.data, key: bar.key },
                          tooltipTop: eventSvgCoords?.y,
                          tooltipLeft: left,
                        });
                      }}
                    />
                  );
                })
              )
            }
          </BarStack>
        </Group>
      </svg>

      {tooltipOpen && tooltipData && (
        <TooltipInPortal
          top={tooltipTop}
          left={tooltipLeft}
          style={tooltipStyles}
        >
          {TooltipContent ? <TooltipContent data={tooltipData} /> : null}
        </TooltipInPortal>
      )}
    </Box>
  );
}

export default StackedBarChart;
