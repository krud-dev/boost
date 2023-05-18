package dev.krud.boost.daemon.configuration.instance.metric

import dev.krud.boost.daemon.configuration.instance.InstanceService
import dev.krud.boost.daemon.configuration.instance.health.InstanceHealthService
import dev.krud.boost.daemon.configuration.instance.metric.ro.InstanceMetricValueRO
import dev.krud.boost.daemon.metricmonitor.MetricManager
import org.springframework.context.annotation.Lazy
import org.springframework.messaging.Message
import org.springframework.messaging.MessageChannel
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.messaging.simp.stomp.StompCommand
import org.springframework.messaging.simp.stomp.StompHeaderAccessor
import org.springframework.messaging.support.ChannelInterceptor
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import java.util.concurrent.ConcurrentHashMap

@Component
class InstanceMetricWebsocketTopicInterceptor(
    private val instanceService: InstanceService,
    @Lazy
    private val messagingTemplate: SimpMessagingTemplate,
    private val instanceMetricService: InstanceMetricService,
    private val instanceHealthService: InstanceHealthService,
    private val metricManager: MetricManager
) : ChannelInterceptor {
    private val subscriptions = ConcurrentHashMap<String, Set<String>>()
    private val previousValueCache = ConcurrentHashMap<String, InstanceMetricValueRO>()

    override fun preSend(message: Message<*>, channel: MessageChannel): Message<*>? {
        val headerAccessor = StompHeaderAccessor.wrap(message)
        headerAccessor.command
        when (headerAccessor.command) {
            StompCommand.SUBSCRIBE -> handleSubscribe(headerAccessor)
            StompCommand.UNSUBSCRIBE -> handleUnsubscribe(headerAccessor)
            StompCommand.DISCONNECT -> handleDisconnect(headerAccessor)
            else -> {}
        }
        return message
    }

    @Scheduled(fixedRate = 5000)
    protected fun processTopics() {
        if (subscriptions.isEmpty()) {
            return
        }

        for (topic in subscriptions.values.flatten().toSet()) {
            val (instanceId, metricName) = InstanceMetricWebsocketUtil.parseMetricAndInstanceIdFromTopic(topic)
            val metric = runCatching {
                instanceMetricService.getLatestMetric(instanceId, metricName)
            }
                .getOrNull()
                ?: continue
            val previousValues = previousValueCache[topic]
            if (previousValues != null && previousValues == metric.value) {
                continue
            }
            previousValueCache[topic] = metric.value
            messagingTemplate.convertAndSend(topic, metric)
        }
    }

    private fun handleSubscribe(headerAccessor: StompHeaderAccessor) {
        val destination = headerAccessor.destination ?: return
        if (!InstanceMetricWebsocketUtil.isValidMetricTopic(destination)) {
            return
        }

        val (instanceId, metricName) = InstanceMetricWebsocketUtil.parseMetricAndInstanceIdFromTopic(destination)
        // todo: perform lighter ifexists check
        instanceService.getInstanceFromCacheOrThrow(instanceId)
        val sessionId = headerAccessor.sessionId ?: return
        val currentSubscriptions = subscriptions[sessionId] ?: emptySet()
        subscriptions[sessionId] = currentSubscriptions + destination
        metricManager.requestMetric(instanceId, metricName)
    }

    private fun handleUnsubscribe(headerAccessor: StompHeaderAccessor) {
        val destination = headerAccessor.subscriptionId ?: return
        if (!InstanceMetricWebsocketUtil.isValidMetricTopic(destination)) {
            return
        }

        val (instanceId, metricName) = InstanceMetricWebsocketUtil.parseMetricAndInstanceIdFromTopic(destination)
        val sessionId = headerAccessor.sessionId ?: return
        val currentSubscriptions = subscriptions[sessionId] ?: emptySet()
        val newSubscriptions = currentSubscriptions - destination
        if (newSubscriptions.isEmpty()) {
            subscriptions.remove(sessionId)
        } else {
            subscriptions[sessionId] = newSubscriptions
        }
        metricManager.releaseMetric(instanceId, metricName)
    }

    private fun handleDisconnect(headerAccessor: StompHeaderAccessor) {
        val sessionId = headerAccessor.sessionId ?: return
        subscriptions.remove(sessionId)
    }
}