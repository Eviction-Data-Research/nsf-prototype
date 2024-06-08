import { Flex, Grid, GridItem, Skeleton, Text } from "@chakra-ui/react";
import Statistic from "../PropertyPopup/Statistic";
import { BiBuildingHouse } from "react-icons/bi";
import { Building } from "lucide-react";
import GroupedBarChart from "../Charts/GroupedBarChart";
import { useQuery } from "@tanstack/react-query";
import { FilterState } from "../../routes/root";
import { urls } from "../../utils/consts";
import dayjs from "dayjs";

type ChartStats = {
  countByMonth: ({
    label: string;
  } & Record<string, number>)[];
  evictionCount: number;
};

type Props = {
  filterState: Pick<FilterState, "counties" | "dateFrom" | "dateTo">;
  numBuildings: number | undefined;
};

function ChartPopup({ filterState, numBuildings }: Props) {
  const { data } = useQuery({
    queryKey: ["chart", filterState],
    queryFn: () => {
      const url = new URL(urls.eviction.chart);

      const preparsedFilterState = {
        ...filterState,
        dateFrom: filterState.dateFrom
          ? dayjs(filterState.dateFrom).format("YYYY-MM-DD")
          : undefined,
        dateTo: filterState.dateTo
          ? dayjs(filterState.dateTo).format("YYYY-MM-DD")
          : undefined,
      };

      Object.entries(preparsedFilterState).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach((value) =>
            url.searchParams.append(key, value.toString())
          );
        } else if (value !== undefined) {
          url.searchParams.append(key, value.toString());
        }
      });

      return fetch(url).then((res) => res.json() as Promise<ChartStats>);
    },
  });
  return (
    <Flex
      pos="absolute"
      top={2}
      right={2}
      flexDir="column"
      gap={4}
      p={4}
      bgColor="white"
      borderRadius={12}
      boxShadow="md"
      w="35em"
    >
      <Text fontWeight="bold" fontSize="lg">
        Chart
      </Text>
      <Grid gap={2} templateColumns="repeat(2, 1fr)">
        <GridItem>
          <Statistic
            icon={<BiBuildingHouse />}
            label="Eviction count"
            value={data?.evictionCount}
          />
        </GridItem>
        <GridItem>
          <Statistic
            icon={<Building size={14} />}
            label="Number of buildings"
            value={numBuildings}
          />
        </GridItem>
      </Grid>
      <Flex w="100%" h="20em">
        {data ? (
          <GroupedBarChart
            data={data.countByMonth}
            showGrid={false}
            margin={{ top: 10, bottom: 50, left: 40, right: 0 }}
          />
        ) : (
          <Skeleton h="100%" w="100%" />
        )}
      </Flex>
    </Flex>
  );
}

export default ChartPopup;
