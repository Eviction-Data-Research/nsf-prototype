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
import { BiBuildingHouse, BiBell, BiCalendarExclamation } from "react-icons/bi";
import Statistic from "./Statistic";
import { GetCaresPropertyOutput } from "../PropertyPopup/PropertyPopup";
import BarChart, { TooltipData } from "../Charts/BarChart";
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

function TooltipContent({ data }: { data: TooltipData }) {
  return <p>{data.value}</p>;
}

type Props = Pick<GetCaresPropertyOutput, "suggestions"> & { caresId: string };

function Trend({ caresId, suggestions }: Props) {
  const [trendTabIndex, setTrendTabIndex] = useState<0 | 1>(0);
  const [weekRange, setWeekRange] =
    useState<[number, number]>(defaultWeekRange);
  const [monthRange, setMonthRange] =
    useState<[number, number]>(defaultMonthRange);

  const debouncedWeekRange = useDebounce(weekRange, 300);
  const debouncedMonthRange = useDebounce(monthRange, 300);

  const dateFromDelta =
    trendTabIndex === 0 ? debouncedWeekRange[0] : debouncedMonthRange[0];
  const dateToDelta =
    trendTabIndex === 0 ? debouncedWeekRange[1] : debouncedMonthRange[1];

  const dateFrom = dayjs(START_DATE)
    .startOf(tabIndexTimeRangeMap[trendTabIndex])
    .add(dateFromDelta, tabIndexTimeRangeMap[trendTabIndex])
    .format("YYYY-MM-DD");
  const dateTo = dayjs(START_DATE)
    .startOf(tabIndexTimeRangeMap[trendTabIndex])
    .add(dateToDelta, tabIndexTimeRangeMap[trendTabIndex])
    .format("YYYY-MM-DD");

  const { data } = useQuery({
    queryKey: ["caresById", caresId, dateFrom, dateTo],
    queryFn: () => getCaresPropertyTrendById(caresId, dateFrom, dateTo),
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
          icon={<BiBell size={36} />}
          label="Last week"
          value={0}
          range="Jan 2019 - Dec 2019"
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
              <BarChart
                data={data.history.week}
                tooltipTitleTransformer={(data) => {
                  const start = dayjs(data.label, "MM/DD/YY");
                  const end = start.add(6, "day");
                  return `${start.format("MM/DD/YYYY")} - ${end.format(
                    "MM/DD/YYYY"
                  )}`;
                }}
                tooltipContent={TooltipContent}
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
              onChange={(val) => setWeekRange(val as [number, number])}
              defaultValue={weekRange}
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
                {dayjs(START_DATE)
                  .startOf("week")
                  .add(weekRange[0], "week")
                  .format("MM/DD/YYYY")}
              </RangeSliderMark>
              <RangeSliderMark
                value={weekRange[1]}
                textAlign="center"
                mt={2}
                ml={-10}
                fontSize="small"
              >
                {dayjs(START_DATE)
                  .startOf("week")
                  .add(weekRange[1], "week")
                  .format("MM/DD/YYYY")}
              </RangeSliderMark>
            </RangeSlider>
          </TabPanel>
          <TabPanel h="100%">
            {data ? (
              <BarChart
                data={data.history.month}
                tooltipTitleTransformer={(data) =>
                  dayjs(data.label, "MM/YY").format("MMM YYYY")
                }
                tooltipContent={TooltipContent}
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
              onChange={(val) => setMonthRange(val as [number, number])}
              defaultValue={monthRange}
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
                ml={-10}
                fontSize="small"
              >
                {dayjs(START_DATE)
                  .startOf("month")
                  .add(monthRange[0], "month")
                  .format("MM/DD/YYYY")}
              </RangeSliderMark>
              <RangeSliderMark
                value={monthRange[1]}
                textAlign="center"
                mt={2}
                ml={-10}
                fontSize="small"
              >
                {dayjs(START_DATE)
                  .startOf("month")
                  .add(monthRange[1], "month")
                  .format("MM/DD/YYYY")}
              </RangeSliderMark>
            </RangeSlider>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Flex>
  );
}

export default Trend;
