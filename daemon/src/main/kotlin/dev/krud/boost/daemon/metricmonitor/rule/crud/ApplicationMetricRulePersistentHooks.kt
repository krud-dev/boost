package dev.krud.boost.daemon.metricmonitor.rule.crud

import dev.krud.boost.daemon.metricmonitor.rule.messaging.ApplicationMetricRuleCreatedMessage
import dev.krud.boost.daemon.metricmonitor.rule.messaging.ApplicationMetricRuleDeletedMessage
import dev.krud.boost.daemon.metricmonitor.rule.messaging.ApplicationMetricRuleDisabledMessage
import dev.krud.boost.daemon.metricmonitor.rule.messaging.ApplicationMetricRuleEnabledMessage
import dev.krud.boost.daemon.metricmonitor.rule.messaging.ApplicationMetricRuleMetricModifiedMessage
import dev.krud.boost.daemon.metricmonitor.rule.model.ApplicationMetricRule
import dev.krud.crudframework.crud.hooks.interfaces.CreateHooks
import dev.krud.crudframework.crud.hooks.interfaces.DeleteHooks
import dev.krud.crudframework.crud.hooks.interfaces.UpdateHooks
import org.springframework.integration.channel.PublishSubscribeChannel
import org.springframework.stereotype.Component
import java.util.*

@Component
class ApplicationMetricRulePersistentHooks(
    private val applicationMetricRuleChannel: PublishSubscribeChannel
) : CreateHooks<UUID, ApplicationMetricRule>, UpdateHooks<UUID, ApplicationMetricRule>, DeleteHooks<UUID, ApplicationMetricRule> {
    override fun postCreate(entity: ApplicationMetricRule) {
        applicationMetricRuleChannel.send(
            ApplicationMetricRuleCreatedMessage(
                ApplicationMetricRuleCreatedMessage.Payload(
                    entity.id,
                    entity.application.id,
                    entity.enabled
                )
            )
        )
    }

    override fun postUpdate(entity: ApplicationMetricRule) {
        val copy = entity.saveOrGetCopy() as ApplicationMetricRule
        if (copy.enabled != entity.enabled) {
            if (entity.enabled) {
                applicationMetricRuleChannel.send(
                    ApplicationMetricRuleEnabledMessage(
                        ApplicationMetricRuleEnabledMessage.Payload(
                            entity.id,
                            entity.application.id
                        )
                    )
                )
            } else {
                applicationMetricRuleChannel.send(
                    ApplicationMetricRuleDisabledMessage(
                        ApplicationMetricRuleDisabledMessage.Payload(
                            entity.id,
                            entity.application.id
                        )
                    )
                )
            }
        }

        if (copy.metricName != entity.metricName) {
            applicationMetricRuleChannel.send(
                ApplicationMetricRuleMetricModifiedMessage(
                    ApplicationMetricRuleMetricModifiedMessage.Payload(
                        entity.id,
                        entity.application.id,
                        entity.metricName,
                        copy.metricName
                    )
                )
            )
        }
    }

    override fun postDelete(entity: ApplicationMetricRule) {
        applicationMetricRuleChannel.send(
            ApplicationMetricRuleDeletedMessage(
                ApplicationMetricRuleDeletedMessage.Payload(
                    entity.id,
                    entity.application.id
                )
            )
        )
    }
}