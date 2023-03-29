package dev.krud.boost.daemon.configuration.instance.hostname.resolver

import java.util.*

interface InstanceHostnameResolver {
    fun resolveHostname(instanceId: UUID): String?
    fun resolveHostname(url: String): String?
}