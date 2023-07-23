package dev.krud.boost.daemon.configuration.instance.heapdump.messaging

import dev.krud.boost.daemon.base.annotations.GenerateTypescript
import dev.krud.boost.daemon.base.messaging.AbstractMessage
import dev.krud.boost.daemon.configuration.instance.heapdump.model.InstanceHeapdumpReference
import dev.krud.boost.daemon.websocket.replay.webSocketHeaders
import java.util.*

class InstanceHeapdumpDownloadProgressMessage(
    payload: Payload
) : AbstractMessage<InstanceHeapdumpDownloadProgressMessage.Payload>(
    payload,
    *webSocketHeaders(
        "/topic/instanceHeapdumpDownloadProgress",
        payload.referenceId.toString()
    )
) {

    @GenerateTypescript
    data class Payload(
        val referenceId: UUID,
        val instanceId: UUID,
        val bytesRead: Long,
        val contentLength: Long,
        val status: InstanceHeapdumpReference.Status,
        val error: String? = null
    )
}