package dev.krud.boost.daemon.actuator

import com.fasterxml.jackson.databind.DeserializationFeature
import dev.krud.boost.daemon.actuator.model.CacheActuatorResponse
import dev.krud.boost.daemon.actuator.model.HealthActuatorResponse
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import strikt.api.expect
import strikt.api.expectThat
import strikt.assertions.isEqualTo
import strikt.assertions.isFalse
import strikt.assertions.isNotEmpty
import strikt.assertions.isNotNull
import strikt.assertions.isTrue
import javax.net.ssl.SSLHandshakeException

class ActuatorHttpClientTest {
    private val server = MockWebServer()

    @BeforeEach
    internal fun setUp() {
        server.start()
    }

    @AfterEach
    internal fun tearDown() {
        server.shutdown()
    }

    @Test
    fun `test connection should return success false, actuator false on non-2xx status`() {
        server.enqueue(
            MockResponse()
                .setResponseCode(404)
        )
        val baseUrl = server.url("/actuator").toString()
        val client = getClient(baseUrl)
        val response = client.testConnection()
        expectThat(response.success)
            .isEqualTo(false)
        expectThat(response.validActuator)
            .isEqualTo(false)
        expectThat(response.statusCode)
            .isEqualTo(404)
    }

    @Test
    fun `test connection should return success true, actuator false on non-actuator response`() {
        server.enqueue(
            MockResponse()
                .setResponseCode(200)
                .setBody("Test")
        )
        val baseUrl = server.url("/actuator").toString()
        val client = getClient(baseUrl)
        val response = client.testConnection()
        expectThat(response.success)
            .isEqualTo(true)
        expectThat(response.validActuator)
            .isEqualTo(false)
        expectThat(response.statusCode)
            .isEqualTo(200)
    }

    @Test
    internal fun `endpoints returns all endpoints`() {
        val expectedEndpoints = setOf(
            "self",
            "beans",
            "caches",
            "caches-cache",
            "health",
            "health-path",
            "info",
            "conditions",
            "configprops-prefix",
            "configprops",
            "env-toMatch",
            "env",
            "flyway",
            "integrationgraph",
            "loggers",
            "loggers-name",
            "heapdump",
            "threaddump",
            "metrics-requiredMetricName",
            "metrics",
            "quartz",
            "quartz-jobsOrTriggers",
            "quartz-jobsOrTriggers-group-name",
            "quartz-jobsOrTriggers-group",
            "scheduledtasks",
            "mappings"
        )

        server.enqueue(
            okJsonResponse("responses/endpoints_response_200.json")
        )
        val baseUrl = server.url("/actuator").toString()
        val client = getClient(baseUrl)
        val endpoints = client.endpoints().getOrThrow()
        expectThat(endpoints)
            .isEqualTo(expectedEndpoints)
    }

    @Test
    internal fun `health should return correct response`() {
        server.enqueue(
            okJsonResponse("responses/health_response_200.json")
        )
        val baseUrl = server.url("/actuator").toString()
        val client = getClient(baseUrl)
        val health = client.health().getOrThrow()
        expectThat(health.status)
            .isEqualTo(HealthActuatorResponse.Status.UP)
    }

    @Test
    internal fun `healthComponent should return correct response`() {
        server.enqueue(
            okJsonResponse("responses/health_component_response_200.json")
        )
        val baseUrl = server.url("/actuator").toString()
        val client = getClient(baseUrl)
        val health = client.healthComponent("db").getOrThrow()
        expectThat(health.status)
            .isEqualTo(HealthActuatorResponse.Status.UP)
    }

    @Test
    internal fun `info should return correct response`() {
        server.enqueue(okJsonResponse("responses/info_response_200.json"))
        val baseUrl = server.url("/actuator").toString()
        val client = getClient(baseUrl)
        val info = client.info().getOrThrow()
        expectThat(info.build?.artifact)
            .isEqualTo("test")
        expectThat(info.git?.branch)
            .isEqualTo("develop")
    }

    @Test
    internal fun `caches should return correct response`() {
        server.enqueue(okJsonResponse("responses/caches_response_200.json"))
        val baseUrl = server.url("/actuator").toString()
        val client = getClient(baseUrl)
        val caches = client.caches().getOrThrow()
        expectThat(caches.cacheManagers.size)
            .isEqualTo(2)
        expectThat(caches.cacheManagers.values.first().caches.size)
            .isEqualTo(30)
    }

    @Test
    internal fun `cache should return correct response`() {
        val expectedResult = CacheActuatorResponse(
            target = "java.util.concurrent.ConcurrentHashMap",
            name = "example28",
            cacheManager = "primeCacheManager"
        )
        server.enqueue(okJsonResponse("responses/cache_response_200.json"))
        val baseUrl = server.url("/actuator").toString()
        val client = getClient(baseUrl)
        val cache = client.cache("cache").getOrThrow()
        expectThat(cache)
            .isEqualTo(expectedResult)
    }

    @Test
    internal fun `evictAllCaches should succeed on 204`() {
        server.enqueue(okResponse(204))
        val baseUrl = server.url("/actuator").toString()
        val client = getClient(baseUrl)
        client.evictAllCaches()
    }

    @Test
    internal fun `evictCache should succeed on 204`() {
        server.enqueue(okResponse(204))
        val baseUrl = server.url("/actuator").toString()
        val client = getClient(baseUrl)
        client.evictCache("cache")
    }

    @Test
    internal fun `beans should return correct response`() {
        server.enqueue(okJsonResponse("responses/beans_response_200.json"))
        val baseUrl = server.url("/actuator").toString()
        val client = getClient(baseUrl)
        val beans = client.beans().getOrThrow()
        expectThat(beans.contexts.size)
            .isEqualTo(1)
    }

    @Test
    internal fun `mappings should return correct response`() {
        server.enqueue(okJsonResponse("responses/mappings_response_200.json"))
        val baseUrl = server.url("/actuator").toString()
        val client = getClient(baseUrl)
        val mappings = client.mappings().getOrThrow()
        expectThat(mappings.contexts.size)
            .isEqualTo(1)
    }

    @Test
    internal fun `metrics should return correct response`() {
        server.enqueue(okJsonResponse("responses/metrics_response_200.json"))
        val baseUrl = server.url("/actuator").toString()
        val client = getClient(baseUrl)
        val metrics = client.metrics().getOrThrow()
        expectThat(metrics.names.size)
            .isEqualTo(61)
    }

    @Test
    internal fun `metric should return correct response`() {
        server.enqueue(okJsonResponse("responses/metric_response_200.json"))
        val baseUrl = server.url("/actuator").toString()
        val client = getClient(baseUrl)
        val metric = client.metric("jvm.memory.max").getOrThrow()
        expectThat(metric.name)
            .isEqualTo("jvm.memory.max")
    }

    @Test
    internal fun `env should return correct response`() {
        server.enqueue(okJsonResponse("responses/env_response_200.json"))
        val baseUrl = server.url("/actuator").toString()
        val client = getClient(baseUrl)
        val env = client.env().getOrThrow()
        expectThat(env.activeProfiles.size)
            .isEqualTo(2)
    }

    @Test
    internal fun `envProperty should return correct response`() {
        server.enqueue(okJsonResponse("responses/env_property_response_200.json"))
        val baseUrl = server.url("/actuator").toString()
        val client = getClient(baseUrl)
        val env = client.envProperty("spring.application.name").getOrThrow()
        expectThat(env.property.value)
            .isEqualTo("1")
    }

    @Test
    internal fun `configProps should return correct response`() {
        server.enqueue(okJsonResponse("responses/config_props_response_200.json"))
        val baseUrl = server.url("/actuator").toString()
        val client = getClient(baseUrl)
        val configProps = client.configProps().getOrThrow()
        expectThat(configProps.contexts.size)
            .isEqualTo(1)
    }

    @Test
    internal fun `flyway should return correct response`() {
        server.enqueue(okJsonResponse("responses/flyway_response_200.json"))
        val baseUrl = server.url("/actuator").toString()
        val client = getClient(baseUrl)
        val flyway = client.flyway().getOrThrow()
        expectThat(flyway.contexts.size)
            .isEqualTo(1)
        expectThat(flyway.contexts.values.first().flywayBeans.values.first().migrations.size)
            .isEqualTo(7)
    }

    @Test
    internal fun `liquibase should return correct response`() {
        server.enqueue(okJsonResponse("responses/liquibase_response_200.json"))
        val baseUrl = server.url("/actuator").toString()
        val client = getClient(baseUrl)
        val liquibase = client.liquibase().getOrThrow()
        expectThat(liquibase.contexts.size)
            .isEqualTo(1)
        expectThat(liquibase.contexts.values.first().liquibaseBeans.values.first().changeSets.size)
            .isEqualTo(4)
    }

    @Test
    internal fun `threadDump should return correct response`() {
        server.enqueue(okJsonResponse("responses/thread_dump_response_200.json"))
        val baseUrl = server.url("/actuator").toString()
        val client = getClient(baseUrl)
        val threadDump = client.threadDump().getOrThrow()
        expectThat(threadDump.threads.size)
            .isEqualTo(35)
    }

    @Test
    internal fun `loggers should return correct response`() {
        server.enqueue(okJsonResponse("responses/loggers_response_200.json"))
        val baseUrl = server.url("/actuator").toString()
        val client = getClient(baseUrl)
        val loggers = client.loggers().getOrThrow()
        expectThat(loggers.loggers.size)
            .isEqualTo(910)
    }

    @Test
    internal fun `updateLogger should succeed on 204`() {
        server.enqueue(okResponse(204))
        val baseUrl = server.url("/actuator").toString()
        val client = getClient(baseUrl)
        client.updateLogger("logger", "OFF").getOrThrow()
    }

    @Test
    fun `integrationgraph should return correct response`() {
        server.enqueue(okJsonResponse("responses/integrationgraph_response_200.json"))
        val baseUrl = server.url("/actuator").toString()
        val client = getClient(baseUrl)
        val integrationGraph = client.integrationGraph().getOrThrow()
        expectThat(integrationGraph.nodes.size)
            .isEqualTo(36)
        expectThat(integrationGraph.links.size)
            .isEqualTo(28)
        val firstLink = integrationGraph.links.first()
        expectThat(firstLink.from)
            .isEqualTo(19)
        expectThat(firstLink.to)
            .isEqualTo(15)
        expectThat(firstLink.type)
            .isEqualTo("output")
    }

    @Test
    fun `scheduledtasks should return correct response`() {
        server.enqueue(okJsonResponse("responses/scheduledtasks_response_200.json"))
        val baseUrl = server.url("/actuator").toString()
        val client = getClient(baseUrl)
        val scheduledTasks = client.scheduledTasks().getOrThrow()
        expectThat(scheduledTasks.cron.size)
            .isEqualTo(1)
    }

    @Test
    fun `quartz should return correct response`() {
        server.enqueue(okJsonResponse("responses/quartz_response_200.json"))
        val baseUrl = server.url("/actuator").toString()
        val client = getClient(baseUrl)
        val quartz = client.quartz().getOrThrow()
        expectThat(quartz.jobs.groups.size)
            .isEqualTo(1)
    }

    @Test
    fun `quartz jobs should return correct response`() {
        server.enqueue(okJsonResponse("responses/quartz_jobs_response_200.json"))
        val baseUrl = server.url("/actuator").toString()
        val client = getClient(baseUrl)
        val quartzJobs = client.quartzJobs().getOrThrow()
        expectThat(quartzJobs.groups["DEFAULT"]!!.jobs.size)
            .isEqualTo(1)
    }

    @Test
    fun `quartz jobs by group should return correct response`() {
        server.enqueue(okJsonResponse("responses/quartz_jobs_by_group_response_200.json"))
        val baseUrl = server.url("/actuator").toString()
        val client = getClient(baseUrl)
        val quartzJobs = client.quartzJobsByGroup("DEFAULT").getOrThrow()
        expectThat(quartzJobs.jobs.size)
            .isEqualTo(1)
    }

    @Test
    fun `quartz job should return correct response`() {
        server.enqueue(okJsonResponse("responses/quartz_job_response_200.json"))
        val baseUrl = server.url("/actuator").toString()
        val client = getClient(baseUrl)
        val quartzJob = client.quartzJob("DEFAULT", "sampleSimpleJob").getOrThrow()
        expectThat(quartzJob.name)
            .isEqualTo("sampleSimpleJob")
        expectThat(quartzJob.group)
            .isEqualTo("DEFAULT")
        expectThat(quartzJob.className)
            .isEqualTo("dev.krud.springbootadmin.client.SampleJob")
        expectThat(quartzJob.triggers)
            .isNotEmpty()
        val firstTrigger = quartzJob.triggers.first()
        expectThat(firstTrigger.name)
            .isEqualTo("Quartz_CronTrigger")
    }

    @Test
    fun `quartz triggers should return correct response`() {
        server.enqueue(okJsonResponse("responses/quartz_triggers_response_200.json"))
        val baseUrl = server.url("/actuator").toString()
        val client = getClient(baseUrl)
        val quartzTriggers = client.quartzTriggers().getOrThrow()
        expectThat(quartzTriggers.groups.size)
            .isEqualTo(1)
        val firstGroup = quartzTriggers.groups["DEFAULT"]
        expectThat(firstGroup)
            .isNotNull()
        expectThat(firstGroup!!.triggers.size)
            .isEqualTo(4)
    }

    @Test
    fun `quartz triggers by group should return correct response`() {
        server.enqueue(okJsonResponse("responses/quartz_triggers_by_group_response_200.json"))
        val baseUrl = server.url("/actuator").toString()
        val client = getClient(baseUrl)
        val quartzTriggers = client.quartzTriggersByGroup("DEFAULT").getOrThrow()
        expectThat(quartzTriggers.triggers.cron.size)
            .isEqualTo(2)
    }

    @Test
    fun `quartz trigger should return correct response`() {
        server.enqueue(okJsonResponse("responses/quartz_trigger_response_200.json"))
        val baseUrl = server.url("/actuator").toString()
        val client = getClient(baseUrl)
        val quartzTrigger = client.quartzTrigger("DEFAULT", "Quartz_CronTrigger").getOrThrow()
        expectThat(quartzTrigger.name)
            .isEqualTo("Quartz_CronTrigger")
    }

    @Test
    fun `bad SSL should fail if verification is not disabled`() {
        val url = "https://self-signed.badssl.com/"
        val client = getClient(url)
        val result = client.testConnection()
        expect {
            that(result.success)
                .isFalse()
            that(result.statusCode)
                .isEqualTo(-3)
        }
    }

    @Test
    fun `bad SSL should succeed if verification is disabled`() {
        val url = "https://self-signed.badssl.com/"
        val client = getClient(url, true)
        val result = client.testConnection()
        expect {
            that(result.success)
                .isTrue()
            that(result.statusCode)
                .isEqualTo(200)
        }
    }

    private fun okResponse(code: Int = 200) = MockResponse()
        .setResponseCode(code)

    private fun okJsonResponse(jsonFilePath: String, code: Int = 200, contentType: String = "application/vnd.spring-boot.actuator.v3+json") =
        okFileResponse(jsonFilePath, contentType, code)
            .setHeader("Content-Type", contentType)

    private fun okFileResponse(filePath: String, contentType: String, code: Int = 200) = okResponse(code)
        .setHeader("Content-Type", contentType)
        .setBody(loadJson(filePath))

    private fun loadJson(path: String): String {
        return javaClass
            .classLoader
            .getResourceAsStream(path)
            .readAllBytes()
            .toString(Charsets.UTF_8)
    }

    private fun getClient(baseUrl: String, disableSslVerification: Boolean = false): ActuatorHttpClient {
        val client = ActuatorHttpClientImpl(baseUrl, disableSslVerification = disableSslVerification)
        client.objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, true)
        return client
    }
}