import datetime
from typing import List

import usaddress
import asyncio
import logging
from io import StringIO

import aiohttp
import numpy as np
import pandas as pd
import usaddress
from sqlalchemy import insert, update, text
from sqlalchemy.orm import Session
from sqlalchemy.sql import not_, exists

from .cares import construct_date_filter_subquery, populate_default_dates
from ..db.models.Cares import Cares
from ..db.models.Eviction import TempEviction
from ..db.models.Relationship import TempRelationship
from ..utils.consts import REQUIRED_COLS, MAX_BATCH_SIZE, GEOCODING_API_URL

logging.basicConfig(format='%(asctime)s - %(message)s', level=logging.INFO)
logger = logging.getLogger(__name__)

usps_street_suffix_abbreviations = [
    {
        "primary_street_suffix_name": "ALLEY",
        "commonly_used_street_suffix_or_abbreviation": [
            "ALLEE",
            "ALLEY",
            "ALLY",
            "ALY"
        ],
        "postal_service_standard_suffix_abbreviation": "ALY"
    },
    {
        "primary_street_suffix_name": "ANEX",
        "commonly_used_street_suffix_or_abbreviation": [
            "ANEX",
            "ANNEX",
            "ANNX",
            "ANX"
        ],
        "postal_service_standard_suffix_abbreviation": "ANX"
    },
    {
        "primary_street_suffix_name": "ARCADE",
        "commonly_used_street_suffix_or_abbreviation": [
            "ARC",
            "ARCADE"
        ],
        "postal_service_standard_suffix_abbreviation": "ARC"
    },
    {
        "primary_street_suffix_name": "AVENUE",
        "commonly_used_street_suffix_or_abbreviation": [
            "AV",
            "AVE",
            "AVEN",
            "AVENU",
            "AVENUE",
            "AVN",
            "AVNUE"
        ],
        "postal_service_standard_suffix_abbreviation": "AVE"
    },
    {
        "primary_street_suffix_name": "BAYOU",
        "commonly_used_street_suffix_or_abbreviation": [
            "BAYOO",
            "BAYOU"
        ],
        "postal_service_standard_suffix_abbreviation": "BYU"
    },
    {
        "primary_street_suffix_name": "BEACH",
        "commonly_used_street_suffix_or_abbreviation": [
            "BCH",
            "BEACH"
        ],
        "postal_service_standard_suffix_abbreviation": "BCH"
    },
    {
        "primary_street_suffix_name": "BEND",
        "commonly_used_street_suffix_or_abbreviation": [
            "BEND",
            "BND"
        ],
        "postal_service_standard_suffix_abbreviation": "BND"
    },
    {
        "primary_street_suffix_name": "BLUFF",
        "commonly_used_street_suffix_or_abbreviation": [
            "BLF",
            "BLUF",
            "BLUFF"
        ],
        "postal_service_standard_suffix_abbreviation": "BLF"
    },
    {
        "primary_street_suffix_name": "BLUFFS",
        "commonly_used_street_suffix_or_abbreviation": [
            "BLUFFS"
        ],
        "postal_service_standard_suffix_abbreviation": "BLFS"
    },
    {
        "primary_street_suffix_name": "BOTTOM",
        "commonly_used_street_suffix_or_abbreviation": [
            "BOT",
            "BTM",
            "BOTTM",
            "BOTTOM"
        ],
        "postal_service_standard_suffix_abbreviation": "BTM"
    },
    {
        "primary_street_suffix_name": "BOULEVARD",
        "commonly_used_street_suffix_or_abbreviation": [
            "BLVD",
            "BOUL",
            "BOULEVARD",
            "BOULV"
        ],
        "postal_service_standard_suffix_abbreviation": "BLVD"
    },
    {
        "primary_street_suffix_name": "BRANCH",
        "commonly_used_street_suffix_or_abbreviation": [
            "BR",
            "BRNCH",
            "BRANCH"
        ],
        "postal_service_standard_suffix_abbreviation": "BR"
    },
    {
        "primary_street_suffix_name": "BRIDGE",
        "commonly_used_street_suffix_or_abbreviation": [
            "BRDGE",
            "BRG",
            "BRIDGE"
        ],
        "postal_service_standard_suffix_abbreviation": "BRG"
    },
    {
        "primary_street_suffix_name": "BROOK",
        "commonly_used_street_suffix_or_abbreviation": [
            "BRK",
            "BROOK"
        ],
        "postal_service_standard_suffix_abbreviation": "BRK"
    },
    {
        "primary_street_suffix_name": "BROOKS",
        "commonly_used_street_suffix_or_abbreviation": [
            "BROOKS"
        ],
        "postal_service_standard_suffix_abbreviation": "BRKS"
    },
    {
        "primary_street_suffix_name": "BURG",
        "commonly_used_street_suffix_or_abbreviation": [
            "BURG"
        ],
        "postal_service_standard_suffix_abbreviation": "BG"
    },
    {
        "primary_street_suffix_name": "BURGS",
        "commonly_used_street_suffix_or_abbreviation": [
            "BURGS"
        ],
        "postal_service_standard_suffix_abbreviation": "BGS"
    },
    {
        "primary_street_suffix_name": "BYPASS",
        "commonly_used_street_suffix_or_abbreviation": [
            "BYP",
            "BYPA",
            "BYPAS",
            "BYPASS",
            "BYPS"
        ],
        "postal_service_standard_suffix_abbreviation": "BYP"
    },
    {
        "primary_street_suffix_name": "CAMP",
        "commonly_used_street_suffix_or_abbreviation": [
            "CAMP",
            "CP",
            "CMP"
        ],
        "postal_service_standard_suffix_abbreviation": "CP"
    },
    {
        "primary_street_suffix_name": "CANYON",
        "commonly_used_street_suffix_or_abbreviation": [
            "CANYN",
            "CANYON",
            "CNYN"
        ],
        "postal_service_standard_suffix_abbreviation": "CYN"
    },
    {
        "primary_street_suffix_name": "CAPE",
        "commonly_used_street_suffix_or_abbreviation": [
            "CAPE",
            "CPE"
        ],
        "postal_service_standard_suffix_abbreviation": "CPE"
    },
    {
        "primary_street_suffix_name": "CAUSEWAY",
        "commonly_used_street_suffix_or_abbreviation": [
            "CAUSEWAY",
            "CAUSWA",
            "CSWY"
        ],
        "postal_service_standard_suffix_abbreviation": "CSWY"
    },
    {
        "primary_street_suffix_name": "CENTER",
        "commonly_used_street_suffix_or_abbreviation": [
            "CEN",
            "CENT",
            "CENTER",
            "CENTR",
            "CENTRE",
            "CNTER",
            "CNTR",
            "CTR"
        ],
        "postal_service_standard_suffix_abbreviation": "CTR"
    },
    {
        "primary_street_suffix_name": "CENTERS",
        "commonly_used_street_suffix_or_abbreviation": [
            "CENTERS"
        ],
        "postal_service_standard_suffix_abbreviation": "CTRS"
    },
    {
        "primary_street_suffix_name": "CIRCLE",
        "commonly_used_street_suffix_or_abbreviation": [
            "CIR",
            "CIRC",
            "CIRCL",
            "CIRCLE",
            "CRCL",
            "CRCLE"
        ],
        "postal_service_standard_suffix_abbreviation": "CIR"
    },
    {
        "primary_street_suffix_name": "CIRCLES",
        "commonly_used_street_suffix_or_abbreviation": [
            "CIRCLES"
        ],
        "postal_service_standard_suffix_abbreviation": "CIRS"
    },
    {
        "primary_street_suffix_name": "CLIFF",
        "commonly_used_street_suffix_or_abbreviation": [
            "CLF",
            "CLIFF"
        ],
        "postal_service_standard_suffix_abbreviation": "CLF"
    },
    {
        "primary_street_suffix_name": "CLIFFS",
        "commonly_used_street_suffix_or_abbreviation": [
            "CLFS",
            "CLIFFS"
        ],
        "postal_service_standard_suffix_abbreviation": "CLFS"
    },
    {
        "primary_street_suffix_name": "CLUB",
        "commonly_used_street_suffix_or_abbreviation": [
            "CLB",
            "CLUB"
        ],
        "postal_service_standard_suffix_abbreviation": "CLB"
    },
    {
        "primary_street_suffix_name": "COMMON",
        "commonly_used_street_suffix_or_abbreviation": [
            "COMMON"
        ],
        "postal_service_standard_suffix_abbreviation": "CMN"
    },
    {
        "primary_street_suffix_name": "COMMONS",
        "commonly_used_street_suffix_or_abbreviation": [
            "COMMONS"
        ],
        "postal_service_standard_suffix_abbreviation": "CMNS"
    },
    {
        "primary_street_suffix_name": "CORNER",
        "commonly_used_street_suffix_or_abbreviation": [
            "COR",
            "CORNER"
        ],
        "postal_service_standard_suffix_abbreviation": "COR"
    },
    {
        "primary_street_suffix_name": "CORNERS",
        "commonly_used_street_suffix_or_abbreviation": [
            "CORNERS",
            "CORS"
        ],
        "postal_service_standard_suffix_abbreviation": "CORS"
    },
    {
        "primary_street_suffix_name": "COURSE",
        "commonly_used_street_suffix_or_abbreviation": [
            "COURSE",
            "CRSE"
        ],
        "postal_service_standard_suffix_abbreviation": "CRSE"
    },
    {
        "primary_street_suffix_name": "COURT",
        "commonly_used_street_suffix_or_abbreviation": [
            "COURT",
            "CT"
        ],
        "postal_service_standard_suffix_abbreviation": "CT"
    },
    {
        "primary_street_suffix_name": "COURTS",
        "commonly_used_street_suffix_or_abbreviation": [
            "COURTS",
            "CTS"
        ],
        "postal_service_standard_suffix_abbreviation": "CTS"
    },
    {
        "primary_street_suffix_name": "COVE",
        "commonly_used_street_suffix_or_abbreviation": [
            "COVE",
            "CV"
        ],
        "postal_service_standard_suffix_abbreviation": "CV"
    },
    {
        "primary_street_suffix_name": "COVES",
        "commonly_used_street_suffix_or_abbreviation": [
            "COVES"
        ],
        "postal_service_standard_suffix_abbreviation": "CVS"
    },
    {
        "primary_street_suffix_name": "CREEK",
        "commonly_used_street_suffix_or_abbreviation": [
            "CREEK",
            "CRK"
        ],
        "postal_service_standard_suffix_abbreviation": "CRK"
    },
    {
        "primary_street_suffix_name": "CRESCENT",
        "commonly_used_street_suffix_or_abbreviation": [
            "CRESCENT",
            "CRES",
            "CRSENT",
            "CRSNT"
        ],
        "postal_service_standard_suffix_abbreviation": "CRES"
    },
    {
        "primary_street_suffix_name": "CREST",
        "commonly_used_street_suffix_or_abbreviation": [
            "CREST"
        ],
        "postal_service_standard_suffix_abbreviation": "CRST"
    },
    {
        "primary_street_suffix_name": "CROSSING",
        "commonly_used_street_suffix_or_abbreviation": [
            "CROSSING",
            "CRSSNG",
            "XING"
        ],
        "postal_service_standard_suffix_abbreviation": "XING"
    },
    {
        "primary_street_suffix_name": "CROSSROAD",
        "commonly_used_street_suffix_or_abbreviation": [
            "CROSSROAD"
        ],
        "postal_service_standard_suffix_abbreviation": "XRD"
    },
    {
        "primary_street_suffix_name": "CROSSROADS",
        "commonly_used_street_suffix_or_abbreviation": [
            "CROSSROADS"
        ],
        "postal_service_standard_suffix_abbreviation": "XRDS"
    },
    {
        "primary_street_suffix_name": "CURVE",
        "commonly_used_street_suffix_or_abbreviation": [
            "CURVE"
        ],
        "postal_service_standard_suffix_abbreviation": "CURV"
    },
    {
        "primary_street_suffix_name": "DALE",
        "commonly_used_street_suffix_or_abbreviation": [
            "DALE",
            "DL"
        ],
        "postal_service_standard_suffix_abbreviation": "DL"
    },
    {
        "primary_street_suffix_name": "DAM",
        "commonly_used_street_suffix_or_abbreviation": [
            "DAM",
            "DM"
        ],
        "postal_service_standard_suffix_abbreviation": "DM"
    },
    {
        "primary_street_suffix_name": "DIVIDE",
        "commonly_used_street_suffix_or_abbreviation": [
            "DIV",
            "DIVIDE",
            "DV",
            "DVD"
        ],
        "postal_service_standard_suffix_abbreviation": "DV"
    },
    {
        "primary_street_suffix_name": "DRIVE",
        "commonly_used_street_suffix_or_abbreviation": [
            "DR",
            "DRIV",
            "DRIVE",
            "DRV"
        ],
        "postal_service_standard_suffix_abbreviation": "DR"
    },
    {
        "primary_street_suffix_name": "DRIVES",
        "commonly_used_street_suffix_or_abbreviation": [
            "DRIVES"
        ],
        "postal_service_standard_suffix_abbreviation": "DRS"
    },
    {
        "primary_street_suffix_name": "ESTATE",
        "commonly_used_street_suffix_or_abbreviation": [
            "EST",
            "ESTATE"
        ],
        "postal_service_standard_suffix_abbreviation": "EST"
    },
    {
        "primary_street_suffix_name": "ESTATES",
        "commonly_used_street_suffix_or_abbreviation": [
            "ESTATES",
            "ESTS"
        ],
        "postal_service_standard_suffix_abbreviation": "ESTS"
    },
    {
        "primary_street_suffix_name": "EXPRESSWAY",
        "commonly_used_street_suffix_or_abbreviation": [
            "EXP",
            "EXPR",
            "EXPRESS",
            "EXPRESSWAY",
            "EXPW",
            "EXPY"
        ],
        "postal_service_standard_suffix_abbreviation": "EXPY"
    },
    {
        "primary_street_suffix_name": "EXTENSION",
        "commonly_used_street_suffix_or_abbreviation": [
            "EXT",
            "EXTENSION",
            "EXTN",
            "EXTNSN"
        ],
        "postal_service_standard_suffix_abbreviation": "EXT"
    },
    {
        "primary_street_suffix_name": "EXTENSIONS",
        "commonly_used_street_suffix_or_abbreviation": [
            "EXTS"
        ],
        "postal_service_standard_suffix_abbreviation": "EXTS"
    },
    {
        "primary_street_suffix_name": "FALL",
        "commonly_used_street_suffix_or_abbreviation": [
            "FALL"
        ],
        "postal_service_standard_suffix_abbreviation": "FALL"
    },
    {
        "primary_street_suffix_name": "FALLS",
        "commonly_used_street_suffix_or_abbreviation": [
            "FALLS",
            "FLS"
        ],
        "postal_service_standard_suffix_abbreviation": "FLS"
    },
    {
        "primary_street_suffix_name": "FERRY",
        "commonly_used_street_suffix_or_abbreviation": [
            "FERRY",
            "FRRY",
            "FRY"
        ],
        "postal_service_standard_suffix_abbreviation": "FRY"
    },
    {
        "primary_street_suffix_name": "FIELD",
        "commonly_used_street_suffix_or_abbreviation": [
            "FIELD",
            "FLD"
        ],
        "postal_service_standard_suffix_abbreviation": "FLD"
    },
    {
        "primary_street_suffix_name": "FIELDS",
        "commonly_used_street_suffix_or_abbreviation": [
            "FIELDS",
            "FLDS"
        ],
        "postal_service_standard_suffix_abbreviation": "FLDS"
    },
    {
        "primary_street_suffix_name": "FLAT",
        "commonly_used_street_suffix_or_abbreviation": [
            "FLAT",
            "FLT"
        ],
        "postal_service_standard_suffix_abbreviation": "FLT"
    },
    {
        "primary_street_suffix_name": "FLATS",
        "commonly_used_street_suffix_or_abbreviation": [
            "FLATS",
            "FLTS"
        ],
        "postal_service_standard_suffix_abbreviation": "FLTS"
    },
    {
        "primary_street_suffix_name": "FORD",
        "commonly_used_street_suffix_or_abbreviation": [
            "FORD",
            "FRD"
        ],
        "postal_service_standard_suffix_abbreviation": "FRD"
    },
    {
        "primary_street_suffix_name": "FORDS",
        "commonly_used_street_suffix_or_abbreviation": [
            "FORDS"
        ],
        "postal_service_standard_suffix_abbreviation": "FRDS"
    },
    {
        "primary_street_suffix_name": "FOREST",
        "commonly_used_street_suffix_or_abbreviation": [
            "FOREST",
            "FORESTS",
            "FRST"
        ],
        "postal_service_standard_suffix_abbreviation": "FRST"
    },
    {
        "primary_street_suffix_name": "FORGE",
        "commonly_used_street_suffix_or_abbreviation": [
            "FORG",
            "FORGE",
            "FRG"
        ],
        "postal_service_standard_suffix_abbreviation": "FRG"
    },
    {
        "primary_street_suffix_name": "FORGES",
        "commonly_used_street_suffix_or_abbreviation": [
            "FORGES"
        ],
        "postal_service_standard_suffix_abbreviation": "FRGS"
    },
    {
        "primary_street_suffix_name": "FORK",
        "commonly_used_street_suffix_or_abbreviation": [
            "FORK",
            "FRK"
        ],
        "postal_service_standard_suffix_abbreviation": "FRK"
    },
    {
        "primary_street_suffix_name": "FORKS",
        "commonly_used_street_suffix_or_abbreviation": [
            "FORKS",
            "FRKS"
        ],
        "postal_service_standard_suffix_abbreviation": "FRKS"
    },
    {
        "primary_street_suffix_name": "FORT",
        "commonly_used_street_suffix_or_abbreviation": [
            "FORT",
            "FRT",
            "FT"
        ],
        "postal_service_standard_suffix_abbreviation": "FT"
    },
    {
        "primary_street_suffix_name": "FREEWAY",
        "commonly_used_street_suffix_or_abbreviation": [
            "FREEWAY",
            "FREEWY",
            "FRWAY",
            "FRWY",
            "FWY"
        ],
        "postal_service_standard_suffix_abbreviation": "FWY"
    },
    {
        "primary_street_suffix_name": "GARDEN",
        "commonly_used_street_suffix_or_abbreviation": [
            "GARDEN",
            "GARDN",
            "GRDEN",
            "GRDN"
        ],
        "postal_service_standard_suffix_abbreviation": "GDN"
    },
    {
        "primary_street_suffix_name": "GARDENS",
        "commonly_used_street_suffix_or_abbreviation": [
            "GARDENS",
            "GDNS",
            "GRDNS"
        ],
        "postal_service_standard_suffix_abbreviation": "GDNS"
    },
    {
        "primary_street_suffix_name": "GATEWAY",
        "commonly_used_street_suffix_or_abbreviation": [
            "GATEWAY",
            "GATEWY",
            "GATWAY",
            "GTWAY",
            "GTWY"
        ],
        "postal_service_standard_suffix_abbreviation": "GTWY"
    },
    {
        "primary_street_suffix_name": "GLEN",
        "commonly_used_street_suffix_or_abbreviation": [
            "GLEN",
            "GLN"
        ],
        "postal_service_standard_suffix_abbreviation": "GLN"
    },
    {
        "primary_street_suffix_name": "GLENS",
        "commonly_used_street_suffix_or_abbreviation": [
            "GLENS"
        ],
        "postal_service_standard_suffix_abbreviation": "GLNS"
    },
    {
        "primary_street_suffix_name": "GREEN",
        "commonly_used_street_suffix_or_abbreviation": [
            "GREEN",
            "GRN"
        ],
        "postal_service_standard_suffix_abbreviation": "GRN"
    },
    {
        "primary_street_suffix_name": "GREENS",
        "commonly_used_street_suffix_or_abbreviation": [
            "GREENS"
        ],
        "postal_service_standard_suffix_abbreviation": "GRNS"
    },
    {
        "primary_street_suffix_name": "GROVE",
        "commonly_used_street_suffix_or_abbreviation": [
            "GROV",
            "GROVE",
            "GRV"
        ],
        "postal_service_standard_suffix_abbreviation": "GRV"
    },
    {
        "primary_street_suffix_name": "GROVES",
        "commonly_used_street_suffix_or_abbreviation": [
            "GROVES"
        ],
        "postal_service_standard_suffix_abbreviation": "GRVS"
    },
    {
        "primary_street_suffix_name": "HARBOR",
        "commonly_used_street_suffix_or_abbreviation": [
            "HARB",
            "HARBOR",
            "HARBR",
            "HBR",
            "HRBOR"
        ],
        "postal_service_standard_suffix_abbreviation": "HBR"
    },
    {
        "primary_street_suffix_name": "HARBORS",
        "commonly_used_street_suffix_or_abbreviation": [
            "HARBORS"
        ],
        "postal_service_standard_suffix_abbreviation": "HBRS"
    },
    {
        "primary_street_suffix_name": "HAVEN",
        "commonly_used_street_suffix_or_abbreviation": [
            "HAVEN",
            "HVN"
        ],
        "postal_service_standard_suffix_abbreviation": "HVN"
    },
    {
        "primary_street_suffix_name": "HEIGHTS",
        "commonly_used_street_suffix_or_abbreviation": [
            "HT",
            "HTS"
        ],
        "postal_service_standard_suffix_abbreviation": "HTS"
    },
    {
        "primary_street_suffix_name": "HIGHWAY",
        "commonly_used_street_suffix_or_abbreviation": [
            "HIGHWAY",
            "HIGHWY",
            "HIWAY",
            "HIWY",
            "HWAY",
            "HWY"
        ],
        "postal_service_standard_suffix_abbreviation": "HWY"
    },
    {
        "primary_street_suffix_name": "HILL",
        "commonly_used_street_suffix_or_abbreviation": [
            "HILL",
            "HL"
        ],
        "postal_service_standard_suffix_abbreviation": "HL"
    },
    {
        "primary_street_suffix_name": "HILLS",
        "commonly_used_street_suffix_or_abbreviation": [
            "HILLS",
            "HLS"
        ],
        "postal_service_standard_suffix_abbreviation": "HLS"
    },
    {
        "primary_street_suffix_name": "HOLLOW",
        "commonly_used_street_suffix_or_abbreviation": [
            "HLLW",
            "HOLLOW",
            "HOLLOWS",
            "HOLW",
            "HOLWS"
        ],
        "postal_service_standard_suffix_abbreviation": "HOLW"
    },
    {
        "primary_street_suffix_name": "INLET",
        "commonly_used_street_suffix_or_abbreviation": [
            "INLT"
        ],
        "postal_service_standard_suffix_abbreviation": "INLT"
    },
    {
        "primary_street_suffix_name": "ISLAND",
        "commonly_used_street_suffix_or_abbreviation": [
            "IS",
            "ISLAND",
            "ISLND"
        ],
        "postal_service_standard_suffix_abbreviation": "IS"
    },
    {
        "primary_street_suffix_name": "ISLANDS",
        "commonly_used_street_suffix_or_abbreviation": [
            "ISLANDS",
            "ISLNDS",
            "ISS"
        ],
        "postal_service_standard_suffix_abbreviation": "ISS"
    },
    {
        "primary_street_suffix_name": "ISLE",
        "commonly_used_street_suffix_or_abbreviation": [
            "ISLE",
            "ISLES"
        ],
        "postal_service_standard_suffix_abbreviation": "ISLE"
    },
    {
        "primary_street_suffix_name": "JUNCTION",
        "commonly_used_street_suffix_or_abbreviation": [
            "JCT",
            "JCTION",
            "JCTN",
            "JUNCTION",
            "JUNCTN",
            "JUNCTON"
        ],
        "postal_service_standard_suffix_abbreviation": "JCT"
    },
    {
        "primary_street_suffix_name": "JUNCTIONS",
        "commonly_used_street_suffix_or_abbreviation": [
            "JCTNS",
            "JCTS",
            "JUNCTIONS"
        ],
        "postal_service_standard_suffix_abbreviation": "JCTS"
    },
    {
        "primary_street_suffix_name": "KEY",
        "commonly_used_street_suffix_or_abbreviation": [
            "KEY",
            "KY"
        ],
        "postal_service_standard_suffix_abbreviation": "KY"
    },
    {
        "primary_street_suffix_name": "KEYS",
        "commonly_used_street_suffix_or_abbreviation": [
            "KEYS",
            "KYS"
        ],
        "postal_service_standard_suffix_abbreviation": "KYS"
    },
    {
        "primary_street_suffix_name": "KNOLL",
        "commonly_used_street_suffix_or_abbreviation": [
            "KNL",
            "KNOL",
            "KNOLL"
        ],
        "postal_service_standard_suffix_abbreviation": "KNL"
    },
    {
        "primary_street_suffix_name": "KNOLLS",
        "commonly_used_street_suffix_or_abbreviation": [
            "KNLS",
            "KNOLLS"
        ],
        "postal_service_standard_suffix_abbreviation": "KNLS"
    },
    {
        "primary_street_suffix_name": "LAKE",
        "commonly_used_street_suffix_or_abbreviation": [
            "LK",
            "LAKE"
        ],
        "postal_service_standard_suffix_abbreviation": "LK"
    },
    {
        "primary_street_suffix_name": "LAKES",
        "commonly_used_street_suffix_or_abbreviation": [
            "LKS",
            "LAKES"
        ],
        "postal_service_standard_suffix_abbreviation": "LKS"
    },
    {
        "primary_street_suffix_name": "LAND",
        "commonly_used_street_suffix_or_abbreviation": [
            "LAND"
        ],
        "postal_service_standard_suffix_abbreviation": "LAND"
    },
    {
        "primary_street_suffix_name": "LANDING",
        "commonly_used_street_suffix_or_abbreviation": [
            "LANDING",
            "LNDG",
            "LNDNG"
        ],
        "postal_service_standard_suffix_abbreviation": "LNDG"
    },
    {
        "primary_street_suffix_name": "LANE",
        "commonly_used_street_suffix_or_abbreviation": [
            "LANE",
            "LN"
        ],
        "postal_service_standard_suffix_abbreviation": "LN"
    },
    {
        "primary_street_suffix_name": "LIGHT",
        "commonly_used_street_suffix_or_abbreviation": [
            "LGT",
            "LIGHT"
        ],
        "postal_service_standard_suffix_abbreviation": "LGT"
    },
    {
        "primary_street_suffix_name": "LIGHTS",
        "commonly_used_street_suffix_or_abbreviation": [
            "LIGHTS"
        ],
        "postal_service_standard_suffix_abbreviation": "LGTS"
    },
    {
        "primary_street_suffix_name": "LOAF",
        "commonly_used_street_suffix_or_abbreviation": [
            "LF",
            "LOAF"
        ],
        "postal_service_standard_suffix_abbreviation": "LF"
    },
    {
        "primary_street_suffix_name": "LOCK",
        "commonly_used_street_suffix_or_abbreviation": [
            "LCK",
            "LOCK"
        ],
        "postal_service_standard_suffix_abbreviation": "LCK"
    },
    {
        "primary_street_suffix_name": "LOCKS",
        "commonly_used_street_suffix_or_abbreviation": [
            "LCKS",
            "LOCKS"
        ],
        "postal_service_standard_suffix_abbreviation": "LCKS"
    },
    {
        "primary_street_suffix_name": "LODGE",
        "commonly_used_street_suffix_or_abbreviation": [
            "LDG",
            "LDGE",
            "LODG",
            "LODGE"
        ],
        "postal_service_standard_suffix_abbreviation": "LDG"
    },
    {
        "primary_street_suffix_name": "LOOP",
        "commonly_used_street_suffix_or_abbreviation": [
            "LOOP",
            "LOOPS"
        ],
        "postal_service_standard_suffix_abbreviation": "LOOP"
    },
    {
        "primary_street_suffix_name": "MALL",
        "commonly_used_street_suffix_or_abbreviation": [
            "MALL"
        ],
        "postal_service_standard_suffix_abbreviation": "MALL"
    },
    {
        "primary_street_suffix_name": "MANOR",
        "commonly_used_street_suffix_or_abbreviation": [
            "MNR",
            "MANOR"
        ],
        "postal_service_standard_suffix_abbreviation": "MNR"
    },
    {
        "primary_street_suffix_name": "MANORS",
        "commonly_used_street_suffix_or_abbreviation": [
            "MANORS",
            "MNRS"
        ],
        "postal_service_standard_suffix_abbreviation": "MNRS"
    },
    {
        "primary_street_suffix_name": "MEADOW",
        "commonly_used_street_suffix_or_abbreviation": [
            "MEADOW"
        ],
        "postal_service_standard_suffix_abbreviation": "MDW"
    },
    {
        "primary_street_suffix_name": "MEADOWS",
        "commonly_used_street_suffix_or_abbreviation": [
            "MDW",
            "MDWS",
            "MEADOWS",
            "MEDOWS"
        ],
        "postal_service_standard_suffix_abbreviation": "MDWS"
    },
    {
        "primary_street_suffix_name": "MEWS",
        "commonly_used_street_suffix_or_abbreviation": [
            "MEWS"
        ],
        "postal_service_standard_suffix_abbreviation": "MEWS"
    },
    {
        "primary_street_suffix_name": "MILL",
        "commonly_used_street_suffix_or_abbreviation": [
            "MILL"
        ],
        "postal_service_standard_suffix_abbreviation": "ML"
    },
    {
        "primary_street_suffix_name": "MILLS",
        "commonly_used_street_suffix_or_abbreviation": [
            "MILLS"
        ],
        "postal_service_standard_suffix_abbreviation": "MLS"
    },
    {
        "primary_street_suffix_name": "MISSION",
        "commonly_used_street_suffix_or_abbreviation": [
            "MISSN",
            "MSSN"
        ],
        "postal_service_standard_suffix_abbreviation": "MSN"
    },
    {
        "primary_street_suffix_name": "MOTORWAY",
        "commonly_used_street_suffix_or_abbreviation": [
            "MOTORWAY"
        ],
        "postal_service_standard_suffix_abbreviation": "MTWY"
    },
    {
        "primary_street_suffix_name": "MOUNT",
        "commonly_used_street_suffix_or_abbreviation": [
            "MNT",
            "MT",
            "MOUNT"
        ],
        "postal_service_standard_suffix_abbreviation": "MT"
    },
    {
        "primary_street_suffix_name": "MOUNTAIN",
        "commonly_used_street_suffix_or_abbreviation": [
            "MNTAIN",
            "MNTN",
            "MOUNTAIN",
            "MOUNTIN",
            "MTIN",
            "MTN"
        ],
        "postal_service_standard_suffix_abbreviation": "MTN"
    },
    {
        "primary_street_suffix_name": "MOUNTAINS",
        "commonly_used_street_suffix_or_abbreviation": [
            "MNTNS",
            "MOUNTAINS"
        ],
        "postal_service_standard_suffix_abbreviation": "MTNS"
    },
    {
        "primary_street_suffix_name": "NECK",
        "commonly_used_street_suffix_or_abbreviation": [
            "NCK",
            "NECK"
        ],
        "postal_service_standard_suffix_abbreviation": "NCK"
    },
    {
        "primary_street_suffix_name": "ORCHARD",
        "commonly_used_street_suffix_or_abbreviation": [
            "ORCH",
            "ORCHARD",
            "ORCHRD"
        ],
        "postal_service_standard_suffix_abbreviation": "ORCH"
    },
    {
        "primary_street_suffix_name": "OVAL",
        "commonly_used_street_suffix_or_abbreviation": [
            "OVAL",
            "OVL"
        ],
        "postal_service_standard_suffix_abbreviation": "OVAL"
    },
    {
        "primary_street_suffix_name": "OVERPASS",
        "commonly_used_street_suffix_or_abbreviation": [
            "OVERPASS"
        ],
        "postal_service_standard_suffix_abbreviation": "OPAS"
    },
    {
        "primary_street_suffix_name": "PARK",
        "commonly_used_street_suffix_or_abbreviation": [
            "PARK",
            "PRK"
        ],
        "postal_service_standard_suffix_abbreviation": "PARK"
    },
    {
        "primary_street_suffix_name": "PARKS",
        "commonly_used_street_suffix_or_abbreviation": [
            "PARKS"
        ],
        "postal_service_standard_suffix_abbreviation": "PARK"
    },
    {
        "primary_street_suffix_name": "PARKWAY",
        "commonly_used_street_suffix_or_abbreviation": [
            "PARKWAY",
            "PARKWY",
            "PKWAY",
            "PKWY",
            "PKY"
        ],
        "postal_service_standard_suffix_abbreviation": "PKWY"
    },
    {
        "primary_street_suffix_name": "PARKWAYS",
        "commonly_used_street_suffix_or_abbreviation": [
            "PARKWAYS",
            "PKWYS"
        ],
        "postal_service_standard_suffix_abbreviation": "PKWY"
    },
    {
        "primary_street_suffix_name": "PASS",
        "commonly_used_street_suffix_or_abbreviation": [
            "PASS"
        ],
        "postal_service_standard_suffix_abbreviation": "PASS"
    },
    {
        "primary_street_suffix_name": "PASSAGE",
        "commonly_used_street_suffix_or_abbreviation": [
            "PASSAGE"
        ],
        "postal_service_standard_suffix_abbreviation": "PSGE"
    },
    {
        "primary_street_suffix_name": "PATH",
        "commonly_used_street_suffix_or_abbreviation": [
            "PATH",
            "PATHS"
        ],
        "postal_service_standard_suffix_abbreviation": "PATH"
    },
    {
        "primary_street_suffix_name": "PIKE",
        "commonly_used_street_suffix_or_abbreviation": [
            "PIKE",
            "PIKES"
        ],
        "postal_service_standard_suffix_abbreviation": "PIKE"
    },
    {
        "primary_street_suffix_name": "PINE",
        "commonly_used_street_suffix_or_abbreviation": [
            "PINE"
        ],
        "postal_service_standard_suffix_abbreviation": "PNE"
    },
    {
        "primary_street_suffix_name": "PINES",
        "commonly_used_street_suffix_or_abbreviation": [
            "PINES",
            "PNES"
        ],
        "postal_service_standard_suffix_abbreviation": "PNES"
    },
    {
        "primary_street_suffix_name": "PLACE",
        "commonly_used_street_suffix_or_abbreviation": [
            "PL"
        ],
        "postal_service_standard_suffix_abbreviation": "PL"
    },
    {
        "primary_street_suffix_name": "PLAIN",
        "commonly_used_street_suffix_or_abbreviation": [
            "PLAIN",
            "PLN"
        ],
        "postal_service_standard_suffix_abbreviation": "PLN"
    },
    {
        "primary_street_suffix_name": "PLAINS",
        "commonly_used_street_suffix_or_abbreviation": [
            "PLAINS",
            "PLNS"
        ],
        "postal_service_standard_suffix_abbreviation": "PLNS"
    },
    {
        "primary_street_suffix_name": "PLAZA",
        "commonly_used_street_suffix_or_abbreviation": [
            "PLAZA",
            "PLZ",
            "PLZA"
        ],
        "postal_service_standard_suffix_abbreviation": "PLZ"
    },
    {
        "primary_street_suffix_name": "POINT",
        "commonly_used_street_suffix_or_abbreviation": [
            "POINT",
            "PT"
        ],
        "postal_service_standard_suffix_abbreviation": "PT"
    },
    {
        "primary_street_suffix_name": "POINTS",
        "commonly_used_street_suffix_or_abbreviation": [
            "POINTS",
            "PTS"
        ],
        "postal_service_standard_suffix_abbreviation": "PTS"
    },
    {
        "primary_street_suffix_name": "PORT",
        "commonly_used_street_suffix_or_abbreviation": [
            "PORT",
            "PRT"
        ],
        "postal_service_standard_suffix_abbreviation": "PRT"
    },
    {
        "primary_street_suffix_name": "PORTS",
        "commonly_used_street_suffix_or_abbreviation": [
            "PORTS",
            "PRTS"
        ],
        "postal_service_standard_suffix_abbreviation": "PRTS"
    },
    {
        "primary_street_suffix_name": "PRAIRIE",
        "commonly_used_street_suffix_or_abbreviation": [
            "PR",
            "PRAIRIE",
            "PRR"
        ],
        "postal_service_standard_suffix_abbreviation": "PR"
    },
    {
        "primary_street_suffix_name": "RADIAL",
        "commonly_used_street_suffix_or_abbreviation": [
            "RAD",
            "RADIAL",
            "RADIEL",
            "RADL"
        ],
        "postal_service_standard_suffix_abbreviation": "RADL"
    },
    {
        "primary_street_suffix_name": "RAMP",
        "commonly_used_street_suffix_or_abbreviation": [
            "RAMP"
        ],
        "postal_service_standard_suffix_abbreviation": "RAMP"
    },
    {
        "primary_street_suffix_name": "RANCH",
        "commonly_used_street_suffix_or_abbreviation": [
            "RANCH",
            "RANCHES",
            "RNCH",
            "RNCHS"
        ],
        "postal_service_standard_suffix_abbreviation": "RNCH"
    },
    {
        "primary_street_suffix_name": "RAPID",
        "commonly_used_street_suffix_or_abbreviation": [
            "RAPID",
            "RPD"
        ],
        "postal_service_standard_suffix_abbreviation": "RPD"
    },
    {
        "primary_street_suffix_name": "RAPIDS",
        "commonly_used_street_suffix_or_abbreviation": [
            "RAPIDS",
            "RPDS"
        ],
        "postal_service_standard_suffix_abbreviation": "RPDS"
    },
    {
        "primary_street_suffix_name": "REST",
        "commonly_used_street_suffix_or_abbreviation": [
            "REST",
            "RST"
        ],
        "postal_service_standard_suffix_abbreviation": "RST"
    },
    {
        "primary_street_suffix_name": "RIDGE",
        "commonly_used_street_suffix_or_abbreviation": [
            "RDG",
            "RDGE",
            "RIDGE"
        ],
        "postal_service_standard_suffix_abbreviation": "RDG"
    },
    {
        "primary_street_suffix_name": "RIDGES",
        "commonly_used_street_suffix_or_abbreviation": [
            "RDGS",
            "RIDGES"
        ],
        "postal_service_standard_suffix_abbreviation": "RDGS"
    },
    {
        "primary_street_suffix_name": "RIVER",
        "commonly_used_street_suffix_or_abbreviation": [
            "RIV",
            "RIVER",
            "RVR",
            "RIVR"
        ],
        "postal_service_standard_suffix_abbreviation": "RIV"
    },
    {
        "primary_street_suffix_name": "ROAD",
        "commonly_used_street_suffix_or_abbreviation": [
            "RD",
            "ROAD"
        ],
        "postal_service_standard_suffix_abbreviation": "RD"
    },
    {
        "primary_street_suffix_name": "ROADS",
        "commonly_used_street_suffix_or_abbreviation": [
            "ROADS",
            "RDS"
        ],
        "postal_service_standard_suffix_abbreviation": "RDS"
    },
    {
        "primary_street_suffix_name": "ROUTE",
        "commonly_used_street_suffix_or_abbreviation": [
            "ROUTE"
        ],
        "postal_service_standard_suffix_abbreviation": "RTE"
    },
    {
        "primary_street_suffix_name": "ROW",
        "commonly_used_street_suffix_or_abbreviation": [
            "ROW"
        ],
        "postal_service_standard_suffix_abbreviation": "ROW"
    },
    {
        "primary_street_suffix_name": "RUE",
        "commonly_used_street_suffix_or_abbreviation": [
            "RUE"
        ],
        "postal_service_standard_suffix_abbreviation": "RUE"
    },
    {
        "primary_street_suffix_name": "RUN",
        "commonly_used_street_suffix_or_abbreviation": [
            "RUN"
        ],
        "postal_service_standard_suffix_abbreviation": "RUN"
    },
    {
        "primary_street_suffix_name": "SHOAL",
        "commonly_used_street_suffix_or_abbreviation": [
            "SHL",
            "SHOAL"
        ],
        "postal_service_standard_suffix_abbreviation": "SHL"
    },
    {
        "primary_street_suffix_name": "SHOALS",
        "commonly_used_street_suffix_or_abbreviation": [
            "SHLS",
            "SHOALS"
        ],
        "postal_service_standard_suffix_abbreviation": "SHLS"
    },
    {
        "primary_street_suffix_name": "SHORE",
        "commonly_used_street_suffix_or_abbreviation": [
            "SHOAR",
            "SHORE",
            "SHR"
        ],
        "postal_service_standard_suffix_abbreviation": "SHR"
    },
    {
        "primary_street_suffix_name": "SHORES",
        "commonly_used_street_suffix_or_abbreviation": [
            "SHOARS",
            "SHORES",
            "SHRS"
        ],
        "postal_service_standard_suffix_abbreviation": "SHRS"
    },
    {
        "primary_street_suffix_name": "SKYWAY",
        "commonly_used_street_suffix_or_abbreviation": [
            "SKYWAY"
        ],
        "postal_service_standard_suffix_abbreviation": "SKWY"
    },
    {
        "primary_street_suffix_name": "SPRING",
        "commonly_used_street_suffix_or_abbreviation": [
            "SPG",
            "SPNG",
            "SPRING",
            "SPRNG"
        ],
        "postal_service_standard_suffix_abbreviation": "SPG"
    },
    {
        "primary_street_suffix_name": "SPRINGS",
        "commonly_used_street_suffix_or_abbreviation": [
            "SPGS",
            "SPNGS",
            "SPRINGS",
            "SPRNGS"
        ],
        "postal_service_standard_suffix_abbreviation": "SPGS"
    },
    {
        "primary_street_suffix_name": "SPUR",
        "commonly_used_street_suffix_or_abbreviation": [
            "SPUR"
        ],
        "postal_service_standard_suffix_abbreviation": "SPUR"
    },
    {
        "primary_street_suffix_name": "SPURS",
        "commonly_used_street_suffix_or_abbreviation": [
            "SPURS"
        ],
        "postal_service_standard_suffix_abbreviation": "SPUR"
    },
    {
        "primary_street_suffix_name": "SQUARE",
        "commonly_used_street_suffix_or_abbreviation": [
            "SQ",
            "SQR",
            "SQRE",
            "SQU",
            "SQUARE"
        ],
        "postal_service_standard_suffix_abbreviation": "SQ"
    },
    {
        "primary_street_suffix_name": "SQUARES",
        "commonly_used_street_suffix_or_abbreviation": [
            "SQRS",
            "SQUARES"
        ],
        "postal_service_standard_suffix_abbreviation": "SQS"
    },
    {
        "primary_street_suffix_name": "STATION",
        "commonly_used_street_suffix_or_abbreviation": [
            "STA",
            "STATION",
            "STATN",
            "STN"
        ],
        "postal_service_standard_suffix_abbreviation": "STA"
    },
    {
        "primary_street_suffix_name": "STRAVENUE",
        "commonly_used_street_suffix_or_abbreviation": [
            "STRA",
            "STRAV",
            "STRAVEN",
            "STRAVENUE",
            "STRAVN",
            "STRVN",
            "STRVNUE"
        ],
        "postal_service_standard_suffix_abbreviation": "STRA"
    },
    {
        "primary_street_suffix_name": "STREAM",
        "commonly_used_street_suffix_or_abbreviation": [
            "STREAM",
            "STREME",
            "STRM"
        ],
        "postal_service_standard_suffix_abbreviation": "STRM"
    },
    {
        "primary_street_suffix_name": "STREET",
        "commonly_used_street_suffix_or_abbreviation": [
            "STREET",
            "STRT",
            "ST",
            "STR"
        ],
        "postal_service_standard_suffix_abbreviation": "ST"
    },
    {
        "primary_street_suffix_name": "STREETS",
        "commonly_used_street_suffix_or_abbreviation": [
            "STREETS"
        ],
        "postal_service_standard_suffix_abbreviation": "STS"
    },
    {
        "primary_street_suffix_name": "SUMMIT",
        "commonly_used_street_suffix_or_abbreviation": [
            "SMT",
            "SUMIT",
            "SUMITT",
            "SUMMIT"
        ],
        "postal_service_standard_suffix_abbreviation": "SMT"
    },
    {
        "primary_street_suffix_name": "TERRACE",
        "commonly_used_street_suffix_or_abbreviation": [
            "TER",
            "TERR",
            "TERRACE"
        ],
        "postal_service_standard_suffix_abbreviation": "TER"
    },
    {
        "primary_street_suffix_name": "THROUGHWAY",
        "commonly_used_street_suffix_or_abbreviation": [
            "THROUGHWAY"
        ],
        "postal_service_standard_suffix_abbreviation": "TRWY"
    },
    {
        "primary_street_suffix_name": "TRACE",
        "commonly_used_street_suffix_or_abbreviation": [
            "TRACE",
            "TRACES",
            "TRCE"
        ],
        "postal_service_standard_suffix_abbreviation": "TRCE"
    },
    {
        "primary_street_suffix_name": "TRACK",
        "commonly_used_street_suffix_or_abbreviation": [
            "TRACK",
            "TRACKS",
            "TRAK",
            "TRK",
            "TRKS"
        ],
        "postal_service_standard_suffix_abbreviation": "TRAK"
    },
    {
        "primary_street_suffix_name": "TRAFFICWAY",
        "commonly_used_street_suffix_or_abbreviation": [
            "TRAFFICWAY"
        ],
        "postal_service_standard_suffix_abbreviation": "TRFY"
    },
    {
        "primary_street_suffix_name": "TRAIL",
        "commonly_used_street_suffix_or_abbreviation": [
            "TRAIL",
            "TRAILS",
            "TRL",
            "TRLS"
        ],
        "postal_service_standard_suffix_abbreviation": "TRL"
    },
    {
        "primary_street_suffix_name": "TRAILER",
        "commonly_used_street_suffix_or_abbreviation": [
            "TRAILER",
            "TRLR",
            "TRLRS"
        ],
        "postal_service_standard_suffix_abbreviation": "TRLR"
    },
    {
        "primary_street_suffix_name": "TUNNEL",
        "commonly_used_street_suffix_or_abbreviation": [
            "TUNEL",
            "TUNL",
            "TUNLS",
            "TUNNEL",
            "TUNNELS",
            "TUNNL"
        ],
        "postal_service_standard_suffix_abbreviation": "TUNL"
    },
    {
        "primary_street_suffix_name": "TURNPIKE",
        "commonly_used_street_suffix_or_abbreviation": [
            "TRNPK",
            "TURNPIKE",
            "TURNPK"
        ],
        "postal_service_standard_suffix_abbreviation": "TPKE"
    },
    {
        "primary_street_suffix_name": "UNDERPASS",
        "commonly_used_street_suffix_or_abbreviation": [
            "UNDERPASS"
        ],
        "postal_service_standard_suffix_abbreviation": "UPAS"
    },
    {
        "primary_street_suffix_name": "UNION",
        "commonly_used_street_suffix_or_abbreviation": [
            "UN",
            "UNION"
        ],
        "postal_service_standard_suffix_abbreviation": "UN"
    },
    {
        "primary_street_suffix_name": "UNIONS",
        "commonly_used_street_suffix_or_abbreviation": [
            "UNIONS"
        ],
        "postal_service_standard_suffix_abbreviation": "UNS"
    },
    {
        "primary_street_suffix_name": "VALLEY",
        "commonly_used_street_suffix_or_abbreviation": [
            "VALLEY",
            "VALLY",
            "VLLY",
            "VLY"
        ],
        "postal_service_standard_suffix_abbreviation": "VLY"
    },
    {
        "primary_street_suffix_name": "VALLEYS",
        "commonly_used_street_suffix_or_abbreviation": [
            "VALLEYS",
            "VLYS"
        ],
        "postal_service_standard_suffix_abbreviation": "VLYS"
    },
    {
        "primary_street_suffix_name": "VIADUCT",
        "commonly_used_street_suffix_or_abbreviation": [
            "VDCT",
            "VIA",
            "VIADCT",
            "VIADUCT"
        ],
        "postal_service_standard_suffix_abbreviation": "VIA"
    },
    {
        "primary_street_suffix_name": "VIEW",
        "commonly_used_street_suffix_or_abbreviation": [
            "VIEW",
            "VW"
        ],
        "postal_service_standard_suffix_abbreviation": "VW"
    },
    {
        "primary_street_suffix_name": "VIEWS",
        "commonly_used_street_suffix_or_abbreviation": [
            "VIEWS",
            "VWS"
        ],
        "postal_service_standard_suffix_abbreviation": "VWS"
    },
    {
        "primary_street_suffix_name": "VILLAGE",
        "commonly_used_street_suffix_or_abbreviation": [
            "VILL",
            "VILLAG",
            "VILLAGE",
            "VILLG",
            "VILLIAGE",
            "VLG"
        ],
        "postal_service_standard_suffix_abbreviation": "VLG"
    },
    {
        "primary_street_suffix_name": "VILLAGES",
        "commonly_used_street_suffix_or_abbreviation": [
            "VILLAGES",
            "VLGS"
        ],
        "postal_service_standard_suffix_abbreviation": "VLGS"
    },
    {
        "primary_street_suffix_name": "VILLE",
        "commonly_used_street_suffix_or_abbreviation": [
            "VILLE",
            "VL"
        ],
        "postal_service_standard_suffix_abbreviation": "VL"
    },
    {
        "primary_street_suffix_name": "VISTA",
        "commonly_used_street_suffix_or_abbreviation": [
            "VIS",
            "VIST",
            "VISTA",
            "VST",
            "VSTA"
        ],
        "postal_service_standard_suffix_abbreviation": "VIS"
    },
    {
        "primary_street_suffix_name": "WALK",
        "commonly_used_street_suffix_or_abbreviation": [
            "WALK"
        ],
        "postal_service_standard_suffix_abbreviation": "WALK"
    },
    {
        "primary_street_suffix_name": "WALKS",
        "commonly_used_street_suffix_or_abbreviation": [
            "WALKS"
        ],
        "postal_service_standard_suffix_abbreviation": "WALK"
    },
    {
        "primary_street_suffix_name": "WALL",
        "commonly_used_street_suffix_or_abbreviation": [
            "WALL"
        ],
        "postal_service_standard_suffix_abbreviation": "WALL"
    },
    {
        "primary_street_suffix_name": "WAY",
        "commonly_used_street_suffix_or_abbreviation": [
            "WY",
            "WAY"
        ],
        "postal_service_standard_suffix_abbreviation": "WAY"
    },
    {
        "primary_street_suffix_name": "WAYS",
        "commonly_used_street_suffix_or_abbreviation": [
            "WAYS"
        ],
        "postal_service_standard_suffix_abbreviation": "WAYS"
    },
    {
        "primary_street_suffix_name": "WELL",
        "commonly_used_street_suffix_or_abbreviation": [
            "WELL"
        ],
        "postal_service_standard_suffix_abbreviation": "WL"
    },
    {
        "primary_street_suffix_name": "WELLS",
        "commonly_used_street_suffix_or_abbreviation": [
            "WELLS",
            "WLS"
        ],
        "postal_service_standard_suffix_abbreviation": "WLS"
    }
]

type_mapping = {}
for suffix in usps_street_suffix_abbreviations:
    for perm in suffix['commonly_used_street_suffix_or_abbreviation']:
        type_mapping[perm.lower()] = suffix['postal_service_standard_suffix_abbreviation'].lower()

directional_mapping = {
    "north": "n",
    "n": "n",
    "east": "e",
    "e": "e",
    "south": "s",
    "s": "s",
    "west": "w",
    "w": "w",
    "northeast": "ne",
    "ne": "ne",
    "southeast": "se",
    "se": "se",
    "southwest": "sw",
    "sw": "sw",
    "northwest": "nw",
    "nw": "nw",
}

# Intentionally omits secondary addresses, occupancy information, etc.
relevant_tags = set(
    ['AddressNumber', 'AddressNumberPrefix', 'AddressNumberSuffix', 'StreetName', 'StreetNamePreDirectional',
     'StreetNamePreModifier', 'StreetNamePreType', 'StreetNamePostDirectional', 'StreetNamePostModifier',
     'StreetNamePostType'])

directional_tags = set(['StreetNamePreDirectional', 'StreetNamePostDirectional'])
type_tags = set(['StreetNamePreType', 'StreetNamePostType'])


def _standardize_address(address: str):
    parsed = usaddress.parse(address)
    standardized_address = []

    for address_part in parsed:
        part_string = address_part[0]
        part_tag = address_part[1]
        standardized_part = part_string.lower()
        if not part_tag in relevant_tags:
            continue

        if part_tag in directional_tags:
            # Strips non-alphabet characters and makes lowercase
            stripped_directional_part_tag = "".join(filter(str.isalpha, part_string)).lower()
            if stripped_directional_part_tag in directional_mapping:
                standardized_part = directional_mapping[stripped_directional_part_tag]
            else:
                standardized_part = stripped_directional_part_tag
        elif part_tag in type_tags:
            stripped_type_part_tag = "".join(filter(str.isalpha, part_string)).lower()
            if stripped_type_part_tag in type_mapping:
                standardized_part = type_mapping[stripped_type_part_tag]
            else:
                standardized_part = stripped_type_part_tag

        standardized_address.append(standardized_part)

    if standardized_address == "":
        return address
    else:
        return ' '.join(standardized_address)


def _evictions_address_concat_standardize(address, city):
    if pd.isna(address):
        address = ''
    if pd.isna(city):
        city = ''
    full_address = ' '.join([address, city])
    try:
        return _standardize_address(full_address)
    except:
        return address.lower()


def _convert_filedate(fileDate):
    parts = fileDate.split('/')
    month, day, year = parts
    padded_year = year if len(year) == 4 else f"20{year}"
    padded_month = month if len(month) == 2 else f"0{month}"
    padded_day = day if len(day) == 2 else f"0{day}"
    return f"{padded_year}-{padded_month}-{padded_day}"


def transform_eviction_data(df: pd.DataFrame, col_mapper: dict):
    copied = df.copy()
    renamed_df = copied.rename(mapper=col_mapper)
    col_reduced_df = renamed_df[REQUIRED_COLS]

    col_reduced_dropped_df = col_reduced_df.dropna(subset=['caseID', 'defendantAddress1'], how='any')

    deduplicated_df = col_reduced_dropped_df.drop_duplicates(subset=['caseID'], keep='last')

    deduplicated_df_copy = deduplicated_df.copy()

    deduplicated_df_copy['standardizedAddress'] = deduplicated_df.apply(
        lambda row: _evictions_address_concat_standardize(row['defendantAddress1'], row['defendantCity1']), axis=1)
    deduplicated_df_copy['fileDate'] = deduplicated_df.apply(lambda row: _convert_filedate(row['fileDate']), axis=1)

    real_valued_df = deduplicated_df_copy.where(pd.notnull(deduplicated_df_copy), None)

    logging.info(f"Number of records (deduplicated): {real_valued_df.shape[0]}")

    return real_valued_df


def _get_exact_address_matches(db: Session):
    # update_query = """
    #   UPDATE "new-evictions" AS e
    #   SET "caresId" = c.id, location = c.location, "closestCaresDistance" = 0
    #   FROM cares AS c
    #   WHERE e."standardizedAddress" = c."standardizedAddress"
    #   """
    # db.execute(text(update_query))

    relationship_query = """
        INSERT INTO "new-eviction-cares" ("caresId", "evictionId", type)
        SELECT 
            c.id AS "caresId" ,
            e."caseID" AS "evictionId",
            'ADDRESS_MATCH'::relationship_type AS type
        FROM cares AS c 
        INNER JOIN "new-evictions" AS e 
        ON c."standardizedAddress" = e."standardizedAddress"
    """
    db.execute(text(relationship_query))

    select_query = """
        SELECT * 
        FROM "new-evictions" AS e 
        INNER JOIN "new-eviction-cares" AS r 
        ON e."caseID" = r."evictionId"
        WHERE r.type = 'ADDRESS_MATCH';
    """
    exact_matches = pd.read_sql(select_query, db.connection())

    logging.info(f"Number of exact address match records: {exact_matches.shape[0]}")

    return exact_matches


def _parse_city_zip(row):
    original_city = row['defendantCity1']
    tagged = usaddress.tag(original_city)[0]

    # city = tagged.get('PlaceName', np.nan)
    zip_code = tagged.get('ZipCode', np.nan)

    row['city'] = np.nan
    row['state'] = 'GA'
    row['zip'] = zip_code

    return row


def _transform_loc_str_to_geography(row):
    location_str = row['location']
    lon, lat = location_str.split(',')
    return f"POINT({lon} {lat})"


async def _perform_geocode_request(segment: pd.DataFrame, session):
    raw_file_content = bytes(segment.to_csv(lineterminator='\r\n', index=False, header=False), encoding='utf-8')

    data = aiohttp.FormData()
    data.add_field('addressFile',
                   raw_file_content,
                   filename='input.csv',
                   content_type='text/csv')
    data.add_field('benchmark', '4')  # https://geocoding.geo.census.gov/geocoder/benchmarks, current

    async with session.post(url=GEOCODING_API_URL, data=data) as response:
        raw_resp = await response.text()
        output_df = pd.read_csv(StringIO(raw_resp),
                                names=['caseID', 'address', 'match', '_', 'inputAddress', 'location', 'tigerId',
                                       'tigerIdSide'],
                                usecols=['caseID', 'match', 'location'])
        return output_df


async def _geocode_unmatched_eviction_data(unmatched_df: pd.DataFrame):
    unmatched_df.reset_index(drop=True, inplace=True)
    batch_geocode_input_df = unmatched_df[['caseID', 'standardizedAddress', 'defendantCity1']]
    batch_geocode_input_df = batch_geocode_input_df.apply(_parse_city_zip, axis=1)[
        ['caseID', 'standardizedAddress', 'city', 'state', 'zip']]

    segments = batch_geocode_input_df.groupby(batch_geocode_input_df.index // MAX_BATCH_SIZE)

    async with aiohttp.ClientSession() as session:
        batch_geocode_outputs = await asyncio.gather(
            *(_perform_geocode_request(segment, session) for _, segment in segments))
        batch_geocode_output_df = pd.concat(batch_geocode_outputs)

    successful_records = batch_geocode_output_df[batch_geocode_output_df['match'] == 'Match']  # Match, No_Match, Tie

    logger.info(f"Number of successfully geocoded records: {successful_records.shape[0]}")

    successful_records_copy = successful_records.copy()
    successful_records_copy['location'] = successful_records.apply(_transform_loc_str_to_geography, axis=1)

    return successful_records_copy[['caseID', 'location']]


async def _get_proximity_matches(db: Session):
    query = db.query(TempEviction).filter(
        not_(exists().where(TempEviction.__table__.c.standardizedAddress == Cares.standardizedAddress)))
    unmatched_df = pd.read_sql(query.statement, db.connection())

    logger.info(f"Number of total inexact address records: {unmatched_df.shape[0]}")

    successfully_geocoded_evictions = await _geocode_unmatched_eviction_data(unmatched_df)

    db.execute(update(TempEviction), successfully_geocoded_evictions.to_dict('records'))

    # update_query = f"""
    #   UPDATE "new-evictions"
    #   SET "closestCaresDistance" = (
    #       SELECT "new-evictions".location <-> cares.location AS dist
    #       FROM cares
    #       LEFT JOIN "new-eviction-cares" AS r
    #       ON "new-evictions"."caseID" = r."evictionId"
    #       WHERE location IS NOT NULL AND
    #            r."caresId" IS NULL
    #       ORDER BY "new-evictions".location <-> cares.location
    #       LIMIT 1
    #   )
    #   FROM "new-evictions" AS e LEFT JOIN "new-eviction-cares" AS r ON e."caseID" = r."evictionId"
    #   WHERE e.location IS NOT NULL AND r."caresId" IS NOT 'ADDRESS_MATCH'
    #   """
    #
    # db.execute(text(update_query))
    #
    # closest_cares_query = f"""
    #   SELECT * FROM "new-evictions" AS e
    #   WHERE e."caresId" IS NULL AND
    #         e."closestCaresDistance" < {PROXIMITY_RADIUS}
    #   """

    # proximity_matches = pd.read_sql(closest_cares_query, db.connection())

    # return proximity_matches


def _write_temp_eviction_records(db: Session):
    # TODO: Handle duplicate records
    eviction_query = """
      INSERT INTO evictions 
        ("caseID", "fileDate", "plaintiff", "plaintiffAddress", "plaintiffCity", "defendantAddress1", 
        "defendantCity1", "standardizedAddress", location)
      SELECT 
          "caseID", 
          "fileDate", 
          "plaintiff", 
          "plaintiffAddress", 
          "plaintiffCity", 
          "defendantAddress1", 
          "defendantCity1",
          "standardizedAddress", 
          location 
      FROM "new-evictions";
      """

    relationship_query = """
        INSERT INTO "eviction-cares" (type, "evictionId", "caresId")
        SELECT type, "evictionId", "caresId" FROM "new-eviction-cares";
    """

    db.execute(text(eviction_query))
    db.execute(text(relationship_query))

    db.commit()


async def get_matches(db: Session, df: pd.DataFrame):
    TempEviction.__table__.create(db.connection(), checkfirst=True)
    TempRelationship.__table__.create(db.connection(), checkfirst=True)
    db.execute(insert(TempEviction), df.to_dict('records'))

    exact_matches = _get_exact_address_matches(db)
    await _get_proximity_matches(db)

    _write_temp_eviction_records(db)

    return exact_matches
    # return exact_matches, proximity_matches


# This method is computationally expensive
def get_agg_count_by_month(db: Session, counties: List[str], dateFrom: datetime.date | None,
                           dateTo: datetime.date | None):
    county_filter_subquery = ', '.join([f"'{county}'" for county in counties])

    date_filter_subquery = construct_date_filter_subquery(dateFrom, dateTo)
    date_from, date_to = populate_default_dates(dateFrom, dateTo)

    counties_arr_subquery = ', '.join([f"'{county}'" for county in counties])
    counties_select_subquery = ', '.join(
        [f"""SUM(CASE WHEN county = '{county}' THEN count ELSE 0 END) AS "{county}" """ for
         county in counties])

    query = f"""
        WITH months AS (SELECT generate_series(
                                       '{date_from}'::date,
                                       '{date_to}'::date,
                                       '1 month'::interval
                               )::date AS month),
             counties_unnest AS (SELECT unnest(ARRAY [{counties_arr_subquery}]) AS county),
             months_counties AS (SELECT months.month, counties_unnest.county
                                 FROM months
                                          CROSS JOIN counties_unnest),
             evictions_months_counties AS (SELECT e."caseID"                        AS id,
                                                  date_trunc('month', e."fileDate") AS month,
                                                  c."name10"                        AS county
                                           FROM evictions AS e
                                                    LEFT JOIN "eviction-cares" AS ec ON e."caseID" = ec."evictionId"
                                                    LEFT JOIN cares ON ec."caresId" = cares.id
                                                    LEFT JOIN counties AS c
                                                              ON ST_Within(CASE
                                                                               WHEN e.location IS NOT NULL THEN e.location::geometry
                                                                               ELSE cares.location::geometry END,
                                                                           c.geom::geometry)
                                           WHERE (ec.type IS NULL OR ec.type IN ('ADDRESS_MATCH', 'MANUAL_MATCH'))
                                             AND (e.location IS NOT NULL OR cares.location IS NOT NULL)
                                             AND c."name10" IN ({county_filter_subquery})
                                             {date_filter_subquery}),
             pre_one_hot AS (SELECT mc.month AS month, mc.county AS county, COUNT(emc.id) AS count
                             FROM months_counties AS mc
                                      LEFT JOIN evictions_months_counties AS emc
                                                ON mc.month = emc.month AND mc.county = emc.county
                             GROUP BY 1, 2
                             ORDER BY mc.month)
        SELECT to_char(month, 'MM/YY') AS label,
            {counties_select_subquery}
        FROM pre_one_hot
        GROUP BY month;
    """

    cares_records_by_month = pd.read_sql(query, db.connection())
    return cares_records_by_month.to_dict(orient='records')


def get_total_eviction_count(db: Session, counties: List[str], dateFrom: datetime.date | None,
                             dateTo: datetime.date | None):
    date_filter_subquery = construct_date_filter_subquery(dateFrom, dateTo, first_filter=True)
    query = f"""
        SELECT COUNT(e."caseID") AS count
        FROM evictions AS e
        {date_filter_subquery};
    """
    eviction_count = pd.read_sql(query, db.connection())
    return eviction_count['count'].iloc[0].item()
