package dev.krud.boost.daemon.configuration.instance.ability

import dev.krud.boost.daemon.configuration.instance.enums.InstanceAbility
import org.springframework.stereotype.Component

@Component
class TogglzAbilityResolver : AbstractEndpointAbilityResolver(InstanceAbility.TOGGLZ, "togglz")