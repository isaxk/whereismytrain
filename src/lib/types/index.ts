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
	rawTime: string;
	departed: boolean;
	isCancelled: boolean;
	isFilterCancelled: boolean;
	platform: string | null;
	operator: Operator;
	position: Position;
	delay: number | null;
	delayReason: string | null;
	cancelReason: string | null;
};

export type BoardDetails = {
	name: string;
	crs: string;
	filterName: string | null;
	filterCrs: string | null;
	offset: number;
	time: string;
	notices: Notice[];
};

export enum Severity {
	info = 0,
	minor = 1,
	major = 2,
	severe = 3
}
export enum Category {
	Trainservice = 0,
	Station = 1,
	Connectingservice = 2
}

export type Notice = {
	category: Category;
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
	name: string;
	platform: string | null;
	atd: string | null;
	ata: string | null;
	etd: string | null;
	eta: string | null;
	std: string | null;
	sta: string | null;
	inDivision?: boolean;
};

export type CallingPointOrder =
	| 'origin'
	| 'previous'
	| 'focus'
	| 'subsequent'
	| 'filter'
	| 'further'
	| 'post-destination';

export type CallingPoint = {
	crs: string | null;
	tiploc: string;
	times: TimeObject;
	rtDepDate: string | null;
	isCancelled: boolean;
	departureCancelled: boolean;
	arrivalCancelled: boolean;
	name: string;
	platform: string | null;
	inDivision: boolean;
	startDivide: boolean;
	endDivide: boolean;
	startJoin: boolean;
	endJoin: boolean;
	delay: number | null;
	arrivalDelay: number | null;
	order: CallingPointOrder;
	isOrigin: boolean;
	departed: boolean;
	arrived: boolean;
	isDestination: boolean;
	isPostDestination: boolean;
	showTrain: boolean;
};

export type Carriage = {
	coachNumber: string | null;
	serviceClass: 'first' | 'standard';
	toilet: boolean;
	bikeSpace?: boolean;
	quietSpace?: boolean;
	isFrontSection?: boolean;
	toiletIsAccessible: boolean;
	loading: number | null;
};

export type TrainService = {
	rid: string;
	uid: string;
	sdd: string;
	isBus: boolean;
	formedFrom: string | null;
	locations: ServiceLocation[][];
	callingPoints: CallingPoint[];
	operator: Operator;
	isToday: boolean;
	date: string;
	title: string;
	reasonCode: string | null;
	formation: Carriage[] | null;
	formationLengthOnly: boolean;
	destination: DestinationOrigin[];
	category: 'standard' | 'express' | 'sleeper' | 'bus' | 'metro';
};

export type SavedTrain = {
	id: string;
	service: TrainService;
	focusCrs: string;
	filterCrs: string;
	service_id: string;
	subscriptionId: string | null;
	lastRefreshed: number;
	originalArrival: string | null;
};

export type PinnedBoard = {
	fromCrs: string;
	fromName: string;
	toCrs: string | null;
	toName: string | null;
};

export type ServiceLocationWithCoords = ServiceLocation & {
	coords: [number, number];
};

export type MapDataLocationGroup = {
	lineLocations: ServiceLocationWithCoords[];
	trainPosition: [number, number] | null;
	isFormedFromTrain: boolean;
	formedFromId: string | null;
	formedFromOrigin: string | null;
	trainBearing: number | null;
	destination: ServiceLocationWithCoords;
};

export type MapData = ServiceMapData | BoardMapData;

export type ServiceMapData = {
	type: 'service';
	locations: MapDataLocationGroup[];
	tiplocData: {
		crs: string | null;
		tiploc: string;
		coords: [number, number];
	}[];
};

export type BoardMapData = {
	type: 'board';
	from: [number, number];
	to: [number, number] | null;
};
