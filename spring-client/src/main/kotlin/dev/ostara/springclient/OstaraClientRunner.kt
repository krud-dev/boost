package dev.ostara.springclient

import dev.ostara.springclient.config.OstaraClientProperties
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.DisposableBean
import org.springframework.beans.factory.InitializingBean
import java.util.*
import kotlin.concurrent.timer

class OstaraClientRunner(
  private val ostaraAgentClient: OstaraAgentClient,
  private val registrationRequest: RegistrationRequest,
  private val ostaraClientProperties: OstaraClientProperties
) : InitializingBean, DisposableBean {
  private lateinit var registrationTimer: Timer

  override fun afterPropertiesSet() {
    log.info("Initializing Ostara Agent Client Runner...")
    registrationTimer = timer("ostaraRegistration", false, 0, ostaraClientProperties.runnerIntervalSeconds * 1000) {
      log.trace("Initiating registration request...")
      ostaraAgentClient.register(registrationRequest)
        .onSuccess {
          log.trace("Registration request successful.")
        }
        .onFailure {
          log.error("Registration request failed.", it)
        }
    }
    log.info("Ostara Agent Client Runner initialized.")
  }

  override fun destroy() {
    log.info("Deregistering from Ostara Agent...")
    if (!::registrationTimer.isInitialized) {
      log.warn("Registration timer not initialized, skipping deregistration.")
      return
    }
    registrationTimer.cancel()
    ostaraAgentClient.deregister(registrationRequest)
      .onSuccess {
        log.info("Deregistration request successful.")
      }
      .onFailure {
        log.error("Deregistration request failed.", it)
      }
  }

  companion object {
    private val log = LoggerFactory.getLogger(OstaraClientRunner::class.java)
  }
}
