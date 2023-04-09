package dev.krud.boost.daemon.base.config

import dev.krud.boost.daemon.configuration.instance.heapdump.messaging.InstanceHeapdumpDownloadProgressMessage
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.integration.channel.PublishSubscribeChannel
import org.springframework.integration.channel.QueueChannel
import org.springframework.integration.dsl.MessageChannels
import org.springframework.integration.dsl.integrationFlow
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor

@Configuration
class IntegrationConfig {
    @Bean
    fun systemEventsChannel(): PublishSubscribeChannel {
        return MessageChannels.publishSubscribe(systemEventsExecutor()).get()
    }

    @Bean
    fun instanceHostnameUpdatedChannel(): PublishSubscribeChannel {
        return MessageChannels.publishSubscribe().get()
    }

    @Bean
    fun instanceHealthCheckRequestChannel(): QueueChannel {
        return MessageChannels.queue().get()
    }

    @Bean
    fun instanceHeapdumpDownloadRequestChannel(): QueueChannel {
        return MessageChannels.queue().get()
    }

    @Bean
    fun instanceHeapdumpDownloadProgressInputChannel(): PublishSubscribeChannel {
        return MessageChannels.publishSubscribe().get()
    }

    @Bean
    fun instanceHeapdumpDownloadProgressChannel(): PublishSubscribeChannel {
        return MessageChannels.publishSubscribe().get()
    }

    @Bean
    fun instanceHeapdumpDownloadProgressFlow() = integrationFlow(instanceHeapdumpDownloadProgressInputChannel()) {
        aggregate {
            correlationStrategy {
                it as InstanceHeapdumpDownloadProgressMessage
                it.payload.referenceId to it.payload.status
            }
            releaseStrategy {
                false
            }

            outputProcessor {
                it.messages.last()
            }

            groupTimeoutExpression("timestamp + 50 - T(System).currentTimeMillis()")

            expireGroupsUponTimeout(true)
            expireGroupsUponCompletion(true)
            sendPartialResultOnExpiry(true)
        }

        channel(instanceHeapdumpDownloadProgressChannel())
    }

    @Bean
    fun instanceThreadProfilingProgressChannel(): PublishSubscribeChannel {
        return MessageChannels.publishSubscribe().get()
    }

    @Bean
    fun systemEventsExecutor(): ThreadPoolTaskExecutor {
        val pool = ThreadPoolTaskExecutor()
        pool.corePoolSize = 5
        pool.maxPoolSize = 10
        pool.setWaitForTasksToCompleteOnShutdown(true)
        return pool
    }
}