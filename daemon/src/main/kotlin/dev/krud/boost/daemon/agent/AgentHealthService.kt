package dev.krud.boost.daemon.agent

import dev.krud.boost.daemon.messaging.AgentHealthUpdatedEventMessage
import dev.krud.boost.daemon.agent.model.Agent
import dev.krud.boost.daemon.agent.model.AgentHealthDTO
import dev.krud.boost.daemon.utils.ONE_SECOND
import dev.krud.boost.daemon.utils.resolve
import dev.krud.boost.daemon.utils.searchSequence
import dev.krud.crudframework.crud.handler.krud.Krud
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.cache.CacheManager
import org.springframework.integration.annotation.ServiceActivator
import org.springframework.integration.channel.PublishSubscribeChannel
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import java.util.*

@Service
class AgentHealthService(
    private val agentService: AgentService,
    private val agentClientProvider: AgentClientProvider,
    cacheManager: CacheManager,
    private val agentKrud: Krud<Agent, UUID>,
    private val agentHealthChannel: PublishSubscribeChannel,
    private val agentHealthConverter: AgentHealthConverter
) {
    private val agentHealthCache by cacheManager.resolve()

    @Scheduled(fixedRate = ONE_SECOND * 10)
    fun refreshAgentsHealth() {
        log.debug {
            "Refreshing agents health"
        }
        agentKrud.searchSequence()
            .forEach { agent ->
                runCatching {
                    refreshAgentHealth(agent)
                }
                    .onSuccess {
                        log.debug { "Successfully refreshed health for agent ${agent.id} - $it" }
                    }
                    .onFailure {
                        log.error { "Failed to refresh health for agent ${agent.id} - ${it.message}" }
                    }
            }
    }

    @ServiceActivator(inputChannel = "agentHealthCheckRequestChannel", outputChannel = "nullChannel")
    fun refreshAgentHealth(agentId: UUID): AgentHealthDTO {
        return refreshAgentHealth(
            agentService.getAgentOrThrow(agentId)
        )
    }

    fun refreshAgentHealth(agent: Agent): AgentHealthDTO {
        val currentHealth = agentHealthCache.get(agent.id, AgentHealthDTO::class.java)
            ?: AgentHealthDTO.pending()
        val health = runCatching {
            fetchAgentHealth(agent)
        }
            .fold(
                onSuccess = { health ->
                    log.debug { "Successfully refreshed health for agent $agent.id - $health" }
                    health
                },
                onFailure = {
                    log.error(it) { "Failed to refresh health for agent $agent.id" }
                    AgentHealthDTO.error(0, it.message)
                }
            )
        if (currentHealth != health) {
            agentHealthChannel.send(
                AgentHealthUpdatedEventMessage(
                    AgentHealthUpdatedEventMessage.Payload(
                        agent.id,
                        currentHealth,
                        health
                    )
                )
            )
        }
        agentHealthCache.put(agent.id, health)
        return health
    }

    fun fetchAgentHealth(agentId: UUID): AgentHealthDTO {
        return fetchAgentHealth(
            agentService.getAgentOrThrow(agentId)
        )
    }

    fun fetchAgentHealth(agent: Agent): AgentHealthDTO {
        log.debug { "Starting health check for agent $${agent.id}" }
        val client = agentClientProvider.getAgentClient(
            agent
        )
        return runCatching {
            log.debug { "Getting health for agent $${agent.id} from ${agent.url}" }
            client.getAgentInfo(agent.apiKey)
        }
            .fold(
                onSuccess = { agentHealthConverter.convertInfo(it) },
                onFailure = { agentHealthConverter.convertException(it) }
            )
    }

    fun getCachedHealth(agentId: UUID): AgentHealthDTO? {
        log.debug { "Getting cached health for agent $agentId" }
        val cached = agentHealthCache.get(agentId, AgentHealthDTO::class.java)
        log.debug {
            if (cached == null) {
                "No cached health for agent $agentId"
            } else {
                "Got cached health for agent $agentId: $cached"
            }
        }
        return cached
    }

    companion object {
        private val log = KotlinLogging.logger { }
    }
}