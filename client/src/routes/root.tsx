import { Box, Flex } from "@chakra-ui/react";
import DeckGL from "@deck.gl/react/typed";
import { ScatterplotLayer } from "@deck.gl/layers/typed";
import { Map } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import Sidebar from "../components/Sidebar/Sidebar";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { urls } from "../utils/consts";
import { scaleLinear } from "d3-scale";
import * as dayjs from "dayjs";
import PropertyPopup from "../components/PropertyPopup/PropertyPopup";
import { MapViewState } from "@deck.gl/core/typed";
import { useOpenPopup } from "../components/Navbar/NavbarWrapper";
import AboutPopup from "../components/Navbar/AboutPopup";
import ChartPopup from "../components/Navbar/ChartPopup";

export type County = "fulton" | "dekalb" | "clayton" | "cobb" | "gwinnett";
export type FilterState = {
  counties: County[];
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  minCount: number;
  activity: boolean;
};

type CaresProperty = {
  id: number;
  location: [longitude: number, latitude: number];
  count: number;
};

type CaresEvictionRecords = {
  records: CaresProperty[];
  maxCount: number;
};

const INITIAL_VIEW_STATE: MapViewState = {
  longitude: -84.386,
  latitude: 33.792,
  zoom: 10,
  pitch: 0,
  bearing: 0,
  maxZoom: 18,
  minZoom: 8,
};

const OPACITY = 130;

function convertRGBToArr(
  rgb: string
): [r: number, g: number, b: number, a: number] {
  return [...rgb.match(/\d+/g)!.map(Number), OPACITY] as [
    r: number,
    g: number,
    b: number,
    a: number
  ];
}

const MAPBOX_ACCESS_TOKEN =
  "pk.eyJ1Ijoia2NoYW45MCIsImEiOiJjbHR4ZmkxdjIwMGx2Mm1zM3Q0ZDRyczdxIn0.S0dIcVjFBAllLj0n7QctRA";

function Home() {
  const [openPopup, setOpenPopup] = useOpenPopup();
  const [viewState, setViewState] = useState<MapViewState>(INITIAL_VIEW_STATE);

  const [selectedProperty, setSelectedProperty] = useState<
    CaresProperty["id"] | undefined
  >();
  const [filterState, setFilterState] = useState<FilterState>({
    counties: ["fulton", "dekalb"],
    dateFrom: undefined,
    dateTo: undefined,
    minCount: 0,
    activity: false,
  });

  const { data } = useQuery({
    queryKey: ["allCares", filterState],
    queryFn: () => {
      const url = new URL(urls.cares.all);

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

      return fetch(url).then(
        (res) => res.json() as Promise<CaresEvictionRecords>
      );
    },
  });

  const colorScaleFunction = scaleLinear()
    .domain([1, data?.maxCount ?? 1])
    .range(["yellow", "red"] as any);

  const layer = new ScatterplotLayer<CaresProperty>({
    id: "CaresScatterplotLayer",
    data: data?.records,
    getPosition: (d: CaresProperty) => d.location,
    getRadius: (d: CaresProperty) => Math.log(d.count + 1) ** 3,
    getFillColor: (d: CaresProperty) =>
      convertRGBToArr(colorScaleFunction(d.count) as unknown as string),
    getLineWidth: (d: CaresProperty) => (d.id === selectedProperty ? 5 : 0),
    radiusMinPixels: 5,
    radiusScale: 15 - viewState.zoom,
    // radiusUnits: "pixels",
    lineWidthUnits: "pixels",
    getLineColor: [160, 174, 192], // gray.400
    stroked: true,
    pickable: true,
    updateTriggers: {
      getLineWidth: [selectedProperty],
    },
  });

  return (
    <Box w="100%" h="100%">
      <Flex w="100%" h="100%" zIndex={1} pos="relative">
        <DeckGL
          controller={{ doubleClickZoom: false }}
          initialViewState={INITIAL_VIEW_STATE}
          onViewStateChange={(e) => setViewState(e.viewState as MapViewState)}
          layers={[layer]}
          onClick={(info) => {
            if (info.object) {
              setSelectedProperty(info.object.id);
              setOpenPopup("property");
            } else {
              setSelectedProperty(undefined);
              setOpenPopup(undefined);
            }
          }}
        >
          <Map
            mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
            mapStyle="mapbox://styles/mapbox/light-v11"
          />
        </DeckGL>
        <Sidebar filterState={filterState} setFilterState={setFilterState} />
        {openPopup === "property" && (
          <PropertyPopup caresId={selectedProperty} />
        )}
        {openPopup === "about" && <AboutPopup />}
        {openPopup === "chart" && <ChartPopup />}
      </Flex>
      {/* <UploadModal /> */}
    </Box>
  );
}

export default Home;
