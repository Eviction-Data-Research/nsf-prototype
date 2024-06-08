import { Flex, Spinner, Text } from "@chakra-ui/react";

interface Props {
  icon:
    | React.ReactElement<any, string | React.JSXElementConstructor<any>>
    | undefined;
  value: number | undefined;
  label: string;
}

function Statistic(props: Props) {
  return (
    <Flex
      w="100%"
      bgColor="blue.50"
      flexDir="column"
      borderRadius={6}
      justifyContent="center"
      alignItems="center"
      p={2}
    >
      {props.value === undefined ? (
        <Flex w="100%" h="100%" justifyContent="center" alignItems="center">
          <Spinner />
        </Flex>
      ) : (
        <Text fontSize="md" fontWeight="extrabold">
          {props.value}
        </Text>
      )}
      <Flex flexDir="row" gap={1} alignItems="center" justifyContent="center">
        {props.icon}
        <Text fontSize="sm" fontWeight="medium">
          {props.label}
        </Text>
      </Flex>
    </Flex>
  );
}

export default Statistic;
