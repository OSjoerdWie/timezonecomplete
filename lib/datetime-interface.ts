﻿import TimeZone = require("./timezone");
import basics = require("./basics");
export interface DateTimeAccess {
	year(): number;
	month(): number;
	day(): number;
	weekDay(): basics.WeekDay;

	hour(): number;
	minute(): number;
	second(): number;
	millisecond(): number;

	zone(): TimeZone.TimeZone;
}
