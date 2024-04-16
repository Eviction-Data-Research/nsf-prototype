import { Box, Flex, IconButton, Portal, Spinner, Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { urls } from "../../utils/consts";
import { CloseIcon } from "@chakra-ui/icons";
import { Maximize2 } from "lucide-react";
import Statistic from "./Statistic";
import { BiBell, BiBuildingHouse, BiCalendarExclamation } from "react-icons/bi";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  ReferenceLine,
  Area,
  ResponsiveContainer,
  BarChart,
  Bar,
  LabelList,
} from "recharts";

type CaresProperty = {
  id: number;
  source: string;
  propertyName: string;
  address: string;
  city: string;
  zipCode: number;
  count: number;
};

type MonthHistory = {
  month: string;
  count: number;
};

type GetCaresPropertyOutput = {
  property: CaresProperty;
  history: MonthHistory[];
};

interface Props {
  caresId: number | undefined;
}

function PropertyPopup({ caresId }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["caresById", caresId],
    queryFn: () => {
      const url = new URL(urls.cares.id);
      url.searchParams.append("id", caresId!.toString());
      return fetch(url).then((res) =>
        res.json()
      ) as Promise<GetCaresPropertyOutput>;
    },
    enabled: caresId !== undefined,
  });

  if (isLoading || !data) {
    return (
      <Flex
        pos="absolute"
        display={caresId === undefined ? "none" : "flex"}
        top={2}
        right={2}
        flexDir="column"
        gap={6}
        p={3}
        bgColor="white"
        borderRadius={12}
        boxShadow="md"
        w="24em"
        h="24em"
      />
    );
  }
  return (
    <Flex
      pos="absolute"
      display={caresId === undefined ? "none" : "flex"}
      top={2}
      right={2}
      flexDir="column"
      gap={6}
      p={4}
      bgColor="white"
      borderRadius={12}
      boxShadow="md"
      w="24em"
    >
      <Flex flexDir="row" justifyContent="space-between">
        <Flex flexDir="column">
          <Text fontWeight="bold" fontSize="lg">
            {data?.property.propertyName}
          </Text>
          <Text fontSize="xs">{`${data?.property.address}, ${data?.property.city}, GA ${data?.property.zipCode}`}</Text>
        </Flex>
        <Flex flexDir="row" gap={1}>
          <IconButton
            variant="ghost"
            size="sm"
            icon={<Maximize2 size={18} />}
            aria-label="Close"
          />
          <IconButton
            variant="ghost"
            size="sm"
            icon={<CloseIcon />}
            aria-label="Close"
          />
        </Flex>
      </Flex>
      <Flex flexDir="column" gap={2}>
        {/* <Text fontWeight="medium">Also known as:</Text> */}
        <Flex flexDir="row" w="100%" justifyContent="space-between" gap={2}>
          <Statistic
            icon={<BiBuildingHouse />}
            label="Total count"
            value={data.property.count}
          />
          <Statistic icon={<BiBell />} label="Last week" value={0} />
          <Statistic
            icon={<BiCalendarExclamation />}
            label="Suggested"
            value={0}
          />
        </Flex>
      </Flex>
      <Flex w="100%" h="10em" alignItems="center" textAlign="center">
        {data.history.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              width={150}
              height={40}
              data={data.history}
              margin={{ top: 20 }}
            >
              <XAxis
                dataKey="month"
                tickCount={data.history.length}
                interval={0}
              />
              <Bar dataKey="count" fill="#3182CE">
                <LabelList dataKey="count" position="top" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <Text>No eviction data found for this CARES Act property</Text>
        )}
      </Flex>
    </Flex>
  );
}

export default PropertyPopup;
