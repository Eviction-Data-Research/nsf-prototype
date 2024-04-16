import { Flex, Text } from "@chakra-ui/react";
import Statistic from "../PropertyPopup/Statistic";
import { BiBuildingHouse } from "react-icons/bi";
import { Building } from "lucide-react";
import { ResponsiveContainer, XAxis, Bar, LabelList, BarChart } from "recharts";

const dummyData = [
  {
    month: "03/19",
    fulton: 4000,
    dekalb: 2400,
  },
  {
    month: "04/19",
    fulton: 3000,
    dekalb: 1398,
  },
  {
    month: "05/19",
    fulton: 2000,
    dekalb: 9800,
  },
];

function ChartPopup() {
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
      w="24em"
    >
      <Text fontWeight="bold" fontSize="lg">
        Chart
      </Text>
      <Flex flexDir="row" gap={2}>
        <Statistic
          icon={<BiBuildingHouse />}
          label="Eviction count"
          value={36614}
        />
        <Statistic
          icon={<Building size={14} />}
          label="Number of buildings"
          value={1550}
        />
      </Flex>
      <Flex w="100%" h="10em">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            width={150}
            height={40}
            data={dummyData}
            margin={{ top: 20 }}
          >
            <XAxis dataKey="month" interval={0} />
            <Bar dataKey="fulton" fill="#3182CE">
              <LabelList dataKey="fulton" position="top" />
            </Bar>
            <Bar dataKey="dekalb" fill="#38B2AC">
              <LabelList dataKey="dekalb" position="top" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Flex>
      {/* <Text fontSize="sm">
        The Atlanta CARES Act Eviction Tracker is a tool for city planners to
        perform analysis on evictions happening at CARES Act properties within
        the 5-county region.
      </Text>
      <Text fontSize="sm" fontWeight="semibold">
        Using this tool, you may:
      </Text>
      <OrderedList>
        <ListItem fontSize="sm">
          Get an overview of evictions happening at CARES Act properties in the
          Atlanta region and perform simple analysis
        </ListItem>
        <ListItem fontSize="sm">
          Upload weekly sets of eviction data and receive updates
        </ListItem>
        <ListItem fontSize="sm">Export the data you need</ListItem>
      </OrderedList> */}
    </Flex>
  );
}

export default ChartPopup;
