package dev.krud.boost.daemon.actuator.model

import com.fasterxml.jackson.annotation.JsonProperty
import dev.krud.boost.daemon.jackson.ParsedDate
import java.util.*

data class QuartzTriggerResponse(
    val group: String,
    val name: String,
    val description: String,
    val state: State,
    val type: Type,
    val calendarName: String?,
    val startTime: ParsedDate?,
    val endTime: ParsedDate?,
    val previousFireTime: ParsedDate?,
    val nextFireTime: ParsedDate?,
    val priority: Int,
    val finalFireTime: ParsedDate?,
    val data: Map<String, Any>?,
    val calendarInterval: CalendarInterval?,
    val custom: Custom?,
    val cron: Cron?,
    val dailyTimeInterval: DailyTimeInterval?,
    val simple: Simple?

) {
    enum class State {
        NONE,
        NORMAL,
        PAUSED,
        COMPLETE,
        ERROR,
        BLOCKED
    }

    enum class Type {
        @JsonProperty("calendarInterval")
        CALENDAR_INTERVAL,

        @JsonProperty("cron")
        CRON,

        @JsonProperty("custom")
        CUSTOM,

        @JsonProperty("dailyTimeInterval")
        DAILY_TIME_INTERVAL,

        @JsonProperty("simple")
        SIMPLE
    }

    data class CalendarInterval(
        val interval: Long,
        val timeZone: String,
        val timesTriggered: Int,
        val preserveHourOfDayAcrossDaylightSavings: Boolean,
        val skipDayIfHourDoesNotExist: Boolean
    )

    data class Custom(
        val trigger: String
    )

    data class Cron(
        val expression: String,
        val timeZone: String
    )

    data class DailyTimeInterval(
        val interval: Long,
        val daysOfWeek: List<Int>,
        val startTimeOfDay: String,
        val endTimeOfDay: String,
        val repeatCount: Int,
        val timesTriggered: Int
    )

    data class Simple(
        val interval: Long,
        val repeatCount: Int,
        val timesTriggered: Int
    )
}