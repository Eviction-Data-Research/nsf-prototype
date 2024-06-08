import { Flex, Skeleton, Text } from "@chakra-ui/react";

interface Props {
  icon:
    | React.ReactElement<any, string | React.JSXElementConstructor<any>>
    | undefined;
  value: number | undefined;
  label: string;
  range: string;
}

function Statistic(props: Props) {
  return (
    <Flex
      w="100%"
      //   h="100%"
      bgColor="blue.50"
      flexDir="row"
      borderRadius={6}
      justifyContent="space-between"
      alignItems="center"
      p={6}
    >
      <Flex flexDir="row" alignItems="center" gap={2}>
        {props.icon}
        <Flex flexDir="column">
          <Text fontWeight="semibold">{props.label}</Text>
          <Text fontSize="sm">{props.range}</Text>
        </Flex>
      </Flex>
      <Skeleton isLoaded={props.value !== undefined}>
        <Text fontSize="2xl" fontWeight="extrabold">
          {props.value}
        </Text>
      </Skeleton>
    </Flex>
  );
}

export default Statistic;
