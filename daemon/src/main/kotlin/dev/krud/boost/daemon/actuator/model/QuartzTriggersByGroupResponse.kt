package dev.krud.boost.daemon.actuator.model

import dev.krud.boost.daemon.jackson.ParsedDate
import java.util.*

data class QuartzTriggersByGroupResponse(
    val group: String,
    val paused: Boolean,
    val triggers: Triggers
) {
    data class Triggers(
        val cron: Map<String, Cron>,
        val simple: Map<String, Simple>,
        val dailyTimeInterval: Map<String, DailyTimeInterval>,
        val calendarInterval: Map<String, CalendarInterval>,
        val custom: Map<String, Custom>
    )

    data class Cron(
        val previousFireTime: ParsedDate?,
        val nextFireTime: ParsedDate?,
        val priority: Int,
        val expression: String,
        val timeZone: String
    )

    data class Simple(
        val previousFireTime: ParsedDate?,
        val nextFireTime: ParsedDate?,
        val priority: Int,
        val interval: Long
    )

    data class DailyTimeInterval(
        val previousFireTime: ParsedDate?,
        val nextFireTime: ParsedDate?,
        val priority: Int,
        val interval: Long,
        val daysOfWeek: List<String>,
        val startTimeOfDay: String,
        val endTimeOfDay: String
    )

    data class CalendarInterval(
        val previousFireTime: ParsedDate?,
        val nextFireTime: ParsedDate?,
        val priority: Int,
        val interval: Long,
        val timeZone: String
    )

    data class Custom(
        val previousFireTime: ParsedDate?,
        val nextFireTime: ParsedDate?,
        val priority: Int,
        val trigger: String
    )
}