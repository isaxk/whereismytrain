export type DestinationOrigin = {
	crs: string;
	name: string;
	via: string | null;
};

export type TimeObject = {
	rt: {
		dep: string | null;
		depSource?: 'trust' | 'none';
		arr: string | null;
		arrSource?: 'trust' | 'none';
	};
	plan: {
		dep: string | null;
		arr: string | null;
	};
};

export type Operator = {
	id: string | null;
	name: string;
	color: string;
};

export type Position = 'Arriving' | 'Departing' | 'Departed' | 'Arrived' | 'Cancelled' | null;

export type BoardItem = {
	rid: string;
	uid: string;
	sdd: string;
	destination: DestinationOrigin[];
	origin: DestinationOrigin[];
	times: TimeObject;
	departed: boolean;
	isCancelled: boolean;
	platform: string | null;
	operator: Operator;
	position: Position;
	delay: number | null;
	delayReason: string | null;
	cancelReason: string | null;
};

export type BoardDetails = {
	name: string;
	filterName: string | null;
	notices: Notice[];
};

export enum Severity {
	info = 0,
	minor = 1,
	major = 2,
	severe = 3
}

export type Notice = {
	category: number;
	severity: Severity;
	xhtmlMessage: string;
};

export type Board = {
	services: BoardItem[];
	details: BoardDetails;
};

export type ServiceLocation = {
	crs: string | null;
	tiploc: string;
	isCancelled: boolean;
	isCallingPoint: boolean;
	atd: string | null;
	ata: string | null;
	etd: string | null;
	eta: string | null;
	std: string | null;
	sta: string | null;
};

export type CallingPointOrder =
	| 'origin'
	| 'previous'
	| 'focus'
	| 'filter'
	| 'subsequent'
	| 'further'
	| 'destination'
	| 'post-destination';

export type CallingPoint = {
	crs: string | null;
	tiploc: string;
	times: TimeObject;
	isCancelled: boolean;
	departureCancelled: boolean;
	arrivalCancelled: boolean;
	name: string;
	platform: string | null;
	inDivision: boolean;
	startDivide: boolean;
	endDivide: boolean;
	delay: number | null;
	order: CallingPointOrder;
	departed: boolean;
	arrived: boolean;
};

export type Carriage = {
	coachNumber: string | null;
	serviceClass: 'first' | 'standard';
	toilet: boolean;
	bikeSpace?: boolean;
	quietSpace?: boolean;
	toiletIsAccessible: boolean;
	loading: number | null;
};

export type TrainService = {
	rid: string;
	uid: string;
	sdd: string;
	formedFrom: string | null;
	locations: ServiceLocation[];
	callingPoints: CallingPoint[];
	operator: Operator;
	title: string;
	reasonCode: string | null;
	formation: Carriage[] | null;
	formationLengthOnly: boolean;
	destination: DestinationOrigin[];
};

export type SavedTrain = {
	service: TrainService;
	focusCrs: string;
	filterCrs: string;
	id: string;
	subscriptionId: string | null;
};

export type ServiceLocationWithCoords = ServiceLocation & {
	coords: [number, number];
};

export type MapDataLocationGroup = {
	lineLocations: ServiceLocationWithCoords[];
	trainPosition: [number, number] | null;
	isFormedFromTrain: boolean;
	trainBearing: number | null;
	destination: ServiceLocationWithCoords;
};

export type ServiceMapData = {
	locations: MapDataLocationGroup[];
	tiplocData: {
		tiploc: string;
		coords: [number, number];
	}[];
};
