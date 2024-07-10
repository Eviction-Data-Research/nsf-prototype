import { Flex, IconButton, Skeleton, Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { urls } from "../../utils/consts";
import { CloseIcon } from "@chakra-ui/icons";
import { Maximize2 } from "lucide-react";
import Statistic from "./Statistic";
import { BiBuildingHouse, BiCalendarExclamation } from "react-icons/bi";
import { Link } from "react-router-dom";
import {
  CaresProperty,
  Suggestion,
  AddressPermutation,
  NamePermutation,
  TimeSeriesHistory,
} from "../../utils/types";
import dayjs from "dayjs";
import StackedBarChart from "../Charts/StackedBarChart";

export type GetCaresPropertyOutput = {
  property: CaresProperty;
  history: {
    month: TimeSeriesHistory[];
    week: TimeSeriesHistory[];
  };
  suggestions: Suggestion[];
  archivedSuggestions: Suggestion[];
  addressPermutations: AddressPermutation[];
  namePermutations: NamePermutation[];
};

interface Props {
  caresId: number | undefined;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  setSelectedProperty: React.Dispatch<React.SetStateAction<number | undefined>>;
}

function PropertyPopup({
  caresId,
  dateFrom,
  dateTo,
  setSelectedProperty,
}: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["caresById", caresId, dateFrom, dateTo],
    queryFn: () => {
      const url = new URL(urls.cares.id);
      url.searchParams.append("id", caresId!.toString());
      if (dateFrom)
        url.searchParams.append(
          "dateFrom",
          dayjs(dateFrom).format("YYYY-MM-DD")
        );
      if (dateTo)
        url.searchParams.append("dateTo", dayjs(dateTo).format("YYYY-MM-DD"));
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
      >
        <Skeleton w="100%" h="100%" />
      </Flex>
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
        <Flex flexDir="column" gap={1}>
          <Link
            to={`/cares/${data.property.id}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Text fontWeight="bold" fontSize="lg" lineHeight="1.2em">
              {data?.property.propertyName}
            </Text>
          </Link>
          <Text
            fontSize="xs"
            lineHeight="1em"
          >{`${data?.property.address}, ${data?.property.city}, GA ${data?.property.zipCode}`}</Text>
        </Flex>
        <Flex flexDir="row" gap={1}>
          <Link
            to={`/cares/${data.property.id}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <IconButton
              variant="ghost"
              size="sm"
              icon={<Maximize2 size={18} />}
              aria-label="Open property page"
            />
          </Link>
          <IconButton
            variant="ghost"
            size="sm"
            icon={<CloseIcon />}
            aria-label="Close"
            onClick={() => setSelectedProperty(undefined)}
          />
        </Flex>
      </Flex>
      <Flex flexDir="column" gap={2}>
        <Flex flexDir="row" w="100%" justifyContent="space-between" gap={2}>
          <Statistic
            icon={<BiBuildingHouse />}
            label="Total count"
            value={data.property.count}
          />
          <Statistic
            icon={<BiCalendarExclamation />}
            label="Suggested"
            value={data.suggestions.length}
          />
        </Flex>
      </Flex>
      <Flex w="100%" h="12em" alignItems="center" textAlign="center">
        <StackedBarChart
          data={data.history.month}
          showGrid={false}
          margin={{ top: 10, bottom: 25, left: 25, right: 0 }}
        />
      </Flex>
    </Flex>
  );
}

export default PropertyPopup;
