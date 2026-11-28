package expo.modules.crispsdk

import im.crisp.sdk.model.AnimationFile
import im.crisp.sdk.model.AudioFile
import im.crisp.sdk.model.Carousel
import im.crisp.sdk.model.Field
import im.crisp.sdk.model.File
import im.crisp.sdk.model.MessageContent
import im.crisp.sdk.model.Picker
import java.net.MalformedURLException
import java.net.URL

/**
 * Converts the JS `MessageContent` of `showMessage` to a native [MessageContent].
 * Discriminated by its `type`: text, file, animation, audio, picker, field, carousel.
 *
 * @throws IllegalArgumentException for an unknown type, or a missing or invalid required field.
 */
object ContentParser {
  fun fromMap(map: Map<String, Any?>): MessageContent = when (val type = map.string("type")) {
    "text" -> MessageContent.TextContent(map.string("text"))
    "file" -> MessageContent.FileContent(File(map.string("name"), map.string("mimeType"), map.url("url")))
    "animation" -> MessageContent.AnimationContent(AnimationFile(map.string("mimeType"), map.url("url")))
    "audio" -> MessageContent.AudioContent(
      AudioFile(map.string("mimeType"), map.url("url"), map.number("duration").toInt())
    )
    "picker" -> MessageContent.PickerContent(
      Picker(map.string("id"), map.string("text"), map.list("choices").mapNotNull(::choice))
    )
    // `required` has no equivalent in Crisp Android 3.x
    "field" -> MessageContent.FieldContent(
      Field(map.string("id"), map.string("text"), map["explain"] as? String ?: "")
    )
    "carousel" -> MessageContent.CarouselContent(
      Carousel(map.string("text"), map.list("targets").mapNotNull(::target))
    )
    else -> throw IllegalArgumentException("Unknown message content type: $type")
  }

  // Choices without value or label are skipped, as in previous versions
  private fun choice(map: Map<String, Any?>): Picker.Choice? {
    val value = map["value"] as? String ?: return null
    val label = map["label"] as? String ?: return null
    return Picker.Choice(label = label, selected = map["selected"] as? Boolean ?: false, value = value)
  }

  // Targets without title are skipped, as in previous versions
  private fun target(map: Map<String, Any?>): Carousel.Target? {
    val title = map["title"] as? String ?: return null
    val actions = (map["actionUrl"] as? String)
      ?.let { listOf(Carousel.Target.Action("Open", parseUrl("actionUrl", it))) }
      ?: emptyList()
    return Carousel.Target(
      title = title,
      description = map["description"] as? String ?: "",
      image = (map["imageUrl"] as? String)?.let { parseUrl("imageUrl", it) },
      actions = actions
    )
  }

  private fun Map<String, Any?>.string(key: String): String =
    this[key] as? String ?: throw IllegalArgumentException("Missing required field: $key")

  private fun Map<String, Any?>.number(key: String): Number =
    this[key] as? Number ?: throw IllegalArgumentException("Missing required field: $key")

  private fun Map<String, Any?>.url(key: String): URL = parseUrl(key, string(key))

  @Suppress("UNCHECKED_CAST")
  private fun Map<String, Any?>.list(key: String): List<Map<String, Any?>> =
    (this[key] as? List<*>)?.filterIsInstance<Map<String, Any?>>()
      ?: throw IllegalArgumentException("Missing required field: $key")

  private fun parseUrl(key: String, value: String): URL = try {
    URL(value)
  } catch (e: MalformedURLException) {
    throw IllegalArgumentException("Invalid URL in field $key: $value", e)
  }
}
