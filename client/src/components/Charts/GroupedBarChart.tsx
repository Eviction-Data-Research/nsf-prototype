import { BarGroup } from "@visx/shape";
import { Group } from "@visx/group";
import { Grid } from "@visx/grid";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { scaleBand, scaleLinear, scaleOrdinal } from "@visx/scale";
import { useTooltip, useTooltipInPortal, defaultStyles } from "@visx/tooltip";
import { LegendOrdinal } from "@visx/legend";
import { useParentSize } from "@visx/responsive";
import { Box } from "@chakra-ui/react";

export type TooltipData = {
  label: string;
  value: number;
};

type BarChartProps = {
  data: ({ label: string } & Record<string, number>)[];
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

const COLORS = ["#38B2AC", "#3182CE", "#76E4F7", "#9F7AEA", "#ED64A6"];

const tooltipStyles = {
  ...defaultStyles,
  minWidth: 60,
  backgroundColor: "rgba(0,0,0,0.9)",
  color: "white",
};

function GroupedBarChart({
  data,
  margin = DEFAULT_MARGIN,
  tooltipTitleTransformer,
  tooltipContent: TooltipContent,
  showGrid = true,
}: BarChartProps) {
  const { tooltipOpen, tooltipLeft, tooltipTop, tooltipData } =
    useTooltip<TooltipData>();

  const keys = Object.keys(data[0]).filter((d) => d !== "label");

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
    padding: 0.2,
  });

  const maxVal = Math.max(
    ...data.map(({ label, ...rest }) => Math.max(...Object.values(rest)))
  );

  const yScale = scaleLinear<number>({
    domain: [0, maxVal],
    range: [yMax, 0],
    nice: true,
    clamp: true,
  });

  const countyScale = scaleBand<string>({
    domain: keys,
    range: [0, xScale.bandwidth()],
    // round: true,
    // padding: 0.1,
  });

  const colorScale = scaleOrdinal<string, string>({
    domain: keys,
    range: COLORS.slice(0, keys.length),
  });
  const getLabel = (d: { label: string } & Record<string, number>) => d.label;

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
          <BarGroup
            data={data}
            keys={keys}
            height={yMax}
            x0={getLabel}
            x0Scale={xScale}
            x1Scale={countyScale}
            yScale={yScale}
            color={colorScale}
          >
            {(barGroups) =>
              barGroups.map((barGroup) => (
                <Group
                  key={`bar-group-${barGroup.index}-${barGroup.x0}`}
                  left={barGroup.x0}
                >
                  {barGroup.bars.map((bar) => (
                    <rect
                      key={`bar-group-bar-${barGroup.index}-${bar.index}-${bar.value}-${bar.key}`}
                      x={bar.x}
                      y={bar.y}
                      width={bar.width}
                      height={bar.height}
                      fill={bar.color}
                    />
                  ))}
                </Group>
              ))
            }
          </BarGroup>
        </Group>
      </svg>
      <div
        style={{
          position: "absolute",
          bottom: 0,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          fontSize: "14px",
        }}
      >
        <LegendOrdinal
          scale={colorScale}
          direction="row"
          labelMargin="0 15px 0 0"
        />
      </div>

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

export default GroupedBarChart;
