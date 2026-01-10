/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface ReasonDescription {
	/** @format int32 */
	code?: number;
	lateReason?: string;
	cancReason?: string;
	Xmlns?: XmlSerializerNamespaces;
}

export interface XmlSerializerNamespaces {
	/** @format int32 */
	Count?: number;
}

export interface SourceInstanceName {
	id?: string;
	name?: string;
	Xmlns?: XmlSerializerNamespaces;
}

export interface TOCRefData {
	version?: string;
	TOCList?: TOCName[];
}

export interface TOCName {
	toc?: string;
	value?: string;
}

export interface StationRefData {
	version?: string;
	StationList?: StationName[];
}

export interface StationName {
	crs?: string;
	value?: string;
}

export interface LoadingCategoryRefData {
	version?: string;
	CategoryList?: LoadingCategoryRefDataCategory[];
}

export interface LoadingCategoryRefDataCategory {
	data?: CategoryData[];
	code?: string;
	name?: string;
}

export interface CategoryData {
	typicalDescription?: string;
	expectedDescription?: string;
	definition?: string;
	colour?: string;
	image?: string;
	toc?: string;
}

export interface StationBoard {
	trainServices?: ServiceItem[];
	busServices?: ServiceItem[];
	ferryServices?: ServiceItem[];
	/** @format float */
	qos?: number;
	qosSpecified?: boolean;
	isTruncated?: boolean;
	/** @format date-time */
	generatedAt?: string;
	locationName?: string;
	crs?: string;
	filterLocationName?: string;
	filtercrs?: string;
	filterType?: 'to' | 'from';
	stationManager?: string;
	stationManagerCode?: string;
	nrccMessages?: NRCCMessage[];
	platformsAreHidden?: boolean;
	servicesAreUnavailable?: boolean;
	Xmlns?: XmlSerializerNamespaces;
}

export interface ServiceItem {
	formation?: FormationData;
	origin?: EndPointLocation[];
	destination?: EndPointLocation[];
	currentOrigins?: EndPointLocation[];
	currentDestinations?: EndPointLocation[];
	cancelReason?: ReasonCodeWithLocation;
	delayReason?: ReasonCodeWithLocation;
	category?: string;
	activities?: string;
	/** @format int32 */
	length?: number;
	isReverseFormation?: boolean;
	detachFront?: boolean;
	futureDelay?: boolean;
	futureCancellation?: boolean;
	diversion?: BaseServiceItemDiversion;
	uncertainty?: UncertaintyType;
	affectedBy?: string;
	rid?: string;
	uid?: string;
	trainid?: string;
	rsid?: string;
	/** @format date-time */
	sdd?: string;
	operator?: string;
	operatorCode?: string;
	isPassengerService?: boolean;
	isCharter?: boolean;
	isCancelled?: boolean;
	isCircularRoute?: boolean;
	filterLocationCancelled?: boolean;
	filterLocationOperational?: boolean;
	isOperationalCall?: boolean;

	sta?: string | null;
	staSpecified?: boolean;

	ata?: string | null;
	ataSpecified?: boolean;

	eta?: string | null;
	etaSpecified?: boolean;
	arrivalType?: 'Forecast' | 'Actual' | 'NoLog' | 'Delayed';
	arrivalTypeSpecified?: boolean;
	arrivalSource?: string;
	arrivalSourceInstance?: string;

	std?: string | null;
	stdSpecified?: boolean;

	atd?: string | null;
	atdSpecified?: boolean;

	etd?: string | null;
	etdSpecified?: boolean;
	departureType?: 'Forecast' | 'Actual' | 'NoLog' | 'Delayed';
	departureTypeSpecified?: boolean;
	departureSource?: string;
	departureSourceInstance?: string;
	platform?: string;
	platformIsHidden?: boolean;
	serviceIsSuppressed?: boolean;
	adhocAlerts?: string[];
}

export type NRCCCat =
	| 'Trainservice'
	| 'Station'
	| 'Connectingservices'
	| 'Systemrelated'
	| 'Miscellaneous'
	| 'Priortrains'
	| 'Priorother';

export type NRCCSeverity = 'Normal' | 'Minor' | 'Major' | 'Severe';

export interface NRCCMessage {
	category: NRCCC;
	severity: NRCCSeverity;
	xhtmlMessage?: string;
}

export interface FormationData {
	serviceLoading?: FormationDataServiceLoading;
	coaches?: CoachData[];
	source?: string;
	sourceInstance?: string;
}

export interface EndPointLocation {
	isOperationalEndPoint?: boolean;
	locationName?: string;
	crs?: string;
	tiploc?: string;
	via?: string;
	futureChangeTo?: 'train' | 'bus' | 'ferry';
	futureChangeToSpecified?: boolean;
}

export interface ReasonCodeWithLocation {
	tiploc?: string;
	near?: boolean;
	/** @format int32 */
	value?: number;
}

export interface BaseServiceItemDiversion {
	reason?: ReasonCodeWithLocation;
	divertedVia?: BaseServiceItemDiversionDivertedVia;
	between?: BaseServiceItemDiversionBetween;
	/** @format int32 */
	rerouteDelay?: number;
}

export interface UncertaintyType {
	reason?: ReasonCodeWithLocation;
	status?: 'Delay' | 'Cancellation' | 'Other';
}

export interface FormationDataServiceLoading {
	loadingCategory?: FormationDataServiceLoadingLoadingCategory;
	loadingPercentage?: FormationDataServiceLoadingLoadingPercentage;
}

export interface CoachData {
	coachClass?: string;
	toilet?: ToiletAvailabilityType;
	loading?: CoachDataLoading;
	number?: string;
}

export interface BaseServiceItemDiversionDivertedVia {
	tiploc?: string;
	value?: string;
}

export interface BaseServiceItemDiversionBetween {
	start?: string;
	end?: string;
}

export interface FormationDataServiceLoadingLoadingCategory {
	type?: 'Typical' | 'Expected';
	src?: string;
	srcInst?: string;
	value?: string;
}

export interface FormationDataServiceLoadingLoadingPercentage {
	type?: 'Typical' | 'Expected';
	src?: string;
	srcInst?: string;
	/** @format int32 */
	value?: number;
}

export interface ToiletAvailabilityType {
	status?: 'Unknown' | 'InService' | 'NotInService';
	value?: string;
}

export interface CoachDataLoading {
	source?: string;
	sourceInstance?: string;
	/** @format int32 */
	value?: number;
}

export interface StationBoardWithDetails {
	trainServices?: ServiceItemWithLocations[];
	busServices?: ServiceItemWithLocations[];
	ferryServices?: ServiceItemWithLocations[];
	isTruncated?: boolean;
	/** @format date-time */
	generatedAt?: string;
	locationName?: string;
	crs?: string;
	filterLocationName?: string;
	filtercrs?: string;
	filterType?: 'to' | 'from';
	stationManager?: string;
	stationManagerCode?: string;
	nrccMessages?: NRCCMessage[];
	platformsAreHidden?: boolean;
	servicesAreUnavailable?: boolean;
	Xmlns?: XmlSerializerNamespaces;
}

export interface ServiceItemWithLocations {
	previousLocations?: ServiceItemLocation[];
	subsequentLocations?: ServiceItemLocation[];
	formation?: FormationData;
	origin?: EndPointLocation[];
	destination?: EndPointLocation[];
	currentOrigins?: EndPointLocation[];
	currentDestinations?: EndPointLocation[];
	cancelReason?: ReasonCodeWithLocation;
	delayReason?: ReasonCodeWithLocation;
	category?: string;
	activities?: string;
	/** @format int32 */
	length?: number;
	isReverseFormation?: boolean;
	detachFront?: boolean;
	futureDelay?: boolean;
	futureCancellation?: boolean;
	diversion?: BaseServiceItemDiversion;
	uncertainty?: UncertaintyType;
	affectedBy?: string;
	rid?: string;
	uid?: string;
	trainid?: string;
	rsid?: string;
	/** @format date-time */
	sdd?: string;
	operator?: string;
	operatorCode?: string;
	isPassengerService?: boolean;
	isCharter?: boolean;
	isCancelled?: boolean;
	isCircularRoute?: boolean;
	filterLocationCancelled?: boolean;
	filterLocationOperational?: boolean;
	isOperationalCall?: boolean;
	/** @format date-time */
	sta?: string;
	staSpecified?: boolean;
	/** @format date-time */
	ata?: string;
	ataSpecified?: boolean;
	/** @format date-time */
	eta?: string;
	etaSpecified?: boolean;
	arrivalType?: 'Forecast' | 'Actual' | 'NoLog' | 'Delayed';
	arrivalTypeSpecified?: boolean;
	arrivalSource?: string;
	arrivalSourceInstance?: string;
	/** @format date-time */
	std?: string;
	stdSpecified?: boolean;
	/** @format date-time */
	atd?: string;
	atdSpecified?: boolean;
	/** @format date-time */
	etd?: string;
	etdSpecified?: boolean;
	departureType?: 'Forecast' | 'Actual' | 'NoLog' | 'Delayed';
	departureTypeSpecified?: boolean;
	departureSource?: string;
	departureSourceInstance?: string;
	platform?: string;
	platformIsHidden?: boolean;
	serviceIsSuppressed?: boolean;
	adhocAlerts?: string[];
}

export interface ServiceItemLocation {
	cancelReason?: ReasonCodeWithLocation;
	delayReason?: ReasonCodeWithLocation;
	locationName?: string;
	tiploc?: string;
	crs?: string;
	isOperational?: boolean;
	isPass?: boolean;
	isCancelled?: boolean;
	platform?: string;
	platformIsHidden?: boolean;
	serviceIsSuppressed?: boolean;
	/** @format date-time */
	sta?: string;
	staSpecified?: boolean;
	/** @format date-time */
	ata?: string;
	ataSpecified?: boolean;
	/** @format date-time */
	eta?: string;
	etaSpecified?: boolean;
	arrivalType?: 'Forecast' | 'Actual' | 'NoLog' | 'Delayed';
	arrivalTypeSpecified?: boolean;
	arrivalSource?: string;
	arrivalSourceInstance?: string;
	/** @format date-time */
	std?: string;
	stdSpecified?: boolean;
	/** @format date-time */
	atd?: string;
	atdSpecified?: boolean;
	/** @format date-time */
	etd?: string;
	etdSpecified?: boolean;
	departureType?: 'Forecast' | 'Actual' | 'NoLog' | 'Delayed';
	departureTypeSpecified?: boolean;
	departureSource?: string;
	departureSourceInstance?: string;
	lateness?: string;
	associations?: Association[];
	adhocAlerts?: string[];
}

export interface Association {
	category?: 'join' | 'divide' | 'LinkFrom' | 'LinkTo' | 'next' | number;
	rid?: string;
	uid?: string;
	trainid?: string;
	rsid?: string;
	/** @format date-time */
	sdd?: string;
	origin?: string;
	originCRS?: string;
	originTiploc?: string;
	destination?: string;
	destCRS?: string;
	destTiploc?: string;
	isCancelled?: boolean;
}

export interface DeparturesBoard {
	departures?: DepartureItem[];
	/** @format date-time */
	generatedAt?: string;
	locationName?: string;
	crs?: string;
	filterLocationName?: string;
	filtercrs?: string;
	filterType?: 'to' | 'from';
	stationManager?: string;
	stationManagerCode?: string;
	nrccMessages?: NRCCMessage[];
	platformsAreHidden?: boolean;
	servicesAreUnavailable?: boolean;
	Xmlns?: XmlSerializerNamespaces;
}

export interface DepartureItem {
	service?: ServiceItem;
	crs?: string;
}

export interface DeparturesBoardWithDetails {
	departures?: DepartureItemWithLocations[];
	/** @format date-time */
	generatedAt?: string;
	locationName?: string;
	crs?: string;
	filterLocationName?: string;
	filtercrs?: string;
	filterType?: 'to' | 'from';
	stationManager?: string;
	stationManagerCode?: string;
	nrccMessages?: NRCCMessage[];
	platformsAreHidden?: boolean;
	servicesAreUnavailable?: boolean;
	Xmlns?: XmlSerializerNamespaces;
}

export interface DepartureItemWithLocations {
	service?: ServiceItemWithLocations;
	crs?: string;
}

export interface ServiceDetails {
	id: string;
	locations?: ServiceLocation[];
	formation?: LocFormationData[];
	cancelReason?: ReasonCodeWithLocation;
	delayReason?: ReasonCodeWithLocation;
	category?: string;
	isReverseFormation?: boolean;
	divertedVia?: BaseServiceDetailsDivertedVia;
	diversionReason?: ReasonCodeWithLocation;
	/** @format date-time */
	generatedAt?: string;
	rid?: string;
	uid?: string;
	trainid?: string;
	rsid?: string;
	/** @format date-time */
	sdd?: string;
	operator?: string;
	operatorCode?: string;
	serviceType?: 'train' | 'bus' | 'ferry' | number;
	isPassengerService?: boolean;
	isCharter?: boolean;
	Xmlns?: XmlSerializerNamespaces;
}

export interface ServiceLocation {
	cancelReason?: ReasonCodeWithLocation;
	delayReason?: ReasonCodeWithLocation;
	affectedByDiversion?: boolean;
	/** @format int32 */
	rerouteDelay?: number;
	uncertainty?: UncertaintyType;
	affectedBy?: string;
	locationName?: string;
	tiploc?: string;
	crs?: string;
	associations?: Association[];
	adhocAlerts?: string[];
	activities?: string;
	/** @format int32 */
	length?: number;
	detachFront?: boolean;
	isOperational?: boolean;
	isPass?: boolean;
	isCancelled?: boolean;
	falseDest?: string;
	fdTiploc?: string;
	platform?: string;
	platformIsHidden?: boolean;
	serviceIsSuppressed?: boolean;
	/** @format date-time */
	sta?: string | null;
	staSpecified?: boolean;
	/** @format date-time */
	ata?: string | null;
	ataSpecified?: boolean;
	/** @format date-time */
	eta?: string | null;
	etaSpecified?: boolean;
	arrivalType?: 'Forecast' | 'Actual' | 'NoLog' | 'Delayed';
	arrivalTypeSpecified?: boolean;
	arrivalSource?: string;
	arrivalSourceInstance?: string;
	/** @format date-time */
	std?: string | null;
	stdSpecified?: boolean;
	/** @format date-time */
	atd?: string | null;
	atdSpecified?: boolean;
	/** @format date-time */
	etd?: string | null;
	etdSpecified?: boolean;
	departureType?: 'Forecast' | 'Actual' | 'NoLog' | 'Delayed';
	departureTypeSpecified?: boolean;
	departureSource?: string;
	departureSourceInstance?: string;
	lateness?: string;
	Xmlns?: XmlSerializerNamespaces;
}

export interface LocFormationData {
	tiploc?: string;
	serviceLoading?: FormationDataServiceLoading;
	coaches?: CoachData[];
	source?: string;
	sourceInstance?: string;
}

export interface BaseServiceDetailsDivertedVia {
	tiploc?: string;
	value?: string;
}

export interface ServiceList {
	/** @format date-time */
	scheduleStartDate?: string;
	serviceList?: ServiceListItem[];
	Xmlns?: XmlSerializerNamespaces;
}

export interface ServiceListItem {
	rid?: string;
	uid?: string;
	trainid?: string;
	rsid?: string;
	originName?: string;
	originCrs?: string;
	destinationName?: string;
	destinationCrs?: string;
	/** @format date-time */
	scheduledDeparture?: string;
	/** @format date-time */
	scheduledArrival?: string;
}

export interface DisruptionItem {
	/** @format date-time */
	generatedAt?: string;
	crs?: string;
	disruptions?: DisruptionMessage[];
	Xmlns?: XmlSerializerNamespaces;
}

export interface DisruptionMessage {
	/** @format int32 */
	id?: number;
	category?:
		| 'Train service'
		| 'Station'
		| 'Connecting services'
		| 'System related'
		| 'Miscellaneous'
		| 'Prior (trains)'
		| 'Prior (other)';
	severity?: 'Normal' | 'Minor' | 'Major' | 'Severe';
	isSuppressed?: boolean;
	xhtmlMessage?: string;
	description?: string;
}

export type QueryParamsType = Record<string | number, any>;
export type ResponseFormat = keyof Omit<Body, 'body' | 'bodyUsed'>;

export interface FullRequestParams extends Omit<RequestInit, 'body'> {
	/** set parameter to `true` for call `securityWorker` for this request */
	secure?: boolean;
	/** request path */
	path: string;
	/** content type of request body */
	type?: ContentType;
	/** query params */
	query?: QueryParamsType;
	/** format of response (i.e. response.json() -> format: "json") */
	format?: ResponseFormat;
	/** request body */
	body?: unknown;
	/** base url */
	baseUrl?: string;
	/** request cancellation token */
	cancelToken?: CancelToken;
}

export type RequestParams = Omit<FullRequestParams, 'body' | 'method' | 'query' | 'path'>;

export interface ApiConfig<SecurityDataType = unknown> {
	baseUrl?: string;
	baseApiParams?: Omit<RequestParams, 'baseUrl' | 'cancelToken' | 'signal'>;
	securityWorker?: (
		securityData: SecurityDataType | null
	) => Promise<RequestParams | void> | RequestParams | void;
	customFetch?: typeof fetch;
}

export interface HttpResponse<D extends unknown, E extends unknown = unknown> extends Response {
	data: D;
	error: E;
}

type CancelToken = Symbol | string | number;

export enum ContentType {
	Json = 'application/json',
	JsonApi = 'application/vnd.api+json',
	FormData = 'multipart/form-data',
	UrlEncoded = 'application/x-www-form-urlencoded',
	Text = 'text/plain'
}

export class HttpClient<SecurityDataType = unknown> {
	public baseUrl: string = 'https://realtime.nationalrail.co.uk/LDBSVWS';
	private securityData: SecurityDataType | null = null;
	private securityWorker?: ApiConfig<SecurityDataType>['securityWorker'];
	private abortControllers = new Map<CancelToken, AbortController>();
	private customFetch = (...fetchParams: Parameters<typeof fetch>) => fetch(...fetchParams);

	private baseApiParams: RequestParams = {
		credentials: 'same-origin',
		headers: {},
		redirect: 'follow',
		referrerPolicy: 'no-referrer'
	};

	constructor(apiConfig: ApiConfig<SecurityDataType> = {}) {
		Object.assign(this, apiConfig);
	}

	public setSecurityData = (data: SecurityDataType | null) => {
		this.securityData = data;
	};

	protected encodeQueryParam(key: string, value: any) {
		const encodedKey = encodeURIComponent(key);
		return `${encodedKey}=${encodeURIComponent(typeof value === 'number' ? value : `${value}`)}`;
	}

	protected addQueryParam(query: QueryParamsType, key: string) {
		return this.encodeQueryParam(key, query[key]);
	}

	protected addArrayQueryParam(query: QueryParamsType, key: string) {
		const value = query[key];
		return value.map((v: any) => this.encodeQueryParam(key, v)).join('&');
	}

	protected toQueryString(rawQuery?: QueryParamsType): string {
		const query = rawQuery || {};
		const keys = Object.keys(query).filter((key) => 'undefined' !== typeof query[key]);
		return keys
			.map((key) =>
				Array.isArray(query[key])
					? this.addArrayQueryParam(query, key)
					: this.addQueryParam(query, key)
			)
			.join('&');
	}

	protected addQueryParams(rawQuery?: QueryParamsType): string {
		const queryString = this.toQueryString(rawQuery);
		return queryString ? `?${queryString}` : '';
	}

	private contentFormatters: Record<ContentType, (input: any) => any> = {
		[ContentType.Json]: (input: any) =>
			input !== null && (typeof input === 'object' || typeof input === 'string')
				? JSON.stringify(input)
				: input,
		[ContentType.JsonApi]: (input: any) =>
			input !== null && (typeof input === 'object' || typeof input === 'string')
				? JSON.stringify(input)
				: input,
		[ContentType.Text]: (input: any) =>
			input !== null && typeof input !== 'string' ? JSON.stringify(input) : input,
		[ContentType.FormData]: (input: any) => {
			if (input instanceof FormData) {
				return input;
			}

			return Object.keys(input || {}).reduce((formData, key) => {
				const property = input[key];
				formData.append(
					key,
					property instanceof Blob
						? property
						: typeof property === 'object' && property !== null
							? JSON.stringify(property)
							: `${property}`
				);
				return formData;
			}, new FormData());
		},
		[ContentType.UrlEncoded]: (input: any) => this.toQueryString(input)
	};

	protected mergeRequestParams(params1: RequestParams, params2?: RequestParams): RequestParams {
		return {
			...this.baseApiParams,
			...params1,
			...(params2 || {}),
			headers: {
				...(this.baseApiParams.headers || {}),
				...(params1.headers || {}),
				...((params2 && params2.headers) || {})
			}
		};
	}

	protected createAbortSignal = (cancelToken: CancelToken): AbortSignal | undefined => {
		if (this.abortControllers.has(cancelToken)) {
			const abortController = this.abortControllers.get(cancelToken);
			if (abortController) {
				return abortController.signal;
			}
			return void 0;
		}

		const abortController = new AbortController();
		this.abortControllers.set(cancelToken, abortController);
		return abortController.signal;
	};

	public abortRequest = (cancelToken: CancelToken) => {
		const abortController = this.abortControllers.get(cancelToken);

		if (abortController) {
			abortController.abort();
			this.abortControllers.delete(cancelToken);
		}
	};

	public request = async <T = any, E = any>({
		body,
		secure,
		path,
		type,
		query,
		format,
		baseUrl,
		cancelToken,
		...params
	}: FullRequestParams): Promise<HttpResponse<T, E>> => {
		const secureParams =
			((typeof secure === 'boolean' ? secure : this.baseApiParams.secure) &&
				this.securityWorker &&
				(await this.securityWorker(this.securityData))) ||
			{};
		const requestParams = this.mergeRequestParams(params, secureParams);
		const queryString = query && this.toQueryString(query);
		const payloadFormatter = this.contentFormatters[type || ContentType.Json];
		const responseFormat = format || requestParams.format;

		return this.customFetch(
			`${baseUrl || this.baseUrl || ''}${path}${queryString ? `?${queryString}` : ''}`,
			{
				...requestParams,
				headers: {
					...(requestParams.headers || {}),
					...(type && type !== ContentType.FormData ? { 'Content-Type': type } : {})
				},
				signal: (cancelToken ? this.createAbortSignal(cancelToken) : requestParams.signal) || null,
				body: typeof body === 'undefined' || body === null ? null : payloadFormatter(body)
			}
		).then(async (response) => {
			const r = response as HttpResponse<T, E>;
			r.data = null as unknown as T;
			r.error = null as unknown as E;

			const responseToParse = responseFormat ? response.clone() : response;
			const data = !responseFormat
				? r
				: await responseToParse[responseFormat]()
						.then((data) => {
							if (r.ok) {
								r.data = data;
							} else {
								r.error = data;
							}
							return r;
						})
						.catch((e) => {
							r.error = e;
							return r;
						});

			if (cancelToken) {
				this.abortControllers.delete(cancelToken);
			}

			if (!response.ok) throw data;
			return data;
		});
	};
}

/**
 * @title LDBSVWebService
 * @version v1
 * @baseUrl https://realtime.nationalrail.co.uk/LDBSVWS
 */
export class Api<SecurityDataType extends unknown> extends HttpClient<SecurityDataType> {
	api = {
		/**
		 * No description
		 *
		 * @tags _20211101Ref
		 * @name 20211101RefGetReasonCode
		 * @request GET:/api/ref/20211101/GetReasonCode/{reasonCode}
		 */
		'20211101RefGetReasonCode': (reasonCode: number, params: RequestParams = {}) =>
			this.request<ReasonDescription, any>({
				path: `/api/ref/20211101/GetReasonCode/${reasonCode}`,
				method: 'GET',
				format: 'json',
				...params
			}),

		/**
		 * No description
		 *
		 * @tags _20211101Ref
		 * @name 20211101RefGetReasonCodeList
		 * @request GET:/api/ref/20211101/GetReasonCodeList
		 */
		'20211101RefGetReasonCodeList': (params: RequestParams = {}) =>
			this.request<ReasonDescription[], any>({
				path: `/api/ref/20211101/GetReasonCodeList`,
				method: 'GET',
				format: 'json',
				...params
			}),

		/**
		 * No description
		 *
		 * @tags _20211101Ref
		 * @name 20211101RefGetSourceInstanceNames
		 * @request GET:/api/ref/20211101/GetSourceInstanceNames
		 */
		'20211101RefGetSourceInstanceNames': (params: RequestParams = {}) =>
			this.request<SourceInstanceName[], any>({
				path: `/api/ref/20211101/GetSourceInstanceNames`,
				method: 'GET',
				format: 'json',
				...params
			}),

		/**
		 * No description
		 *
		 * @tags _20211101Ref
		 * @name 20211101RefGetTocList
		 * @request GET:/api/ref/20211101/GetTOCList/{currentVersion}
		 */
		'20211101RefGetTocList': (currentVersion: string, params: RequestParams = {}) =>
			this.request<TOCRefData, any>({
				path: `/api/ref/20211101/GetTOCList/${currentVersion}`,
				method: 'GET',
				format: 'json',
				...params
			}),

		/**
		 * No description
		 *
		 * @tags _20211101Ref
		 * @name 20211101RefGetStationList
		 * @request GET:/api/ref/20211101/GetStationList/{currentVersion}
		 */
		'20211101RefGetStationList': (currentVersion: string, params: RequestParams = {}) =>
			this.request<StationRefData, any>({
				path: `/api/ref/20211101/GetStationList/${currentVersion}`,
				method: 'GET',
				format: 'json',
				...params
			}),

		/**
		 * No description
		 *
		 * @tags _20211101Ref
		 * @name 20211101RefGetLoadingCategoryList
		 * @request GET:/api/ref/20211101/GetLoadingCategoryData/{currentVersion}
		 */
		'20211101RefGetLoadingCategoryList': (currentVersion: string, params: RequestParams = {}) =>
			this.request<LoadingCategoryRefData, any>({
				path: `/api/ref/20211101/GetLoadingCategoryData/${currentVersion}`,
				method: 'GET',
				format: 'json',
				...params
			}),

		/**
		 * No description
		 *
		 * @tags _20220120
		 * @name 20220120GetArrivalDepartureBoardByCrs
		 * @request GET:/api/20220120/GetArrivalDepartureBoardByCRS/{crs}/{time}
		 */
		'20220120GetArrivalDepartureBoardByCrs': (
			crs: string,
			time: string,
			query?: {
				/**
				 * @format int32
				 * @default "10"
				 */
				numRows?: number;
				/**
				 * @format int32
				 * @default "120"
				 */
				timeWindow?: number;
				/** @default "null" */
				filterCRS?: string;
				/** @default "to" */
				filterType?: 'to' | 'from';
				/** @default "null" */
				filterTOC?: string;
				/** @default "P" */
				services?: string;
				/** @default "false" */
				getNonPassengerServices?: boolean;
			},
			params: RequestParams = {}
		) =>
			this.request<StationBoard, any>({
				path: `/api/20220120/GetArrivalDepartureBoardByCRS/${crs}/${time}`,
				method: 'GET',
				query: query,
				format: 'json',
				...params
			}),

		/**
		 * No description
		 *
		 * @tags _20220120
		 * @name 20220120GetArrivalDepartureBoardByTiploc
		 * @request GET:/api/20220120/GetArrivalDepartureBoardByTIPLOC/{tiploc}/{time}
		 */
		'20220120GetArrivalDepartureBoardByTiploc': (
			tiploc: string,
			time: string,
			query?: {
				/**
				 * @format int32
				 * @default "10"
				 */
				numRows?: number;
				/**
				 * @format int32
				 * @default "120"
				 */
				timeWindow?: number;
				/** @default "null" */
				filterCRS?: string;
				/** @default "to" */
				filterType?: 'to' | 'from';
				/** @default "null" */
				filterTOC?: string;
				/** @default "P" */
				services?: string;
				/** @default "false" */
				getNonPassengerServices?: boolean;
			},
			params: RequestParams = {}
		) =>
			this.request<StationBoard, any>({
				path: `/api/20220120/GetArrivalDepartureBoardByTIPLOC/${tiploc}/${time}`,
				method: 'GET',
				query: query,
				format: 'json',
				...params
			}),

		/**
		 * No description
		 *
		 * @tags _20220120
		 * @name 20220120GetArrivalBoardByCrs
		 * @request GET:/api/20220120/GetArrivalBoardByCRS/{crs}/{time}
		 */
		'20220120GetArrivalBoardByCrs': (
			crs: string,
			time: string,
			query?: {
				/**
				 * @format int32
				 * @default "10"
				 */
				numRows?: number;
				/**
				 * @format int32
				 * @default "120"
				 */
				timeWindow?: number;
				/** @default "null" */
				filterCRS?: string;
				/** @default "to" */
				filterType?: 'to' | 'from';
				/** @default "null" */
				filterTOC?: string;
				/** @default "P" */
				services?: string;
				/** @default "false" */
				getNonPassengerServices?: boolean;
			},
			params: RequestParams = {}
		) =>
			this.request<StationBoard, any>({
				path: `/api/20220120/GetArrivalBoardByCRS/${crs}/${time}`,
				method: 'GET',
				query: query,
				format: 'json',
				...params
			}),

		/**
		 * No description
		 *
		 * @tags _20220120
		 * @name 20220120GetArrivalBoardByTiploc
		 * @request GET:/api/20220120/GetArrivalBoardByTIPLOC/{tiploc}/{time}
		 */
		'20220120GetArrivalBoardByTiploc': (
			tiploc: string,
			time: string,
			query?: {
				/**
				 * @format int32
				 * @default "10"
				 */
				numRows?: number;
				/**
				 * @format int32
				 * @default "120"
				 */
				timeWindow?: number;
				/** @default "null" */
				filterCRS?: string;
				/** @default "to" */
				filterType?: 'to' | 'from';
				/** @default "null" */
				filterTOC?: string;
				/** @default "P" */
				services?: string;
				/** @default "false" */
				getNonPassengerServices?: boolean;
			},
			params: RequestParams = {}
		) =>
			this.request<StationBoard, any>({
				path: `/api/20220120/GetArrivalBoardByTIPLOC/${tiploc}/${time}`,
				method: 'GET',
				query: query,
				format: 'json',
				...params
			}),

		/**
		 * No description
		 *
		 * @tags _20220120
		 * @name 20220120GetDepartureBoardByCrs
		 * @request GET:/api/20220120/GetDepartureBoardByCRS/{crs}/{time}
		 */
		'20220120GetDepartureBoardByCrs': (
			crs: string,
			time: string,
			query?: {
				/**
				 * @format int32
				 * @default "10"
				 */
				numRows?: number;
				/**
				 * @format int32
				 * @default "120"
				 */
				timeWindow?: number;
				/** @default "null" */
				filterCRS?: string;
				/** @default "to" */
				filterType?: 'to' | 'from';
				/** @default "null" */
				filterTOC?: string;
				/** @default "P" */
				services?: string;
				/** @default "false" */
				getNonPassengerServices?: boolean;
			},
			params: RequestParams = {}
		) =>
			this.request<StationBoard, any>({
				path: `/api/20220120/GetDepartureBoardByCRS/${crs}/${time}`,
				method: 'GET',
				query: query,
				format: 'json',
				...params
			}),

		/**
		 * No description
		 *
		 * @tags _20220120
		 * @name 20220120GetDepartureBoardByTiploc
		 * @request GET:/api/20220120/GetDepartureBoardByTIPLOC/{tiploc}/{time}
		 */
		'20220120GetDepartureBoardByTiploc': (
			tiploc: string,
			time: string,
			query?: {
				/**
				 * @format int32
				 * @default "10"
				 */
				numRows?: number;
				/**
				 * @format int32
				 * @default "120"
				 */
				timeWindow?: number;
				/** @default "null" */
				filterCRS?: string;
				/** @default "to" */
				filterType?: 'to' | 'from';
				/** @default "null" */
				filterTOC?: string;
				/** @default "P" */
				services?: string;
				/** @default "false" */
				getNonPassengerServices?: boolean;
			},
			params: RequestParams = {}
		) =>
			this.request<StationBoard, any>({
				path: `/api/20220120/GetDepartureBoardByTIPLOC/${tiploc}/${time}`,
				method: 'GET',
				query: query,
				format: 'json',
				...params
			}),

		/**
		 * No description
		 *
		 * @tags _20220120
		 * @name 20220120GetArrBoardWithDetails
		 * @request GET:/api/20220120/GetArrBoardWithDetails/{crs}/{time}
		 */
		'20220120GetArrBoardWithDetails': (
			crs: string,
			time: string,
			query?: {
				/**
				 * @format int32
				 * @default "10"
				 */
				numRows?: number;
				/**
				 * @format int32
				 * @default "120"
				 */
				timeWindow?: number;
				/** @default "null" */
				filterCRS?: string;
				/** @default "to" */
				filterType?: 'to' | 'from';
				/** @default "null" */
				filterTOC?: string;
				/** @default "P" */
				services?: string;
				/** @default "false" */
				getNonPassengerServices?: boolean;
			},
			params: RequestParams = {}
		) =>
			this.request<StationBoardWithDetails, any>({
				path: `/api/20220120/GetArrBoardWithDetails/${crs}/${time}`,
				method: 'GET',
				query: query,
				format: 'json',
				...params
			}),

		/**
		 * No description
		 *
		 * @tags _20220120
		 * @name 20220120GetDepBoardWithDetails
		 * @request GET:/api/20220120/GetDepBoardWithDetails/{crs}/{time}
		 */
		'20220120GetDepBoardWithDetails': (
			crs: string,
			time: string,
			query?: {
				/**
				 * @format int32
				 * @default "10"
				 */
				numRows?: number;
				/**
				 * @format int32
				 * @default "120"
				 */
				timeWindow?: number;
				/** @default "null" */
				filterCRS?: string;
				/** @default "to" */
				filterType?: 'to' | 'from';
				/** @default "null" */
				filterTOC?: string;
				/** @default "P" */
				services?: string;
				/** @default "false" */
				getNonPassengerServices?: boolean;
			},
			params: RequestParams = {}
		) =>
			this.request<StationBoardWithDetails, any>({
				path: `/api/20220120/GetDepBoardWithDetails/${crs}/${time}`,
				method: 'GET',
				query: query,
				format: 'json',
				...params
			}),

		/**
		 * No description
		 *
		 * @tags _20220120
		 * @name 20220120GetArrDepBoardWithDetails
		 * @request GET:/api/20220120/GetArrDepBoardWithDetails/{crs}/{time}
		 */
		'20220120GetArrDepBoardWithDetails': (
			crs: string,
			time: string,
			query?: {
				/**
				 * @format int32
				 * @default "10"
				 */
				numRows?: number;
				/**
				 * @format int32
				 * @default "120"
				 */
				timeWindow?: number;
				/** @default "null" */
				filterCRS?: string;
				/** @default "to" */
				filterType?: 'to' | 'from';
				/** @default "null" */
				filterTOC?: string;
				/** @default "P" */
				services?: string;
				/** @default "false" */
				getNonPassengerServices?: boolean;
			},
			params: RequestParams = {}
		) =>
			this.request<StationBoardWithDetails, any>({
				path: `/api/20220120/GetArrDepBoardWithDetails/${crs}/${time}`,
				method: 'GET',
				query: query,
				format: 'json',
				...params
			}),

		/**
		 * No description
		 *
		 * @tags _20220120
		 * @name 20220120GetFastestDepartures
		 * @request GET:/api/20220120/GetFastestDepartures/{crs}/{filterList}/{time}
		 */
		'20220120GetFastestDepartures': (
			crs: string,
			filterList: string,
			time: string,
			query?: {
				/**
				 * @format int32
				 * @default "120"
				 */
				timeWindow?: number;
				/** @default "null" */
				filterTOC?: string;
				/** @default "P" */
				services?: string;
			},
			params: RequestParams = {}
		) =>
			this.request<DeparturesBoard, any>({
				path: `/api/20220120/GetFastestDepartures/${crs}/${filterList}/${time}`,
				method: 'GET',
				query: query,
				format: 'json',
				...params
			}),

		/**
		 * No description
		 *
		 * @tags _20220120
		 * @name 20220120GetFastestDeparturesWithDetails
		 * @request GET:/api/20220120/GetFastestDeparturesWithDetails/{crs}/{filterList}/{time}
		 */
		'20220120GetFastestDeparturesWithDetails': (
			crs: string,
			filterList: string,
			time: string,
			query?: {
				/**
				 * @format int32
				 * @default "120"
				 */
				timeWindow?: number;
				/** @default "null" */
				filterTOC?: string;
				/** @default "P" */
				services?: string;
			},
			params: RequestParams = {}
		) =>
			this.request<DeparturesBoardWithDetails, any>({
				path: `/api/20220120/GetFastestDeparturesWithDetails/${crs}/${filterList}/${time}`,
				method: 'GET',
				query: query,
				format: 'json',
				...params
			}),

		/**
		 * No description
		 *
		 * @tags _20220120
		 * @name 20220120GetNextDepartures
		 * @request GET:/api/20220120/GetNextDepartures/{crs}/{filterList}/{time}
		 */
		'20220120GetNextDepartures': (
			crs: string,
			filterList: string,
			time: string,
			query?: {
				/**
				 * @format int32
				 * @default "120"
				 */
				timeWindow?: number;
				/** @default "null" */
				filterTOC?: string;
				/** @default "P" */
				services?: string;
			},
			params: RequestParams = {}
		) =>
			this.request<DeparturesBoard, any>({
				path: `/api/20220120/GetNextDepartures/${crs}/${filterList}/${time}`,
				method: 'GET',
				query: query,
				format: 'json',
				...params
			}),

		/**
		 * No description
		 *
		 * @tags _20220120
		 * @name 20220120GetNextDeparturesWithDetails
		 * @request GET:/api/20220120/GetNextDeparturesWithDetails/{crs}/{filterList}/{time}
		 */
		'20220120GetNextDeparturesWithDetails': (
			crs: string,
			filterList: string,
			time: string,
			query?: {
				/**
				 * @format int32
				 * @default "120"
				 */
				timeWindow?: number;
				/** @default "null" */
				filterTOC?: string;
				/** @default "P" */
				services?: string;
			},
			params: RequestParams = {}
		) =>
			this.request<DeparturesBoardWithDetails, any>({
				path: `/api/20220120/GetNextDeparturesWithDetails/${crs}/${filterList}/${time}`,
				method: 'GET',
				query: query,
				format: 'json',
				...params
			}),

		/**
		 * No description
		 *
		 * @tags _20220120
		 * @name 20220120GetServiceDetailsByRid
		 * @request GET:/api/20220120/GetServiceDetailsByRID/{rid}
		 */
		'20220120GetServiceDetailsByRid': (rid: string, params: RequestParams = {}) =>
			this.request<ServiceDetails, any>({
				path: `/api/20220120/GetServiceDetailsByRID/${rid}`,
				method: 'GET',
				format: 'json',
				...params
			}),

		/**
		 * No description
		 *
		 * @tags _20220120
		 * @name 20220120QueryServices
		 * @request GET:/api/20220120/QueryServices/{serviceID}/{sdd}
		 */
		'20220120QueryServices': (
			serviceId: string,
			sdd: string,
			query?: {
				/** @default "null" */
				filterTime?: string;
				/** @default "null" */
				filterCRS?: string;
				/** @default "null" */
				filterTOC?: string;
			},
			params: RequestParams = {}
		) =>
			this.request<ServiceList, any>({
				path: `/api/20220120/QueryServices/${serviceId}/${sdd}`,
				method: 'GET',
				query: query,
				format: 'json',
				...params
			}),

		/**
		 * No description
		 *
		 * @tags _20220120
		 * @name 20220120GetReasonCode
		 * @request GET:/api/20220120/GetReasonCode/{reasonCode}
		 */
		'20220120GetReasonCode': (reasonCode: number, params: RequestParams = {}) =>
			this.request<ReasonDescription, any>({
				path: `/api/20220120/GetReasonCode/${reasonCode}`,
				method: 'GET',
				format: 'json',
				...params
			}),

		/**
		 * No description
		 *
		 * @tags _20220120
		 * @name 20220120GetReasonCodeList
		 * @request GET:/api/20220120/GetReasonCodeList
		 */
		'20220120GetReasonCodeList': (params: RequestParams = {}) =>
			this.request<ReasonDescription[], any>({
				path: `/api/20220120/GetReasonCodeList`,
				method: 'GET',
				format: 'json',
				...params
			}),

		/**
		 * No description
		 *
		 * @tags _20220120
		 * @name 20220120GetDisruptionList
		 * @request GET:/api/20220120/GetDisruptionList/{CRSList}
		 */
		'20220120GetDisruptionList': (crsList: string, params: RequestParams = {}) =>
			this.request<DisruptionItem[], any>({
				path: `/api/20220120/GetDisruptionList/${crsList}`,
				method: 'GET',
				format: 'json',
				...params
			}),

		/**
		 * No description
		 *
		 * @tags _20220120
		 * @name 20220120GetSourceInstanceNames
		 * @request GET:/api/20220120/GetSourceInstanceNames
		 */
		'20220120GetSourceInstanceNames': (params: RequestParams = {}) =>
			this.request<SourceInstanceName[], any>({
				path: `/api/20220120/GetSourceInstanceNames`,
				method: 'GET',
				format: 'json',
				...params
			})
	};
}
