import {
  Flex,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Text,
} from "@chakra-ui/react";
import { GetCaresPropertyOutput } from "../../PropertyPopup/PropertyPopup";
import PotentialEvictions from "./PotentialEvictions";
import Archived from "./Archived";
import { useReducer, useState } from "react";
import { Suggestion } from "../../../utils/types";

type Props = Pick<
  GetCaresPropertyOutput,
  "property" | "suggestions" | "archivedSuggestions"
>;

export enum VerificationStatus {
  Confirmed,
  Rejected,
  Unverified,
}

export enum ActionType {
  Set,
}

export type Action = {
  type: ActionType;
  caseID: string;
  verificationStatus: VerificationStatus;
};
function reducer(state: Suggestion[], action: Action): Suggestion[] {
  const { type, caseID, verificationStatus } = action;
  switch (type) {
    case ActionType.Set:
      const newSuggestions = new Array(state.length);
      state.forEach((suggestion, i) => {
        if (suggestion.caseID !== caseID) {
          newSuggestions[i] = suggestion;
        } else {
          newSuggestions[i] = {
            ...suggestion,
            verification: verificationStatus,
          };
        }
      });
      return newSuggestions;
    default:
      return state;
  }
}

function Suggestions({ suggestions, archivedSuggestions }: Props) {
  const [suggestionsWithVerificationContext, suggestionsDispatch] = useReducer(
    reducer,
    suggestions
  );
  const [
    archivedSuggestionsWithVerificationContext,
    archivedSuggestionsDispatch,
  ] = useReducer(reducer, archivedSuggestions);
  const [mostRecentSuggestionFocus, setMostRecentSuggestionFocus] = useState<
    string | null
  >(null);

  return (
    <Flex flexDir="column" gap={2}>
      <Flex flexDir="column">
        <Text fontSize="xl" fontWeight="bold">
          Suggestions
        </Text>
        <Text>
          Check in Google Maps to accept or reject potential evictions. “Origin”
          will be CARES Act properties, and “destination” will be suggested
          address.
        </Text>
      </Flex>
      <Tabs colorScheme="blue" align="center" isFitted isLazy>
        <TabList>
          <Tab
            width={200}
            textColor="gray.500"
            borderColor="gray.200"
            fontWeight="semibold"
            _selected={{ textColor: "blue.500", borderColor: "blue.500" }}
          >
            Potential Evictions
          </Tab>
          <Tab
            width={200}
            textColor="gray.500"
            borderColor="gray.200"
            fontWeight="semibold"
            _selected={{ textColor: "blue.500", borderColor: "blue.500" }}
          >
            Archived
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <PotentialEvictions
              suggestions={suggestionsWithVerificationContext}
              mostRecentSuggestionFocus={mostRecentSuggestionFocus}
              setMostRecentSuggestionFocus={setMostRecentSuggestionFocus}
              dispatch={suggestionsDispatch}
            />
          </TabPanel>
          <TabPanel>
            <Archived
              archivedSuggestions={archivedSuggestionsWithVerificationContext}
              mostRecentSuggestionFocus={mostRecentSuggestionFocus}
              setMostRecentSuggestionFocus={setMostRecentSuggestionFocus}
              dispatch={archivedSuggestionsDispatch}
            />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Flex>
  );
}

export default Suggestions;
