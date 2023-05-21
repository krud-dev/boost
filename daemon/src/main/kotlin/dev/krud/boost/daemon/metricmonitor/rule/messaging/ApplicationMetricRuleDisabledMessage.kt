package dev.krud.boost.daemon.metricmonitor.rule.messaging

import dev.krud.boost.daemon.base.messaging.AbstractMessage
import dev.krud.boost.daemon.configuration.instance.metric.ro.InstanceMetricRO
import dev.krud.boost.daemon.utils.ParsedMetricName
import java.util.*

class ApplicationMetricRuleDisabledMessage(payload: Payload) : AbstractMessage<ApplicationMetricRuleDisabledMessage.Payload>(payload) {
    data class Payload(
        val applicationMetricRuleId: UUID,
        val applicationId: UUID
    )
}