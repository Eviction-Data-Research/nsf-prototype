import { Flex, ListItem, OrderedList, Text } from "@chakra-ui/react";

function AboutPopup() {
  return (
    <Flex
      pos="absolute"
      top={2}
      right={2}
      flexDir="column"
      gap={2}
      p={4}
      bgColor="white"
      borderRadius={12}
      boxShadow="md"
      w="24em"
    >
      <Text fontWeight="bold" fontSize="lg">
        About
      </Text>
      <Text fontSize="sm">
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
      </OrderedList>
    </Flex>
  );
}

export default AboutPopup;
