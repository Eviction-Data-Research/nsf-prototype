import {
  Flex,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Text,
  RangeSliderMark,
  Spinner,
} from "@chakra-ui/react";
import { BiBuildingHouse, BiCalendarExclamation } from "react-icons/bi";
import Statistic from "./Statistic";
import { GetCaresPropertyOutput } from "../PropertyPopup/PropertyPopup";
import dayjs from "dayjs";
import {
  RangeSlider,
  RangeSliderTrack,
  RangeSliderFilledTrack,
  RangeSliderThumb,
} from "@chakra-ui/react";
import { useState } from "react";
import { START_DATE, urls } from "../../utils/consts";
import { useDebounce } from "@uidotdev/usehooks";
import { useQuery } from "@tanstack/react-query";
import customParseFormat from "dayjs/plugin/customParseFormat";
import StackedBarChart, { TooltipData } from "../Charts/StackedBarChart";

dayjs.extend(customParseFormat);

export type GetCaresPropertyTrendOutput = Pick<
  GetCaresPropertyOutput,
  "property" | "history"
>;

export const defaultWeekRange: [number, number] = [
  0,
  dayjs().startOf("week").diff(dayjs(START_DATE).startOf("week"), "week"),
];

export const defaultMonthRange: [number, number] = [
  0,
  dayjs().startOf("month").diff(dayjs(START_DATE).startOf("month"), "month"),
];

const tabIndexTimeRangeMap = {
  0: "week",
  1: "month",
} as const;

export async function getCaresPropertyTrendById(
  caresId: string,
  dateFrom?: string,
  dateTo?: string
) {
  const url = new URL(urls.cares.trend);
  url.searchParams.set("id", caresId);
  if (dateFrom)
    url.searchParams.append("dateFrom", dayjs(dateFrom).format("YYYY-MM-DD"));
  if (dateTo)
    url.searchParams.append("dateTo", dayjs(dateTo).format("YYYY-MM-DD"));
  const res = await fetch(url);
  const data = await res.json();
  return data as GetCaresPropertyTrendOutput;
}

function WeekTooltipContent({ data }: { data: TooltipData }) {
  const start = dayjs(data.label, "MM/DD/YY");
  const end = start.add(6, "day");
  return (
    <Flex flexDir="column" gap={1} p={0.5}>
      <Text
        fontWeight="bold"
        textColor={data.key === "value" ? "blue.500" : "blue.100"}
      >
        {data.key === "value" ? "Evictions" : "Suggestions"}
      </Text>
      <Text fontWeight="semibold">{data[data["key"]]}</Text>
      <Text fontSize="small">{`${start.format("MM/DD/YYYY")} - ${end.format(
        "MM/DD/YYYY"
      )}`}</Text>
    </Flex>
  );
}

function MonthTooltipContent({ data }: { data: TooltipData }) {
  return (
    <Flex flexDir="column" gap={1} p={0.5}>
      <Text
        fontWeight="bold"
        textColor={data.key === "value" ? "blue.500" : "blue.100"}
      >
        {data.key === "value" ? "Evictions" : "Suggestions"}
      </Text>
      <Text fontWeight="semibold">{data[data["key"]]}</Text>
      <Text fontSize="small">
        {dayjs(data.label, "MM/YY").format("MMM YYYY")}
      </Text>
    </Flex>
  );
}

type Props = Pick<GetCaresPropertyOutput, "suggestions"> & { caresId: string };

function Trend({ caresId, suggestions }: Props) {
  const [trendTabIndex, setTrendTabIndex] = useState<0 | 1>(0);
  const [weekRange, setWeekRange] =
    useState<[number, number]>(defaultWeekRange);
  const [monthRange, setMonthRange] =
    useState<[number, number]>(defaultMonthRange);

  const dateFromDelta = trendTabIndex === 0 ? weekRange[0] : monthRange[0];
  const dateToDelta = trendTabIndex === 0 ? weekRange[1] : monthRange[1];

  const dateFrom = dayjs(START_DATE)
    .startOf(tabIndexTimeRangeMap[trendTabIndex])
    .add(dateFromDelta, tabIndexTimeRangeMap[trendTabIndex]);
  const dateTo = dayjs(START_DATE)
    .startOf(tabIndexTimeRangeMap[trendTabIndex])
    .add(dateToDelta + 1, tabIndexTimeRangeMap[trendTabIndex])
    .subtract(1, "day");

  const dateFromLabel = useDebounce(dateFrom.format("YYYY-MM-DD"), 300);
  const dateToLabel = useDebounce(dateTo.format("YYYY-MM-DD"), 300);

  const { data } = useQuery({
    queryKey: ["caresById", caresId, dateFromLabel, dateToLabel],
    queryFn: () =>
      getCaresPropertyTrendById(caresId, dateFromLabel, dateToLabel),
  });

  return (
    <Flex flexDir="column" gap={4} mb={4}>
      <Flex flexDir="column">
        <Text fontSize="xl" fontWeight="bold">
          Historical Trend
        </Text>
        <Text>
          Adjust the filters and check out evictions at this particular
          building.
        </Text>
      </Flex>
      <Flex flexDir="row" w="100%" justifyContent="space-between" gap={2}>
        <Statistic
          icon={<BiBuildingHouse size={36} />}
          label="Total count"
          value={data?.property?.count}
          range={`${dayjs(dateFrom).format("MMM DD, YYYY")} - ${dayjs(
            dateTo
          ).format("MMM DD, YYYY")}`}
        />
        <Statistic
          icon={<BiCalendarExclamation size={36} />}
          label="Suggested"
          value={suggestions.length}
          range={`${dayjs(START_DATE).format(
            "MMM DD, YYYY"
          )} - ${dayjs().format("MMM DD, YYYY")}`}
        />
      </Flex>
      <Tabs
        colorScheme="blue"
        align="center"
        isFitted
        index={trendTabIndex}
        onChange={(index) => setTrendTabIndex(index as 0 | 1)}
      >
        <TabList>
          <Tab
            textColor="gray.500"
            borderColor="gray.200"
            fontWeight="semibold"
            _selected={{ textColor: "blue.500", borderColor: "blue.500" }}
          >
            Weekly
          </Tab>
          <Tab
            textColor="gray.500"
            borderColor="gray.200"
            fontWeight="semibold"
            _selected={{ textColor: "blue.500", borderColor: "blue.500" }}
          >
            Monthly
          </Tab>
        </TabList>
        <TabPanels h={400}>
          <TabPanel w="100%" h="100%">
            {data ? (
              <StackedBarChart
                data={data.history.week}
                tooltipContent={WeekTooltipContent}
                margin={{ top: 10, bottom: 25, left: 25, right: 25 }}
              />
            ) : (
              <Flex
                w="100%"
                h="100%"
                justifyContent="center"
                alignItems="center"
              >
                <Spinner size="xl" />
              </Flex>
            )}

            <RangeSlider
              size="lg"
              aria-label={["min", "max"]}
              min={defaultWeekRange[0]}
              max={defaultWeekRange[1]}
              value={weekRange}
              onChange={(val) => {
                if (val[1] - val[0] > 0) setWeekRange(val as [number, number]);
              }}
              step={1}
            >
              <RangeSliderTrack>
                <RangeSliderFilledTrack />
              </RangeSliderTrack>
              <RangeSliderThumb
                index={0}
                borderWidth={1}
                borderColor="gray.100"
              />
              <RangeSliderThumb
                index={1}
                borderWidth={1}
                borderColor="gray.100"
              />
              <RangeSliderMark
                value={weekRange[0]}
                textAlign="center"
                mt={2}
                ml={-10}
                fontSize="small"
              >
                {dateFrom.format("MM/DD/YYYY")}
              </RangeSliderMark>
              <RangeSliderMark
                value={weekRange[1]}
                textAlign="center"
                mt={2}
                ml={-10}
                fontSize="small"
              >
                {dateTo.format("MM/DD/YYYY")}
              </RangeSliderMark>
            </RangeSlider>
          </TabPanel>
          <TabPanel h="100%">
            {data ? (
              <StackedBarChart
                data={data.history.month}
                tooltipContent={MonthTooltipContent}
                margin={{ top: 10, bottom: 25, left: 25, right: 25 }}
              />
            ) : (
              <Flex
                w="100%"
                h="100%"
                justifyContent="center"
                alignItems="center"
              >
                <Spinner size="xl" />
              </Flex>
            )}
            <RangeSlider
              size="lg"
              aria-label={["min", "max"]}
              min={defaultMonthRange[0]}
              max={defaultMonthRange[1]}
              value={monthRange}
              onChange={(val) => {
                if (val[1] - val[0] > 0) setMonthRange(val as [number, number]);
              }}
              step={1}
            >
              <RangeSliderTrack>
                <RangeSliderFilledTrack />
              </RangeSliderTrack>
              <RangeSliderThumb
                index={0}
                borderWidth={1}
                borderColor="gray.100"
              />
              <RangeSliderThumb
                index={1}
                borderWidth={1}
                borderColor="gray.100"
              />
              <RangeSliderMark
                value={monthRange[0]}
                textAlign="center"
                mt={2}
                ml="-1.5rem"
                fontSize="small"
              >
                {dateFrom.format("MMM YYYY")}
              </RangeSliderMark>
              <RangeSliderMark
                value={monthRange[1]}
                textAlign="center"
                mt={2}
                ml="-1.5rem"
                fontSize="small"
                whiteSpace="nowrap"
              >
                {dateTo.format("MMM YYYY")}
              </RangeSliderMark>
            </RangeSlider>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Flex>
  );
}

export default Trend;
