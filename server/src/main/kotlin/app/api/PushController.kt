package app.api

import app.config.AppProperties
import app.util.*
import org.springframework.http.ResponseEntity
import org.springframework.http.ResponseEntity.ok
import org.springframework.web.bind.annotation.*
import app.util.getLogger
import com.fasterxml.jackson.annotation.JsonProperty
import okhttp3.MediaType
import okhttp3.OkHttpClient
import org.springframework.http.ResponseEntity.status

/**
 *
 * @author nsoushi
 */
@RestController
@RequestMapping(value = "/push")
class PushController(val appProperties: AppProperties) {

    val log = getLogger(PushController::class)
    val iidUrl = "https://iid.googleapis.com/iid/v1"

    @CrossOrigin(origins = arrayOf("http://localhost"))
    @PostMapping
    fun post(@RequestParam(required = false) topic: String?, @RequestBody req: Request): ResponseEntity<String> {

        val payload = req.payload ?: throw IllegalArgumentException();
        val to = topic ?: req.to
        val content = objectMapper().writeValueAsString(FcmRequest(to,
                        Payload(payload.title, payload.body, payload.tag, payload.icon, payload.clickAction),
                        CustomPayload(topic)))
        val body = okhttp3.RequestBody.create(MediaType.parse("application/json"), content)

        val request = okhttp3.Request.Builder()
                .url(appProperties.serverUrl)
                .header("Authorization", "key=%s".format(appProperties.serverKey))
                .header("Content-Type", "application/json")
                .post(body)
                .build()
        val client = OkHttpClient.Builder().build()
        val response = client.newCall(request).execute()

        return response.body().use { body ->
            val responseBody = body.string()
            log.info("body:%s".format(content))
            log.info("response:%s".format(responseBody))
            status(response.code()).json().body(responseBody)
        }
    }

    @CrossOrigin(origins = arrayOf("http://localhost"))
    @PostMapping(value = "/token")
    fun postToken(@RequestBody req: Request): ResponseEntity<String> {
        // TODO("storage token")
        log.info("IID_TOKEN:%s".format(req.to))
        return ok().json().body("received to")
    }

    @CrossOrigin(origins = arrayOf("http://localhost"))
    @PostMapping(value = "/topic/{token}")
    fun postTopic(@RequestParam topic: String, @PathVariable token: String): ResponseEntity<String> {

        val body = okhttp3.RequestBody.create(MediaType.parse("application/json"), "{}")
        val request = okhttp3.Request.Builder()
                .url("%s/%s/rel%s".format(iidUrl, token, topic))
                .header("Authorization", "key=%s".format(appProperties.serverKey))
                .header("Content-Type", "application/json")
                .header("Content-Length", "0")
                .post(body)
                .build()
        val client = OkHttpClient.Builder().build()
        val response = client.newCall(request).execute()

        return response.body().use { body ->
            status(response.code()).json().body(body.string())
        }
    }

    @CrossOrigin(origins = arrayOf("http://localhost"))
    @DeleteMapping(value = "/topic/{token}")
    fun deleteTopic(@RequestParam topic: String, @PathVariable token: String): ResponseEntity<String> {

        val request = okhttp3.Request.Builder()
                .url("%s/%s/rel%s".format(iidUrl, token, topic))
                .header("Authorization", "key=%s".format(appProperties.serverKey))
                .header("Content-Type", "application/json")
                .header("Content-Length", "0")
                .delete()
                .build()
        val client = OkHttpClient.Builder().build()
        val response = client.newCall(request).execute()

        return response.body().use { body ->
            status(response.code()).json().body(body.string())
        }
    }

    data class FcmRequest(
            val to: String,
            val notification: Payload,
            val data: CustomPayload
    )

    data class Payload(
            val title: String,
            val body: String,
            val tag: String,
            val icon: String,
            @JsonProperty("click_action")
            val clickAction: String)

    data class CustomPayload(
            val topic: String?
    )

    data class Request(
            val to: String,
            val payload: Payload?)
}