package dev.krud.boost.daemon.agent

import dev.krud.boost.daemon.agent.model.AgentInfoDTO
import dev.krud.boost.daemon.agent.model.DiscoveredInstanceDTO
import feign.Headers
import feign.RequestLine

interface AgentClient {
    @RequestLine("GET /api/info")
    fun getAgentInfo(): AgentInfoDTO

    @RequestLine("GET /api/instances")
    @Headers("Content-Type: application/json")
    fun getInstances(): List<DiscoveredInstanceDTO>
}